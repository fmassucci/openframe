import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from "electron";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import path from "node:path";

const backendUrl = process.env.OPENFRAME_BACKEND_URL ?? "http://127.0.0.1:4777";
let backendProcess: ChildProcessWithoutNullStreams | null = null;

function getRepoRoot(): string {
  if (app.isPackaged) {
    return path.dirname(app.getPath("exe"));
  }
  return path.resolve(__dirname, "..", "..");
}

function startBackend(): void {
  if (process.env.OPENFRAME_BACKEND_MANAGED === "0") {
    return;
  }

  const repoRoot = getRepoRoot();
  backendProcess = spawn(
    process.env.OPENFRAME_PYTHON ?? "python",
    [
      "-m",
      "uvicorn",
      "openframe_backend.main:app",
      "--app-dir",
      path.join(repoRoot, "backend", "src"),
      "--host",
      "127.0.0.1",
      "--port",
      "4777"
    ],
    {
      cwd: repoRoot,
      env: process.env,
      stdio: "pipe"
    }
  );

  backendProcess.stdout.on("data", (data: Buffer) => {
    console.log(`[backend] ${data.toString().trim()}`);
  });
  backendProcess.stderr.on("data", (data: Buffer) => {
    console.error(`[backend] ${data.toString().trim()}`);
  });
}

function registerIpc(): void {
  ipcMain.handle(
    "openframe:pickFolder",
    async (event, options: { mode?: "save" | "open"; defaultPath?: string; title?: string } = {}) => {
      const browser = BrowserWindow.fromWebContents(event.sender);
      const result = await dialog.showOpenDialog(browser ?? undefined!, {
        title: options.title ?? (options.mode === "open" ? "Open Project Folder" : "Choose Save Location"),
        defaultPath: options.defaultPath,
        properties:
          options.mode === "open"
            ? ["openDirectory"]
            : ["openDirectory", "createDirectory"],
        buttonLabel: options.mode === "open" ? "Open" : "Choose"
      });
      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }
      return result.filePaths[0];
    }
  );
}

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: "#0a0a0c",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js")
    }
  });

  window.setMenuBarVisibility(false);

  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    void window.loadURL(devServerUrl);
  } else {
    void window.loadFile(path.join(getRepoRoot(), "frontend", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  process.env.OPENFRAME_BACKEND_URL = backendUrl;
  startBackend();
  registerIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});
