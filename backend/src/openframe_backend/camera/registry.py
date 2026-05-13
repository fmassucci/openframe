from openframe_backend.camera.canon_5d_mark_ii import Canon5DMarkIIAdapter
from openframe_backend.camera.mock import MockCameraAdapter
from openframe_backend.domain.models import CameraKind
from openframe_backend.domain.ports import CameraAdapter
from openframe_backend.exceptions import CameraError


def create_camera_adapter(camera_id: str) -> CameraAdapter:
    if camera_id == CameraKind.MOCK:
        return MockCameraAdapter()
    if camera_id == CameraKind.CANON_5D_MARK_II:
        return Canon5DMarkIIAdapter()
    raise CameraError(f"Unsupported camera adapter: {camera_id}")

