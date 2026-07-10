# OpenFrame

OpenFrame is a simplified, open-source stop-motion capture tool inspired by professional workflows such as Dragonframe. It is built with a Python backend and an Electron + React + TypeScript desktop frontend.

The first real camera target is the Canon EOS 5D Mark II over USB using `gphoto2`/libgphoto2. A mock camera adapter is included so the application can be developed without DSLR hardware attached.

## Goals

- Capture stop-motion frames from a DSLR live-view workflow.
- Show live video while the camera is connected.
- Overlay the previous captured frame as an onion-skin shadow.
- Organize captures into project folders.
- Export captured frames into a video file.
- Keep camera, project, capture, and UI code separated behind clear boundaries.

## Repository Layout

```text
backend/        FastAPI backend, camera adapters, project storage, capture/export services
electron/       Electron desktop shell and preload bridge
frontend/       React + TypeScript renderer application
docs/           Architecture and implementation roadmap
```

## Development Prerequisites

- Python 3.11+
- Node.js 20+
- `gphoto2` installed and available on `PATH` for Canon camera support
- Optional: `ffmpeg` installed and available on `PATH` for video export. The backend also falls back to the bundled `imageio-ffmpeg` binary for development.

On Windows, Canon USB control through libgphoto2 may require WSL, MSYS2, or a dedicated native integration later. The current Canon adapter is intentionally isolated so the transport can be replaced without changing the rest of the app.

## Install

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e .\backend
npm install
```

## Run

```powershell
npm run dev
```

The development stack starts:

- Backend API: `http://127.0.0.1:4777`
- Vite renderer: `http://127.0.0.1:5173`
- Electron desktop shell

Closing the Electron app window stops the development runner, which also stops the backend and frontend processes it started.

## Camera Modes

- `mock`: Generated live-view frames and stills for development.
- `canon_5d_mark_ii`: Canon EOS 5D Mark II adapter using the `gphoto2` command-line tool.
- `digicamcontrol`: Windows-only adapter that talks to [DigiCamControl](https://digicamcontrol.com/) over its localhost HTTP API. Works without rebinding the Windows USB driver, so File Explorer and Canon EOS Utility keep working when OpenFrame is not actively connected.

Select the camera at runtime with the `OPENFRAME_DEFAULT_CAMERA` env var (e.g. `OPENFRAME_DEFAULT_CAMERA=digicamcontrol`).

### DigiCamControl setup (Windows)

1. Install DigiCamControl from https://digicamcontrol.com/ and launch it.
2. In DigiCamControl, open **File → Settings → Webserver** and tick **Enable webserver**. Leave the port at `5513` (matches the default `OPENFRAME_DIGICAMCONTROL_URL`).
3. Connect the Canon 5D Mark II via USB and confirm DigiCamControl shows it in the camera list.
4. Start OpenFrame with `OPENFRAME_DEFAULT_CAMERA=digicamcontrol`. The adapter expects DigiCamControl to be running with the web server enabled; if it isn't, `connect()` returns a clear error.

DigiCamControl holds the USB session while OpenFrame is connected, so File Explorer can't browse the SD card during a session. Closing OpenFrame (or DigiCamControl) releases the camera back to Windows within a second.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the system plan and module boundaries.
See [docs/CANON_5D_MARK_II.md](docs/CANON_5D_MARK_II.md) for the first camera integration notes.
