import type { CameraStatus, Project } from "../types";

type TopBarProps = {
  cameraStatus: CameraStatus;
  currentProject: Project | null;
};

const STATUS_COPY: Record<CameraStatus["status"], string> = {
  connected: "Live",
  connecting: "Linking",
  disconnected: "Standby",
  error: "Fault"
};

export function TopBar({ cameraStatus, currentProject }: TopBarProps) {
  const projectLabel = currentProject?.name ?? "Untitled";
  const cameraLabel = cameraStatus.label ?? "No device";

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="topbar__wordmark">OpenFrame</span>
        <span className="topbar__version">0.1</span>
      </div>

      <div className="topbar__center">
        <span className="topbar__center-label">Project</span>
        <span className="topbar__center-name">{projectLabel}</span>
      </div>

      <div className="topbar__right">
        <span className="chip chip--ghost">
          <span className="chip__icon" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="3" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1" />
              <circle cx="6" cy="6" r="1.5" fill="currentColor" />
            </svg>
          </span>
          {cameraLabel}
        </span>
        <span className={`chip chip--status chip--status-${cameraStatus.status}`}>
          <span className={`chip__dot chip__dot--${cameraStatus.status}`} />
          {STATUS_COPY[cameraStatus.status]}
        </span>
      </div>
    </header>
  );
}
