from fastapi import Request

from openframe_backend.camera.session import CameraManager
from openframe_backend.services.capture_service import CaptureService
from openframe_backend.services.project_service import ProjectService
from openframe_backend.storage.project_store import ProjectStore


def get_project_store(request: Request) -> ProjectStore:
    return request.app.state.project_store


def get_project_service(request: Request) -> ProjectService:
    return request.app.state.project_service


def get_camera_manager(request: Request) -> CameraManager:
    return request.app.state.camera_manager


def get_capture_service(request: Request) -> CaptureService:
    return request.app.state.capture_service

