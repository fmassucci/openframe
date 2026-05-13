import { useMemo } from "react";

import { apiClient } from "../api/client";
import type { CameraStatus, Frame, OnionSkinSettings } from "../types";

type LiveViewProps = {
  cameraStatus: CameraStatus;
  lastFrame: Frame | null;
  onionSkin: OnionSkinSettings;
  frameCount: number;
};

const padIndex = (n: number, width = 4) => n.toString().padStart(width, "0");

export function LiveView({ cameraStatus, lastFrame, onionSkin, frameCount }: LiveViewProps) {
  const connected = cameraStatus.status === "connected";
  const onionSkinFrame = connected && onionSkin.enabled ? lastFrame : null;
  const liveViewUrl = useMemo(
    () => (connected ? apiClient.liveViewUrl() : ""),
    [connected, cameraStatus.camera_id]
  );

  return (
    <div className="live-view">
      {connected ? (
        <img className="live-feed" src={liveViewUrl} alt="Camera live view" />
      ) : (
        <div className="live-placeholder">
          <div className="placeholder-stack">
            <div className="placeholder-icon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect
                  x="4.5"
                  y="9.5"
                  width="31"
                  height="21"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.25"
                />
                <circle cx="20" cy="20" r="6" stroke="currentColor" strokeWidth="1.25" />
                <circle cx="20" cy="20" r="2.5" fill="currentColor" opacity="0.55" />
                <rect x="13" y="6.5" width="14" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.25" />
              </svg>
            </div>
            <div className="placeholder-text">
              <strong>No camera connected</strong>
              <span>Connect a device from the sidebar to begin capture</span>
            </div>
          </div>
        </div>
      )}

      {onionSkinFrame ? (
        <img
          className="onion-skin"
          src={apiClient.mediaUrl(onionSkinFrame.url)}
          alt=""
          style={{ opacity: onionSkin.opacity }}
        />
      ) : null}

      <span className="viewport-bracket viewport-bracket--tl" />
      <span className="viewport-bracket viewport-bracket--tr" />
      <span className="viewport-bracket viewport-bracket--bl" />
      <span className="viewport-bracket viewport-bracket--br" />

      <span className="hud hud--tl">
        <span className="hud__label">Frame</span>
        <span className="hud__value">{padIndex(frameCount)}</span>
      </span>

      <span className="hud hud--tr">
        <span className="hud__group">
          <span className="hud__label">ISO</span>
          <span className="hud__value">{connected ? "100" : "—"}</span>
        </span>
        <span className="hud__group">
          <span className="hud__label">f</span>
          <span className="hud__value">{connected ? "2.8" : "—"}</span>
        </span>
        <span className="hud__group">
          <span className="hud__label">Shutter</span>
          <span className="hud__value">{connected ? "1/60" : "—"}</span>
        </span>
      </span>

      <span className="hud hud--bl">
        {connected ? <span className="hud__rec" /> : <span className="hud__dot" />}
        {connected ? "Recording" : "Standby"}
      </span>

      <span className="hud hud--br">{cameraStatus.label ?? "Mock sensor"}</span>
    </div>
  );
}
