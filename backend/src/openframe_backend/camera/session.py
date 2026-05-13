from collections.abc import Iterator
from pathlib import Path
from threading import Lock

from openframe_backend.camera.registry import create_camera_adapter
from openframe_backend.domain.models import CameraStatus
from openframe_backend.domain.ports import CameraAdapter, FrameCaptureResult
from openframe_backend.exceptions import CameraError


class CameraManager:
    def __init__(self, default_camera_id: str = "mock") -> None:
        self._default_camera_id = default_camera_id
        self._adapter: CameraAdapter | None = None
        self._lock = Lock()

    @property
    def adapter(self) -> CameraAdapter | None:
        return self._adapter

    def connect(self, camera_id: str | None = None) -> CameraAdapter:
        with self._lock:
            if self._adapter is not None:
                self._adapter.disconnect()
                self._adapter = None

            adapter = create_camera_adapter(camera_id or self._default_camera_id)
            self._adapter = adapter
            adapter.connect()
            return adapter

    def disconnect(self) -> None:
        with self._lock:
            if self._adapter is not None:
                self._adapter.disconnect()
            self._adapter = None

    def status(self) -> dict[str, str | None]:
        if self._adapter is None:
            return {
                "camera_id": None,
                "label": None,
                "status": CameraStatus.DISCONNECTED,
                "message": None,
            }
        return {
            "camera_id": self._adapter.id,
            "label": self._adapter.label,
            "status": self._adapter.status,
            "message": self._adapter.message,
        }

    def liveview_frames(self) -> Iterator[bytes]:
        if self._adapter is None or self._adapter.status != CameraStatus.CONNECTED:
            raise CameraError("No connected camera")
        return self._adapter.liveview_frames()

    def capture_frame(self, destination: Path) -> FrameCaptureResult:
        if self._adapter is None or self._adapter.status != CameraStatus.CONNECTED:
            raise CameraError("No connected camera")
        return self._adapter.capture_frame(destination)
