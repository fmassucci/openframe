from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from openframe_backend.api.dependencies import get_project_store
from openframe_backend.exceptions import ProjectNotFoundError
from openframe_backend.storage.project_store import ProjectStore

router = APIRouter(prefix="/media", tags=["media"])


@router.get("/{project_id}/frames/{filename}")
def frame_media(
    project_id: str,
    filename: str,
    project_store: ProjectStore = Depends(get_project_store),
) -> FileResponse:
    try:
        return FileResponse(project_store.get_frame_path(project_id, filename))
    except ProjectNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

