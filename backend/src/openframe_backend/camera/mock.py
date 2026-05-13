from __future__ import annotations

from collections.abc import Iterator
from datetime import datetime
from io import BytesIO
from pathlib import Path
import time

from PIL import Image, ImageDraw

from openframe_backend.domain.models import CameraStatus
from openframe_backend.domain.ports import FrameCaptureResult


class MockCameraAdapter:
    id = "mock"
    label = "Mock Camera"

    def __init__(self) -> None:
        self._status = CameraStatus.DISCONNECTED
        self._message: str | None = None
        self._frame_number = 0

    @property
    def status(self) -> CameraStatus:
        return self._status

    @property
    def message(self) -> str | None:
        return self._message

    def connect(self) -> None:
        self._status = CameraStatus.CONNECTED
        self._message = "Mock camera connected"

    def disconnect(self) -> None:
        self._status = CameraStatus.DISCONNECTED
        self._message = None

    def liveview_frames(self) -> Iterator[bytes]:
        if self._status != CameraStatus.CONNECTED:
            self.connect()

        while self._status == CameraStatus.CONNECTED:
            self._frame_number += 1
            yield self._render_jpeg(f"Live {self._frame_number}")
            time.sleep(0.12)

    def capture_frame(self, destination: Path) -> FrameCaptureResult:
        if self._status != CameraStatus.CONNECTED:
            self.connect()

        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(self._render_jpeg(f"Captured {self._frame_number}"))
        return FrameCaptureResult(
            path=destination,
            metadata={"camera": self.label, "captured_at": datetime.utcnow().isoformat()},
        )

    def _render_jpeg(self, label: str) -> bytes:
        width = 1280
        height = 720
        hue = (self._frame_number * 7) % 255
        image = Image.new("RGB", (width, height), (18, 22, 28))
        draw = ImageDraw.Draw(image)

        draw.rectangle((0, 0, width, height), fill=(18, 22, 28))
        draw.rectangle((80, 70, width - 80, height - 70), outline=(80, 180, 170), width=4)
        draw.ellipse((260, 160, 620, 520), fill=(hue, 110, 180), outline=(255, 255, 255), width=3)
        draw.rectangle((700, 180, 1040, 520), fill=(180, 150, hue), outline=(255, 255, 255), width=3)
        draw.line((120, height - 130, width - 120, height - 130), fill=(230, 230, 230), width=2)
        draw.text((110, 95), "OpenFrame Mock Live View", fill=(245, 245, 245))
        draw.text((110, 130), label, fill=(245, 245, 245))

        buffer = BytesIO()
        image.save(buffer, format="JPEG", quality=85)
        return buffer.getvalue()

