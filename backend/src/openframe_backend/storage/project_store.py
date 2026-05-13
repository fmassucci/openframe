from __future__ import annotations

import json
import re
import shutil
from pathlib import Path
from uuid import uuid4

from openframe_backend.domain.models import FrameRecord, Project, utc_now_iso
from openframe_backend.exceptions import OpenFrameError, ProjectNotFoundError


class ProjectPathError(OpenFrameError):
    """Raised when a project path is invalid for the requested operation."""


class ProjectStore:
    INDEX_FILENAME = "_index.json"

    def __init__(self, base_dir: Path) -> None:
        self.base_dir = base_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    # ------- listing -------

    def list_projects(self) -> list[Project]:
        projects: dict[str, Project] = {}

        for metadata_path in self.base_dir.glob("*/metadata.json"):
            try:
                project = self._load_project(metadata_path.parent)
                projects[project.id] = project
            except (OSError, json.JSONDecodeError, KeyError, TypeError):
                continue

        for root_path in self._registered_paths():
            if not (root_path / "metadata.json").exists():
                continue
            try:
                project = self._load_project(root_path)
                projects.setdefault(project.id, project)
            except (OSError, json.JSONDecodeError, KeyError, TypeError):
                continue

        return sorted(projects.values(), key=lambda p: p.updated_at, reverse=True)

    # ------- create -------

    def create_project(self, name: str, parent_dir: Path | None = None) -> Project:
        parent = (parent_dir or self.base_dir).expanduser().resolve()
        parent.mkdir(parents=True, exist_ok=True)

        project_id = uuid4().hex
        root_path = parent / f"{_slugify(name)}-{project_id[:8]}"
        if root_path.exists():
            raise ProjectPathError(f"Path already exists: {root_path}")
        root_path.mkdir(parents=True, exist_ok=False)
        (root_path / "frames").mkdir()
        (root_path / "thumbnails").mkdir()
        (root_path / "exports").mkdir()

        now = utc_now_iso()
        metadata = {
            "id": project_id,
            "name": name,
            "created_at": now,
            "updated_at": now,
            "frames": [],
        }
        self._write_metadata(root_path, metadata)
        self._register_path(root_path)
        return self._load_project(root_path)

    # ------- open existing -------

    def open_project(self, root_path: Path) -> Project:
        resolved = root_path.expanduser().resolve()
        if not resolved.exists() or not resolved.is_dir():
            raise ProjectPathError(f"Folder does not exist: {resolved}")
        metadata_file = resolved / "metadata.json"
        if not metadata_file.exists():
            raise ProjectPathError(
                f"Not an OpenFrame project (missing metadata.json): {resolved}"
            )
        try:
            project = self._load_project(resolved)
        except (json.JSONDecodeError, KeyError, TypeError) as exc:
            raise ProjectPathError(f"Invalid project metadata: {resolved}") from exc
        self._register_path(resolved)
        return project

    # ------- delete -------

    def delete_project(self, project_id: str) -> Project:
        project = self.get_project(project_id)
        if project.root_path.exists():
            shutil.rmtree(project.root_path)
        self._unregister_path(project.root_path)
        return project

    # ------- lookup -------

    def get_project(self, project_id: str) -> Project:
        for project in self.list_projects():
            if project.id == project_id:
                return project
        raise ProjectNotFoundError(f"Project not found: {project_id}")

    # ------- frames -------

    def next_frame_path(self, project_id: str) -> Path:
        project = self.get_project(project_id)
        next_index = project.frame_count + 1
        return project.root_path / "frames" / f"frame_{next_index:06d}.jpg"

    def add_frame(self, project_id: str, frame_path: Path) -> FrameRecord:
        project = self.get_project(project_id)
        metadata = self._read_metadata(project.root_path)
        next_index = len(metadata["frames"]) + 1
        captured_at = utc_now_iso()
        frame = {
            "index": next_index,
            "filename": frame_path.name,
            "captured_at": captured_at,
        }
        metadata["frames"].append(frame)
        metadata["updated_at"] = captured_at
        self._write_metadata(project.root_path, metadata)
        return FrameRecord(
            index=next_index,
            filename=frame_path.name,
            captured_at=captured_at,
            path=frame_path,
        )

    def get_frame_path(self, project_id: str, filename: str) -> Path:
        project = self.get_project(project_id)
        frame_path = (project.root_path / "frames" / filename).resolve()
        frames_dir = (project.root_path / "frames").resolve()
        if frames_dir not in frame_path.parents or not frame_path.exists():
            raise ProjectNotFoundError(f"Frame not found: {filename}")
        return frame_path

    def export_path(self, project_id: str, suffix: str = ".mp4") -> Path:
        project = self.get_project(project_id)
        return project.root_path / "exports" / f"{_slugify(project.name)}{suffix}"

    # ------- internal -------

    def _load_project(self, root_path: Path) -> Project:
        metadata = self._read_metadata(root_path)
        frames = [
            FrameRecord(
                index=item["index"],
                filename=item["filename"],
                captured_at=item["captured_at"],
                path=root_path / "frames" / item["filename"],
            )
            for item in metadata.get("frames", [])
        ]
        return Project(
            id=metadata["id"],
            name=metadata["name"],
            root_path=root_path,
            created_at=metadata["created_at"],
            updated_at=metadata["updated_at"],
            frames=frames,
        )

    def _read_metadata(self, root_path: Path) -> dict:
        return json.loads((root_path / "metadata.json").read_text(encoding="utf-8"))

    def _write_metadata(self, root_path: Path, metadata: dict) -> None:
        (root_path / "metadata.json").write_text(
            json.dumps(metadata, indent=2),
            encoding="utf-8",
        )

    # ------- external project registry -------

    def _index_path(self) -> Path:
        return self.base_dir / self.INDEX_FILENAME

    def _registered_paths(self) -> list[Path]:
        path = self._index_path()
        if not path.exists():
            return []
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return []
        raw = payload.get("paths") if isinstance(payload, dict) else None
        if not isinstance(raw, list):
            return []
        return [Path(item) for item in raw if isinstance(item, str)]

    def _register_path(self, root_path: Path) -> None:
        resolved = root_path.expanduser().resolve()
        try:
            if resolved.is_relative_to(self.base_dir.resolve()):
                return
        except AttributeError:
            # Python < 3.9 fallback
            if str(resolved).startswith(str(self.base_dir.resolve())):
                return
        paths = [p for p in self._registered_paths() if p.expanduser().resolve() != resolved]
        paths.insert(0, resolved)
        paths = paths[:32]  # keep most-recent 32
        self._write_index(paths)

    def _unregister_path(self, root_path: Path) -> None:
        resolved = root_path.expanduser().resolve()
        paths = [p for p in self._registered_paths() if p.expanduser().resolve() != resolved]
        self._write_index(paths)

    def _write_index(self, paths: list[Path]) -> None:
        payload = {"paths": [str(p) for p in paths]}
        self._index_path().write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return slug or "openframe-project"
