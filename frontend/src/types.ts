export type Project = {
  id: string;
  name: string;
  root_path: string;
  created_at: string;
  updated_at: string;
  frame_count: number;
};

export type Frame = {
  index: number;
  filename: string;
  captured_at: string;
  url: string;
};

export type CameraId = "mock" | "canon_5d_mark_ii" | "digicamcontrol";

export type CameraStatus = {
  camera_id: string | null;
  label: string | null;
  status: "disconnected" | "connecting" | "connected" | "error";
  message: string | null;
};

export type OnionSkinSettings = {
  enabled: boolean;
  opacity: number;
};

export type AppConfig = {
  default_projects_dir: string;
  path_separator: string;
};
