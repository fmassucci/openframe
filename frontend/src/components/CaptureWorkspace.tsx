import { FrameStrip } from "./FrameStrip";
import { LiveView } from "./LiveView";
import { OnionSkinControls } from "./OnionSkinControls";
import type { CameraStatus, Frame, OnionSkinSettings } from "../types";

type CaptureWorkspaceProps = {
  cameraStatus: CameraStatus;
  frames: Frame[];
  lastFrame: Frame | null;
  onionSkin: OnionSkinSettings;
  onOnionSkinChange: (settings: OnionSkinSettings) => void;
};

const padIndex = (n: number, width = 4) => n.toString().padStart(width, "0");

export function CaptureWorkspace({
  cameraStatus,
  frames,
  lastFrame,
  onionSkin,
  onOnionSkinChange
}: CaptureWorkspaceProps) {
  return (
    <section className="capture-workspace">
      <div className="meta-strip">
        <div className="meta-strip__group">
          <span className="meta-label">Sequence</span>
          <span className="meta-value">
            <span className="meta-value__num">{padIndex(frames.length)}</span>
            <span className="meta-value__hint">/ ∞</span>
          </span>
        </div>

        <div className="meta-strip__center">
          <OnionSkinControls settings={onionSkin} onChange={onOnionSkinChange} />
        </div>

        <div className="meta-strip__group meta-strip__group--right">
          <span className="meta-value">
            <span className="meta-value__num">
              {cameraStatus.status === "connected" ? "24.0" : "—.—"}
            </span>
            <span className="meta-value__hint">fps</span>
          </span>
          <span className="meta-label">Cadence</span>
        </div>
      </div>

      <LiveView
        cameraStatus={cameraStatus}
        lastFrame={lastFrame}
        onionSkin={onionSkin}
        frameCount={frames.length}
      />

      <FrameStrip frames={frames} />
    </section>
  );
}
