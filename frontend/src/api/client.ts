import type { AppConfig, CameraStatus, Frame, Project } from "../types";

const fallbackBackendUrl = "http://127.0.0.1:4777";

export const backendUrl =
  window.openframe?.backendUrl ?? import.meta.env.VITE_BACKEND_URL ?? fallbackBackendUrl;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${backendUrl}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const detail = await readError(response);
    throw new Error(detail || `${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function readError(response: Response): Promise<string | null> {
  try {
    const payload = (await response.json()) as { detail?: string };
    return payload.detail ?? null;
  } catch {
    return null;
  }
}

export const apiClient = {
  getConfig: () => request<AppConfig>("/api/config"),
  listProjects: () => request<Project[]>("/api/projects"),
  createProject: (name: string, rootPath?: string | null) =>
    request<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name, root_path: rootPath ?? null })
    }),
  openProject: (rootPath: string) =>
    request<Project>("/api/projects/open", {
      method: "POST",
      body: JSON.stringify({ root_path: rootPath })
    }),
  deleteProject: (projectId: string) =>
    request<void>(`/api/projects/${projectId}`, { method: "DELETE" }),
  selectProject: (projectId: string) =>
    request<Project>(`/api/projects/${projectId}/select`, { method: "POST" }),
  listFrames: (projectId: string) => request<Frame[]>(`/api/projects/${projectId}/frames`),
  captureFrame: (projectId: string) =>
    request<Frame>(`/api/projects/${projectId}/frames/capture`, { method: "POST" }),
  exportVideo: (projectId: string, fps = 12) =>
    request<{ path: string }>(`/api/projects/${projectId}/exports/video`, {
      method: "POST",
      body: JSON.stringify({ fps })
    }),
  getCameraStatus: () => request<CameraStatus>("/api/camera/status"),
  connectCamera: (cameraId: "mock" | "canon_5d_mark_ii") =>
    request<CameraStatus>("/api/camera/connect", {
      method: "POST",
      body: JSON.stringify({ camera_id: cameraId })
    }),
  disconnectCamera: () =>
    request<CameraStatus>("/api/camera/disconnect", {
      method: "POST"
    }),
  liveViewUrl: () => `${backendUrl}/api/camera/live-view.mjpeg?nonce=${Date.now()}`,
  mediaUrl: (path: string) => `${backendUrl}${path}`
};
