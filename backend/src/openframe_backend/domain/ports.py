from collections.abc import Iterator
from dataclasses import dataclass, field
from pathlib import Path
from typing import Protocol

from openframe_backend.domain.models import CameraStatus


@dataclass(frozen=True)
class FrameCaptureResult:
    path: Path
    metadata: dict[str, str] = field(default_factory=dict)


class CameraAdapter(Protocol):
    id: str
    label: str

    @property
    def status(self) -> CameraStatus:
        ...

    @property
    def message(self) -> str | None:
        ...

    def connect(self) -> None:
        ...

    def disconnect(self) -> None:
        ...

    def liveview_frames(self) -> Iterator[bytes]:
        ...

    def capture_frame(self, destination: Path) -> FrameCaptureResult:
        ...

