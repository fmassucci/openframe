from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from openframe_backend.api import routes_camera, routes_capture, routes_health, routes_media, routes_projects
from openframe_backend.camera.session import CameraManager
from openframe_backend.config import get_settings
from openframe_backend.services.capture_service import CaptureService
from openframe_backend.services.project_service import ProjectService
from openframe_backend.storage.project_store import ProjectStore


def create_app() -> FastAPI:
    settings = get_settings()
    project_store = ProjectStore(settings.resolved_projects_dir())
    camera_manager = CameraManager(default_camera_id=settings.default_camera)
    project_service = ProjectService(project_store)
    capture_service = CaptureService(project_store, camera_manager)

    app = FastAPI(title="OpenFrame Backend", version="0.1.0")
    app.state.settings = settings
    app.state.project_store = project_store
    app.state.project_service = project_service
    app.state.camera_manager = camera_manager
    app.state.capture_service = capture_service

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(routes_health.router)
    app.include_router(routes_projects.router)
    app.include_router(routes_capture.router)
    app.include_router(routes_camera.router)
    app.include_router(routes_media.router)
    return app


app = create_app()
