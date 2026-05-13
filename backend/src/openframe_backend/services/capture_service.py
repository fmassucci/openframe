from __future__ import annotations

from pathlib import Path
import shutil
import subprocess

from openframe_backend.camera.session import CameraManager
from openframe_backend.domain.models import FrameRecord
from openframe_backend.exceptions import CaptureError, ExportError
from openframe_backend.storage.project_store import ProjectStore


class CaptureService:
    def __init__(self, project_store: ProjectStore, camera_manager: CameraManager) -> None:
        self._project_store = project_store
        self._camera_manager = camera_manager

    def capture_frame(self, project_id: str) -> FrameRecord:
        destination = self._project_store.next_frame_path(project_id)
        try:
            result = self._camera_manager.capture_frame(destination)
        except Exception as exc:
            raise CaptureError(str(exc)) from exc

        return self._project_store.add_frame(project_id, result.path)

    def export_video(self, project_id: str, fps: int = 12) -> Path:
        project = self._project_store.get_project(project_id)
        if not project.frames:
            raise ExportError("Project has no frames to export")

        ffmpeg = resolve_ffmpeg_executable()
        if ffmpeg is None:
            raise ExportError("ffmpeg was not found on PATH and bundled ffmpeg is unavailable")

        output_path = self._project_store.export_path(project_id)
        frame_pattern = project.root_path / "frames" / "frame_%06d.jpg"
        result = subprocess.run(
            [
                ffmpeg,
                "-y",
                "-framerate",
                str(fps),
                "-i",
                str(frame_pattern),
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                str(output_path),
            ],
            capture_output=True,
            check=False,
            text=True,
            timeout=300,
        )
        if result.returncode != 0:
            raise ExportError(result.stderr.strip() or "ffmpeg export failed")
        return output_path


def resolve_ffmpeg_executable() -> str | None:
    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg

    try:
        import imageio_ffmpeg
    except ImportError:
        return None

    try:
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None
