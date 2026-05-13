from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path
import shutil
import subprocess
import time

from openframe_backend.domain.models import CameraStatus
from openframe_backend.domain.ports import FrameCaptureResult
from openframe_backend.exceptions import CameraError


class Canon5DMarkIIAdapter:
    id = "canon_5d_mark_ii"
    label = "Canon EOS 5D Mark II"

    def __init__(self, gphoto2_path: str = "gphoto2") -> None:
        self._gphoto2_path = gphoto2_path
        self._status = CameraStatus.DISCONNECTED
        self._message: str | None = None

    @property
    def status(self) -> CameraStatus:
        return self._status

    @property
    def message(self) -> str | None:
        return self._message

    def connect(self) -> None:
        self._status = CameraStatus.CONNECTING

        if shutil.which(self._gphoto2_path) is None:
            self._status = CameraStatus.ERROR
            self._message = "gphoto2 was not found on PATH"
            raise CameraError(self._message)

        result = self._run_text(["--auto-detect"], timeout=10)
        if result.returncode != 0:
            self._status = CameraStatus.ERROR
            self._message = result.stderr.strip() or "Canon camera detection failed"
            raise CameraError(self._message)

        if "Canon" not in result.stdout:
            self._status = CameraStatus.ERROR
            self._message = "No Canon camera was detected by gphoto2"
            raise CameraError(self._message)

        self._status = CameraStatus.CONNECTED
        self._message = "Canon camera connected"

    def disconnect(self) -> None:
        self._status = CameraStatus.DISCONNECTED
        self._message = None

    def liveview_frames(self) -> Iterator[bytes]:
        if self._status != CameraStatus.CONNECTED:
            raise CameraError("Canon camera is not connected")

        while self._status == CameraStatus.CONNECTED:
            result = self._run_binary(["--capture-preview", "--stdout"], timeout=8)
            if result.returncode == 0 and result.stdout:
                yield result.stdout
            else:
                self._message = _decode_stderr(result.stderr) or "Unable to read Canon preview frame"
                time.sleep(0.25)

    def capture_frame(self, destination: Path) -> FrameCaptureResult:
        if self._status != CameraStatus.CONNECTED:
            raise CameraError("Canon camera is not connected")

        destination.parent.mkdir(parents=True, exist_ok=True)
        result = self._run_text(
            [
                "--capture-image-and-download",
                "--force-overwrite",
                "--filename",
                str(destination),
            ],
            timeout=90,
        )
        if result.returncode != 0:
            message = result.stderr.strip() or "Canon capture failed"
            self._message = message
            raise CameraError(message)

        if not destination.exists():
            raise CameraError(f"Canon capture finished but did not create {destination}")

        return FrameCaptureResult(path=destination, metadata={"camera": self.label})

    def _run_text(self, args: list[str], timeout: int) -> subprocess.CompletedProcess[str]:
        command = [self._gphoto2_path, *args]
        return subprocess.run(
            command,
            capture_output=True,
            check=False,
            text=True,
            timeout=timeout,
        )

    def _run_binary(self, args: list[str], timeout: int) -> subprocess.CompletedProcess[bytes]:
        command = [self._gphoto2_path, *args]
        return subprocess.run(
            command,
            capture_output=True,
            check=False,
            timeout=timeout,
        )


def _decode_stderr(stderr: bytes) -> str:
    return stderr.decode("utf-8", errors="replace").strip()
