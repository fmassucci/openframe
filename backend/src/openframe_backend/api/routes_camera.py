from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from openframe_backend.api.dependencies import get_camera_manager
from openframe_backend.api.schemas import CameraConnectRequest, CameraStatusResponse
from openframe_backend.camera.session import CameraManager
from openframe_backend.exceptions import CameraError

router = APIRouter(prefix="/api/camera", tags=["camera"])


@router.get("/status", response_model=CameraStatusResponse)
def camera_status(
    camera_manager: CameraManager = Depends(get_camera_manager),
) -> CameraStatusResponse:
    return CameraStatusResponse(**camera_manager.status())


@router.post("/connect", response_model=CameraStatusResponse)
def connect_camera(
    payload: CameraConnectRequest,
    camera_manager: CameraManager = Depends(get_camera_manager),
) -> CameraStatusResponse:
    try:
        camera_manager.connect(payload.camera_id)
    except CameraError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return CameraStatusResponse(**camera_manager.status())


@router.post("/disconnect", response_model=CameraStatusResponse)
def disconnect_camera(
    camera_manager: CameraManager = Depends(get_camera_manager),
) -> CameraStatusResponse:
    camera_manager.disconnect()
    return CameraStatusResponse(**camera_manager.status())


@router.get("/live-view.mjpeg")
def live_view(
    camera_manager: CameraManager = Depends(get_camera_manager),
) -> StreamingResponse:
    try:
        frames = camera_manager.liveview_frames()
    except CameraError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    def multipart_stream():
        for frame in frames:
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n"
                b"Cache-Control: no-cache\r\n\r\n"
                + frame
                + b"\r\n"
            )

    return StreamingResponse(
        multipart_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )

