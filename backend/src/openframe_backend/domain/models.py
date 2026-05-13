from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import StrEnum
from pathlib import Path


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class CameraStatus(StrEnum):
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    ERROR = "error"


class CameraKind(StrEnum):
    MOCK = "mock"
    CANON_5D_MARK_II = "canon_5d_mark_ii"


@dataclass(frozen=True)
class FrameRecord:
    index: int
    filename: str
    captured_at: str
    path: Path


@dataclass(frozen=True)
class Project:
    id: str
    name: str
    root_path: Path
    created_at: str
    updated_at: str
    frames: list[FrameRecord] = field(default_factory=list)

    @property
    def frame_count(self) -> int:
        return len(self.frames)

