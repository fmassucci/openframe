from openframe_backend.camera.canon_5d_mark_ii import Canon5DMarkIIAdapter
from openframe_backend.camera.digicamcontrol import DigiCamControlAdapter
from openframe_backend.camera.mock import MockCameraAdapter
from openframe_backend.config import get_settings
from openframe_backend.domain.models import CameraKind
from openframe_backend.domain.ports import CameraAdapter
from openframe_backend.exceptions import CameraError


def create_camera_adapter(camera_id: str) -> CameraAdapter:
    if camera_id == CameraKind.MOCK:
        return MockCameraAdapter()
    if camera_id == CameraKind.CANON_5D_MARK_II:
        return Canon5DMarkIIAdapter()
    if camera_id == CameraKind.DIGICAMCONTROL:
        return DigiCamControlAdapter(base_url=get_settings().digicamcontrol_url)
    raise CameraError(f"Unsupported camera adapter: {camera_id}")

