import { useEffect, useMemo, useState } from "react";

import { apiClient } from "./api/client";
import { CaptureWorkspace } from "./components/CaptureWorkspace";
import { DeleteProjectDialog } from "./components/DeleteProjectDialog";
import { NewProjectDialog } from "./components/NewProjectDialog";
import { OpenProjectDialog } from "./components/OpenProjectDialog";
import { ProjectMenu } from "./components/ProjectMenu";
import { TopBar } from "./components/TopBar";
import type {
  AppConfig,
  CameraId,
  CameraStatus,
  Frame,
  OnionSkinSettings,
  Project
} from "./types";

const disconnectedCamera: CameraStatus = {
  camera_id: null,
  label: null,
  status: "disconnected",
  message: null
};

const fallbackConfig: AppConfig = {
  default_projects_dir: "",
  path_separator: "/"
};

type DialogKind = null | "new" | "open" | "delete";

export function App() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>(disconnectedCamera);
  const [onionSkin, setOnionSkin] = useState<OnionSkinSettings>({ enabled: true, opacity: 0.45 });
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [config, setConfig] = useState<AppConfig>(fallbackConfig);
  const [dialog, setDialog] = useState<DialogKind>(null);

  const lastFrame = useMemo(
    () => (frames.length > 0 ? frames[frames.length - 1] : null),
    [frames]
  );

  useEffect(() => {
    void refreshInitialState();
  }, []);

  async function refreshInitialState() {
    try {
      const [loadedProjects, status, loadedConfig] = await Promise.all([
        apiClient.listProjects(),
        apiClient.getCameraStatus(),
        apiClient.getConfig().catch(() => fallbackConfig)
      ]);
      setCameraStatus(status);
      setConfig(loadedConfig);

      if (loadedProjects.length > 0) {
        setCurrentProject(loadedProjects[0]);
        setFrames(await apiClient.listFrames(loadedProjects[0].id));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load OpenFrame state");
    }
  }

  async function createProject(name: string, parentDir: string | null) {
    await runBusy(async () => {
      const project = await apiClient.createProject(name, parentDir);
      setCurrentProject(project);
      setFrames([]);
      setMessage(`Created project · ${project.name}`);
      setDialog(null);
    });
  }

  async function openProjectByPath(rootPath: string) {
    await runBusy(async () => {
      const project = await apiClient.openProject(rootPath);
      setCurrentProject(project);
      setFrames(await apiClient.listFrames(project.id));
      setMessage(`Opened project · ${project.name}`);
      setDialog(null);
    });
  }

  async function selectExistingProject(projectId: string) {
    await runBusy(async () => {
      const project = await apiClient.selectProject(projectId);
      setCurrentProject(project);
      setFrames(await apiClient.listFrames(project.id));
      setMessage(`Switched to · ${project.name}`);
      setDialog(null);
    });
  }

  async function deleteCurrentProject() {
    if (!currentProject) return;
    const name = currentProject.name;
    await runBusy(async () => {
      await apiClient.deleteProject(currentProject.id);
      setCurrentProject(null);
      setFrames([]);
      setMessage(`Deleted project · ${name}`);
      setDialog(null);
    });
  }

  async function connectCamera(cameraId: CameraId) {
    await runBusy(async () => {
      const status = await apiClient.connectCamera(cameraId);
      setCameraStatus(status);
      setMessage(status.message ?? `Connected ${status.label}`);
    });
  }

  async function disconnectCamera() {
    await runBusy(async () => {
      const status = await apiClient.disconnectCamera();
      setCameraStatus(status);
      setMessage("Camera disconnected");
    });
  }

  async function captureFrame() {
    if (!currentProject) {
      setMessage("Create or open a project before capturing");
      return;
    }

    await runBusy(async () => {
      const frame = await apiClient.captureFrame(currentProject.id);
      setFrames((existing) => [...existing, frame]);
      setCurrentProject({ ...currentProject, frame_count: currentProject.frame_count + 1 });
      setMessage(`Captured ${frame.filename}`);
    });
  }

  async function exportVideo() {
    if (!currentProject) {
      setMessage("Create or open a project before exporting");
      return;
    }

    await runBusy(async () => {
      const result = await apiClient.exportVideo(currentProject.id, 12);
      setMessage(`Saved video · ${result.path}`);
    });
  }

  async function runBusy(task: () => Promise<void>) {
    setIsBusy(true);
    setMessage(null);
    try {
      await task();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "OpenFrame action failed");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <TopBar cameraStatus={cameraStatus} currentProject={currentProject} />

      <div className="app-body">
        <ProjectMenu
          cameraStatus={cameraStatus}
          currentProject={currentProject}
          isBusy={isBusy}
          message={message}
          onCaptureFrame={captureFrame}
          onConnectCamera={connectCamera}
          onDisconnectCamera={disconnectCamera}
          onExportVideo={exportVideo}
          onRequestNewProject={() => setDialog("new")}
          onRequestOpenProject={() => setDialog("open")}
          onRequestDeleteProject={() => setDialog("delete")}
        />

        <CaptureWorkspace
          cameraStatus={cameraStatus}
          frames={frames}
          lastFrame={lastFrame}
          onionSkin={onionSkin}
          onOnionSkinChange={setOnionSkin}
        />
      </div>

      {dialog === "new" ? (
        <NewProjectDialog
          defaultParent={config.default_projects_dir}
          pathSeparator={config.path_separator}
          isBusy={isBusy}
          onClose={() => setDialog(null)}
          onSubmit={createProject}
        />
      ) : null}

      {dialog === "open" ? (
        <OpenProjectDialog
          isBusy={isBusy}
          currentProjectId={currentProject?.id ?? null}
          onClose={() => setDialog(null)}
          onOpenPath={openProjectByPath}
          onSelectExisting={selectExistingProject}
        />
      ) : null}

      {dialog === "delete" && currentProject ? (
        <DeleteProjectDialog
          project={currentProject}
          isBusy={isBusy}
          onClose={() => setDialog(null)}
          onConfirm={deleteCurrentProject}
        />
      ) : null}
    </main>
  );
}
