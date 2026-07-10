from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path
import shutil
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

from openframe_backend.domain.models import CameraStatus
from openframe_backend.domain.ports import FrameCaptureResult
from openframe_backend.exceptions import CameraError


class DigiCamControlAdapter:
    id = "digicamcontrol"
    label = "DigiCamControl"

    def __init__(
        self,
        base_url: str = "http://127.0.0.1:5513",
        liveview_interval: float = 0.1,
        capture_timeout: float = 30.0,
        request_timeout: float = 10.0,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._liveview_interval = liveview_interval
        self._capture_timeout = capture_timeout
        self._request_timeout = request_timeout
        self._status = CameraStatus.DISCONNECTED
        self._message: str | None = None
        self._capture_dir = Path(tempfile.gettempdir()) / "openframe_dcc_captures"

    @property
    def status(self) -> CameraStatus:
        return self._status

    @property
    def message(self) -> str | None:
        return self._message

    def connect(self) -> None:
        self._status = CameraStatus.CONNECTING

        try:
            camera_info = self._slc("list", param1="camera")
        except CameraError as exc:
            self._status = CameraStatus.ERROR
            self._message = (
                f"DigiCamControl web server not reachable at {self._base_url}. "
                "Open DigiCamControl, enable the web server in File > Settings > Webserver, "
                "and ensure the port matches."
            )
            raise CameraError(self._message) from exc

        if "camera." not in camera_info:
            self._status = CameraStatus.ERROR
            self._message = (
                "No camera detected by DigiCamControl. "
                "Confirm the camera is on, USB-connected, and listed in DigiCamControl's device panel."
            )
            raise CameraError(self._message)

        self._capture_dir.mkdir(parents=True, exist_ok=True)
        capture_dir_str = str(self._capture_dir).replace("\\", "/")

        for setting, value in (
            ("session.folder", capture_dir_str),
            ("session.allowoverwrite", "1"),
            ("session.useoriginalfilename", "0"),
        ):
            try:
                self._slc("set", param1=setting, param2=value)
            except CameraError:
                pass

        try:
            self._slc("do", param1="LiveViewWnd_Show")
        except CameraError:
            pass

        self._status = CameraStatus.CONNECTED
        self._message = "DigiCamControl camera connected"

    def disconnect(self) -> None:
        try:
            self._slc("do", param1="LiveViewWnd_Hide")
        except CameraError:
            pass
        self._status = CameraStatus.DISCONNECTED
        self._message = None

    def liveview_frames(self) -> Iterator[bytes]:
        if self._status != CameraStatus.CONNECTED:
            raise CameraError("DigiCamControl camera is not connected")

        url = f"{self._base_url}/liveview.jpg"
        while self._status == CameraStatus.CONNECTED:
            try:
                with urllib.request.urlopen(url, timeout=self._request_timeout) as response:
                    body = response.read()
            except (urllib.error.URLError, TimeoutError) as exc:
                self._message = f"Live-view fetch failed: {exc}"
                time.sleep(self._liveview_interval)
                continue

            if body:
                yield body
            time.sleep(self._liveview_interval)

    def capture_frame(self, destination: Path) -> FrameCaptureResult:
        if self._status != CameraStatus.CONNECTED:
            raise CameraError("DigiCamControl camera is not connected")

        destination.parent.mkdir(parents=True, exist_ok=True)
        self._capture_dir.mkdir(parents=True, exist_ok=True)

        stem = f"openframe-{uuid.uuid4().hex}"
        self._slc("set", param1="session.filenametemplate", param2=stem)

        self._slc("capture", timeout=self._capture_timeout)

        deadline = time.monotonic() + self._capture_timeout
        captured: Path | None = None
        while time.monotonic() < deadline:
            matches = sorted(self._capture_dir.glob(f"{stem}.*"))
            if matches and matches[0].stat().st_size > 0:
                captured = matches[0]
                break
            time.sleep(0.2)

        if captured is None:
            raise CameraError(
                "DigiCamControl capture did not produce a file within the timeout. "
                f"Check the staging folder: {self._capture_dir}"
            )

        final_path = (
            destination
            if captured.suffix.lower() == destination.suffix.lower()
            else destination.with_suffix(captured.suffix)
        )
        if final_path.exists():
            final_path.unlink()
        shutil.move(str(captured), str(final_path))

        return FrameCaptureResult(
            path=final_path,
            metadata={"camera": self.label, "source_name": captured.name},
        )

    def _slc(self, command: str, *, timeout: float | None = None, **params: str) -> str:
        query: dict[str, str] = {"slc": command}
        query.update(params)
        url = f"{self._base_url}/?{urllib.parse.urlencode(query)}"
        try:
            with urllib.request.urlopen(url, timeout=timeout or self._request_timeout) as response:
                return response.read().decode("utf-8", errors="replace")
        except (urllib.error.URLError, TimeoutError) as exc:
            raise CameraError(f"DigiCamControl request failed: {exc}") from exc
