import { apiClient } from "../api/client";
import type { Frame } from "../types";

type FrameStripProps = {
  frames: Frame[];
};

const padIndex = (n: number, width = 3) => n.toString().padStart(width, "0");

export function FrameStrip({ frames }: FrameStripProps) {
  return (
    <section className="frame-section">
      <header className="frame-section__header">
        <h3 className="frame-section__title">Timeline</h3>
        <div className="frame-section__count">
          <span className="frame-section__count-value">
            {frames.length.toString().padStart(4, "0")}
          </span>
          <span className="frame-section__count-label">frames captured</span>
        </div>
      </header>

      {frames.length === 0 ? (
        <div className="frame-strip empty">No frames captured yet</div>
      ) : (
        <div className="frame-strip">
          {frames.map((frame, idx) => {
            const isLatest = idx === frames.length - 1;
            return (
              <figure
                key={frame.filename}
                className={`frame-thumb${isLatest ? " frame-thumb--latest" : ""}`}
              >
                <img src={apiClient.mediaUrl(frame.url)} alt={`Frame ${frame.index}`} />
                <figcaption>{padIndex(frame.index)}</figcaption>
              </figure>
            );
          })}
        </div>
      )}
    </section>
  );
}
