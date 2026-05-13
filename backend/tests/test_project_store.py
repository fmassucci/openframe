from openframe_backend.storage.project_store import ProjectStore


def test_create_project_creates_expected_structure(tmp_path):
    store = ProjectStore(tmp_path)

    project = store.create_project("Test Project")

    assert project.name == "Test Project"
    assert project.root_path.exists()
    assert (project.root_path / "metadata.json").exists()
    assert (project.root_path / "frames").is_dir()
    assert (project.root_path / "exports").is_dir()


def test_add_frame_updates_project_metadata(tmp_path):
    store = ProjectStore(tmp_path)
    project = store.create_project("Capture")
    frame_path = store.next_frame_path(project.id)
    frame_path.write_bytes(b"fake-jpeg")

    frame = store.add_frame(project.id, frame_path)
    updated_project = store.get_project(project.id)

    assert frame.index == 1
    assert frame.filename == "frame_000001.jpg"
    assert updated_project.frame_count == 1
