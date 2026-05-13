# Canon EOS 5D Mark II Integration Notes

The first Canon implementation is intentionally isolated in `backend/src/openframe_backend/camera/canon_5d_mark_ii.py`.

## Current Transport

The adapter shells out to `gphoto2`:

```powershell
gphoto2 --auto-detect
gphoto2 --capture-preview --stdout
gphoto2 --capture-image-and-download --force-overwrite --filename frame_000001.jpg
```

This gives the rest of OpenFrame a stable camera interface while we validate real hardware behavior.

## Known Validation Work

- Confirm the camera is in a USB mode supported by libgphoto2.
- Confirm live preview works reliably on the target OS.
- Confirm capture downloads to the requested project frame path.
- Decide whether Windows support should use native libgphoto2, WSL, MSYS2, or a later vendor-SDK adapter.
- Add camera settings once the capture loop is stable: ISO, shutter speed, aperture, white balance, image quality, and live-view exposure simulation.

## Backend Contract

Any improved Canon implementation should keep the same adapter methods:

- `connect()`
- `disconnect()`
- `liveview_frames()`
- `capture_frame(destination)`

That keeps UI and project code unchanged when the transport is replaced.

