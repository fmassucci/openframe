class OpenFrameError(Exception):
    """Base exception for expected application errors."""


class ProjectNotFoundError(OpenFrameError):
    pass


class CameraError(OpenFrameError):
    pass


class CaptureError(OpenFrameError):
    pass


class ExportError(OpenFrameError):
    pass

