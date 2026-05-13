from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Response, status

from openframe_backend.api.dependencies import get_project_service
from openframe_backend.api.schemas import (
    CreateProjectRequest,
    FrameResponse,
    OpenProjectRequest,
    ProjectResponse,
    frame_response,
    project_response,
)
from openframe_backend.exceptions import ProjectNotFoundError
from openframe_backend.services.project_service import ProjectService
from openframe_backend.storage.project_store import ProjectPathError

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=list[ProjectResponse])
def list_projects(
    project_service: ProjectService = Depends(get_project_service),
) -> list[ProjectResponse]:
    return [project_response(project) for project in project_service.list_projects()]


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: CreateProjectRequest,
    project_service: ProjectService = Depends(get_project_service),
) -> ProjectResponse:
    parent_dir = Path(payload.root_path) if payload.root_path else None
    try:
        project = project_service.create_project(payload.name, parent_dir=parent_dir)
    except ProjectPathError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return project_response(project)


@router.post("/open", response_model=ProjectResponse)
def open_project(
    payload: OpenProjectRequest,
    project_service: ProjectService = Depends(get_project_service),
) -> ProjectResponse:
    try:
        project = project_service.open_project(Path(payload.root_path))
    except ProjectPathError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return project_response(project)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    project_service: ProjectService = Depends(get_project_service),
) -> ProjectResponse:
    try:
        return project_response(project_service.get_project(project_id))
    except ProjectNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{project_id}/select", response_model=ProjectResponse)
def select_project(
    project_id: str,
    project_service: ProjectService = Depends(get_project_service),
) -> ProjectResponse:
    try:
        return project_response(project_service.select_project(project_id))
    except ProjectNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    project_service: ProjectService = Depends(get_project_service),
) -> Response:
    try:
        project_service.delete_project(project_id)
    except ProjectNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{project_id}/frames", response_model=list[FrameResponse])
def list_frames(
    project_id: str,
    project_service: ProjectService = Depends(get_project_service),
) -> list[FrameResponse]:
    try:
        project = project_service.get_project(project_id)
    except ProjectNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return [frame_response(project.id, frame) for frame in project.frames]
