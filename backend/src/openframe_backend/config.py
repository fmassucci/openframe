from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="OPENFRAME_",
        extra="ignore",
    )

    backend_host: str = "127.0.0.1"
    backend_port: int = 4777
    projects_dir: Path | None = None
    default_camera: str = "mock"

    def resolved_projects_dir(self) -> Path:
        return self.projects_dir or (Path.home() / "OpenFrame Projects")


@lru_cache
def get_settings() -> Settings:
    return Settings()

