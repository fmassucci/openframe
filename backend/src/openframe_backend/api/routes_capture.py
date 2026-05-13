from fastapi import APIRouter, Depends, HTTPException, status

from openframe_backend.api.dependencies import get_capture_service
from openframe_backend.api.schemas import (
    ExportVideoRequest,
    ExportVideoResponse,
    FrameResponse,
    frame_response,
)
from openframe_backend.exceptions import CaptureError, ExportError, ProjectNotFoundError
from openframe_backend.services.capture_service import CaptureService

router = APIRouter(prefix="/api/projects", tags=["capture"])


@router.post(
    "/{project_id}/frames/capture",
    response_model=FrameResponse,
    status_code=status.HTTP_201_CREATED,
)
def capture_frame(
    project_id: str,
    capture_service: CaptureService = Depends(get_capture_service),
) -> FrameResponse:
    try:
        frame = capture_service.capture_frame(project_id)
    except ProjectNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except CaptureError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return frame_response(project_id, frame)


@router.post("/{project_id}/exports/video", response_model=ExportVideoResponse)
def export_video(
    project_id: str,
    payload: ExportVideoRequest,
    capture_service: CaptureService = Depends(get_capture_service),
) -> ExportVideoResponse:
    try:
        output_path = capture_service.export_video(project_id, fps=payload.fps)
    except ProjectNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ExportError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return ExportVideoResponse(path=str(output_path))

