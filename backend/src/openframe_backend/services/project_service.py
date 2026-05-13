from pathlib import Path

from openframe_backend.domain.models import Project
from openframe_backend.storage.project_store import ProjectStore


class ProjectService:
    def __init__(self, project_store: ProjectStore) -> None:
        self._project_store = project_store
        self._current_project_id: str | None = None

    @property
    def current_project_id(self) -> str | None:
        return self._current_project_id

    def list_projects(self) -> list[Project]:
        return self._project_store.list_projects()

    def create_project(self, name: str, parent_dir: Path | None = None) -> Project:
        project = self._project_store.create_project(name, parent_dir=parent_dir)
        self._current_project_id = project.id
        return project

    def open_project(self, root_path: Path) -> Project:
        project = self._project_store.open_project(root_path)
        self._current_project_id = project.id
        return project

    def delete_project(self, project_id: str) -> Project:
        project = self._project_store.delete_project(project_id)
        if self._current_project_id == project_id:
            self._current_project_id = None
        return project

    def get_project(self, project_id: str) -> Project:
        return self._project_store.get_project(project_id)

    def select_project(self, project_id: str) -> Project:
        project = self.get_project(project_id)
        self._current_project_id = project.id
        return project
