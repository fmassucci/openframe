# Roadmap

## Milestone 1: Vertical Slice

- Create project.
- Connect mock camera.
- Show live-view stream.
- Capture JPG frames.
- Display last captured frame as onion-skin overlay.
- Export an MP4 when `ffmpeg` is available.

## Milestone 2: Canon 5D Mark II Validation

- Validate `gphoto2 --auto-detect`.
- Validate live preview capture loop.
- Validate full-resolution still capture.
- Add Canon-specific settings for ISO, shutter speed, aperture, and white balance where supported.
- Document USB driver requirements per operating system.

## Milestone 3: Capture Workflow

- Timeline frame selection.
- Retake current frame.
- Delete frame with non-destructive trash.
- Frame notes and exposure metadata.
- Keyboard shortcuts.

## Milestone 4: Production Desktop App

- Packaged Electron app.
- Managed Python backend bundle.
- Crash and error reporting logs.
- First-run diagnostics for camera and ffmpeg.

