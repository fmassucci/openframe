from pydantic import BaseModel, Field

from openframe_backend.domain.models import FrameRecord, Project


class CreateProjectRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    root_path: str | None = None


class OpenProjectRequest(BaseModel):
    root_path: str = Field(min_length=1)


class ProjectResponse(BaseModel):
    id: str
    name: str
    root_path: str
    created_at: str
    updated_at: str
    frame_count: int


class FrameResponse(BaseModel):
    index: int
    filename: str
    captured_at: str
    url: str


class CameraConnectRequest(BaseModel):
    camera_id: str = "mock"


class CameraStatusResponse(BaseModel):
    camera_id: str | None
    label: str | None
    status: str
    message: str | None = None


class ExportVideoRequest(BaseModel):
    fps: int = Field(default=12, ge=1, le=60)


class ExportVideoResponse(BaseModel):
    path: str


class ConfigResponse(BaseModel):
    default_projects_dir: str
    path_separator: str


def project_response(project: Project) -> ProjectResponse:
    return ProjectResponse(
        id=project.id,
        name=project.name,
        root_path=str(project.root_path),
        created_at=project.created_at,
        updated_at=project.updated_at,
        frame_count=project.frame_count,
    )


def frame_response(project_id: str, frame: FrameRecord) -> FrameResponse:
    return FrameResponse(
        index=frame.index,
        filename=frame.filename,
        captured_at=frame.captured_at,
        url=f"/media/{project_id}/frames/{frame.filename}",
    )
