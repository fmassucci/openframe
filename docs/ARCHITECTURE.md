# OpenFrame Architecture

## Product Scope

OpenFrame is a desktop stop-motion capture application. The first milestone focuses on project creation, DSLR live-view capture, frame capture, onion-skin overlay, frame browsing, and video export.

## System Shape

```text
Electron main process
  - Starts the Python backend in managed production mode
  - Creates the desktop window
  - Exposes safe runtime metadata through preload

React renderer
  - Capture workspace
  - Project menu
  - Onion-skin controls
  - Frame strip
  - Talks to backend over local HTTP

Python FastAPI backend
  - Camera session management
  - Project and frame storage
  - Capture orchestration
  - Video export orchestration
  - Local media serving
```

## Backend Boundaries

The backend is organized around explicit service and adapter boundaries:

- `api/`: FastAPI routes, request/response schemas, dependency wiring.
- `camera/`: Camera adapters. Adapters hide DSLR-specific transport details.
- `domain/`: Pure models, enums, and protocols.
- `services/`: Application workflows such as creating projects, capturing frames, and exporting video.
- `storage/`: File-system persistence for projects, metadata, frames, thumbnails, and exports.

Camera integrations must implement the `CameraAdapter` protocol. This keeps the UI and capture service independent from Canon-specific transport details.

## Project Storage

Each project is a directory:

```text
Project Name/
  metadata.json
  frames/
    frame_000001.jpg
    frame_000002.jpg
  thumbnails/
  exports/
    project-name.mp4
```

`metadata.json` is the source of truth for project identity and frame records. Image files remain normal files so artists can inspect, back up, or process them with external tools.

## Camera Plan

### Canon EOS 5D Mark II

The first implementation uses the `gphoto2` command-line tool:

- Live view: repeated preview frames streamed as MJPEG.
- Still capture: capture and download into the active project frame folder.
- Detection: `gphoto2 --auto-detect`.

The adapter is intentionally small because real Canon live-view behavior must be validated against hardware and OS-specific USB driver behavior.

### Future Adapters

- Canon cameras through a native libgphoto2 binding.
- Nikon DSLR through libgphoto2.
- Mirrorless cameras through vendor SDKs.
- Folder-watch or video-device adapters for testing and alternate workflows.

## API Surface

Initial endpoints:

- `GET /health`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/{project_id}`
- `POST /api/projects/{project_id}/select`
- `GET /api/projects/{project_id}/frames`
- `POST /api/projects/{project_id}/frames/capture`
- `POST /api/projects/{project_id}/exports/video`
- `GET /api/camera/status`
- `POST /api/camera/connect`
- `POST /api/camera/disconnect`
- `GET /api/camera/live-view.mjpeg`
- `GET /media/{project_id}/frames/{filename}`

## Frontend Screens

Initial UI is intentionally functional:

- Project menu: new project, select current project, connect camera, export video.
- Capture workspace: live view with optional onion-skin shadow of the last captured frame.
- Capture controls: capture frame and set onion-skin opacity.
- Frame strip: recently captured frames.

## Video Export

The backend owns video export through `ffmpeg`. The first implementation exports the project's captured JPG sequence to MP4. Later milestones should add resolution, frame rate, codec, preview render, and export queue controls.

## Testing Strategy

- Domain and storage tests use temporary directories.
- Capture service tests use the mock camera adapter.
- Camera hardware tests are separated and skipped by default.
- Frontend tests should focus on API client behavior and key rendering states.

## Milestones

1. Scaffold backend/frontend and mock capture workflow.
2. Validate Canon 5D Mark II live view and capture on target OS.
3. Add robust project switching and recovery after failed captures.
4. Add thumbnails, timeline selection, frame deletion, and retake workflow.
5. Add packaged desktop builds and managed backend process for releases.

