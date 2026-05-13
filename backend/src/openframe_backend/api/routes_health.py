import os

from fastapi import APIRouter, Depends, Request

from openframe_backend.api.schemas import ConfigResponse
from openframe_backend.config import Settings, get_settings

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "openframe-backend"}


@router.get("/api/config", response_model=ConfigResponse)
def config(
    _request: Request,
    settings: Settings = Depends(get_settings),
) -> ConfigResponse:
    return ConfigResponse(
        default_projects_dir=str(settings.resolved_projects_dir()),
        path_separator=os.sep,
    )

