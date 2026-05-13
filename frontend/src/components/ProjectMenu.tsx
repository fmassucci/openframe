import type { CameraStatus, Project } from "../types";

type ProjectMenuProps = {
  cameraStatus: CameraStatus;
  currentProject: Project | null;
  isBusy: boolean;
  message: string | null;
  onCaptureFrame: () => void;
  onConnectCamera: (cameraId: "mock" | "canon_5d_mark_ii") => void;
  onDisconnectCamera: () => void;
  onExportVideo: () => void;
  onRequestNewProject: () => void;
  onRequestOpenProject: () => void;
  onRequestDeleteProject: () => void;
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
};

const compactPath = (path: string, max = 42): string => {
  if (path.length <= max) return path;
  const head = path.slice(0, 14);
  const tail = path.slice(-(max - head.length - 1));
  return `${head}…${tail}`;
};

export function ProjectMenu({
  cameraStatus,
  currentProject,
  isBusy,
  message,
  onCaptureFrame,
  onConnectCamera,
  onDisconnectCamera,
  onExportVideo,
  onRequestNewProject,
  onRequestOpenProject,
  onRequestDeleteProject
}: ProjectMenuProps) {
  const connected = cameraStatus.status === "connected";

  return (
    <aside className="project-menu">
      <section className="menu-section">
        <header className="menu-section__title">
          <span>Project</span>
          <span className="menu-section__rule" />
        </header>

        {currentProject ? (
          <article className="active-project">
            <header className="active-project__header">
              <span className="active-project__eyebrow">Active</span>
              <span className="active-project__frames">
                {currentProject.frame_count.toString().padStart(4, "0")} FR
              </span>
            </header>
            <h3 className="active-project__name" title={currentProject.name}>
              {currentProject.name}
            </h3>
            <dl className="active-project__meta">
              <div>
                <dt>Path</dt>
                <dd title={currentProject.root_path}>{compactPath(currentProject.root_path)}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatDate(currentProject.created_at)}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{formatDate(currentProject.updated_at)}</dd>
              </div>
            </dl>
          </article>
        ) : (
          <div className="active-project active-project--empty">
            <span className="active-project__eyebrow">Inactive</span>
            <p>No project loaded.</p>
            <p className="muted">Create a new one or open an existing folder.</p>
          </div>
        )}

        <div className="project-actions">
          <button
            type="button"
            className="action--primary action--block"
            onClick={onRequestNewProject}
            disabled={isBusy}
          >
            <span>＋ New Project</span>
          </button>
          <div className="project-actions__pair">
            <button
              type="button"
              className="action--block"
              onClick={onRequestOpenProject}
              disabled={isBusy}
            >
              <span>Open…</span>
            </button>
            <button
              type="button"
              className="action--block action--danger-ghost"
              onClick={onRequestDeleteProject}
              disabled={isBusy || !currentProject}
            >
              <span>Delete…</span>
            </button>
          </div>
        </div>
      </section>

      <section className="menu-section">
        <header className="menu-section__title">
          <span>Camera</span>
          <span className="menu-section__rule" />
        </header>

        <div className="camera-grid">
          <button
            type="button"
            onClick={() => onConnectCamera("mock")}
            disabled={isBusy}
            className={
              cameraStatus.camera_id === "mock"
                ? "camera-grid__btn camera-grid__btn--active"
                : "camera-grid__btn"
            }
          >
            Mock
          </button>
          <button
            type="button"
            onClick={() => onConnectCamera("canon_5d_mark_ii")}
            disabled={isBusy}
            className={
              cameraStatus.camera_id === "canon_5d_mark_ii"
                ? "camera-grid__btn camera-grid__btn--active"
                : "camera-grid__btn"
            }
          >
            Canon 5D II
          </button>
        </div>

        <button
          type="button"
          className="menu-action"
          onClick={onDisconnectCamera}
          disabled={isBusy || !connected}
        >
          <span>× Disconnect</span>
        </button>
      </section>

      <section className="menu-section">
        <header className="menu-section__title">
          <span>Capture</span>
          <span className="menu-section__rule" />
        </header>

        <button
          type="button"
          className="capture-button"
          onClick={onCaptureFrame}
          disabled={isBusy || !connected || !currentProject}
        >
          <span className="capture-button__label">Capture Frame</span>
          <span className="capture-button__shortcut">Space</span>
        </button>

        <button
          type="button"
          className="menu-action"
          onClick={onExportVideo}
          disabled={isBusy || !currentProject}
        >
          <span>↓ Save Video</span>
        </button>
      </section>

      <div className="menu-spacer" />

      <div className={`message-log${message ? "" : " message-log--idle"}`}>
        <span className="message-log__label">Console</span>
        <p>{message ?? "Awaiting input"}</p>
      </div>
    </aside>
  );
}
