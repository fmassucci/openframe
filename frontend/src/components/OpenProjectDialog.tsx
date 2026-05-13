import { FormEvent, useEffect, useState } from "react";

import { apiClient } from "../api/client";
import { Modal } from "./Modal";
import type { Project } from "../types";

type OpenProjectDialogProps = {
  isBusy: boolean;
  currentProjectId: string | null;
  onClose: () => void;
  onOpenPath: (rootPath: string) => Promise<void>;
  onSelectExisting: (projectId: string) => Promise<void>;
};

const padFrames = (n: number) => n.toString().padStart(3, "0");

export function OpenProjectDialog({
  isBusy,
  currentProjectId,
  onClose,
  onOpenPath,
  onSelectExisting
}: OpenProjectDialogProps) {
  const [path, setPath] = useState("");
  const [recent, setRecent] = useState<Project[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canPickFolder = Boolean(window.openframe?.pickFolder);

  useEffect(() => {
    let cancelled = false;
    setRecentLoading(true);
    apiClient
      .listProjects()
      .then((projects) => {
        if (!cancelled) setRecent(projects);
      })
      .catch(() => {
        if (!cancelled) setRecent([]);
      })
      .finally(() => {
        if (!cancelled) setRecentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function pickFolder() {
    if (!window.openframe?.pickFolder) return;
    const picked = await window.openframe.pickFolder({
      mode: "open",
      title: "Open OpenFrame Project"
    });
    if (picked) setPath(picked);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = path.trim();
    if (!trimmed) return;
    setError(null);
    try {
      await onOpenPath(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open project");
    }
  }

  async function openExisting(project: Project) {
    setError(null);
    try {
      await onSelectExisting(project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open project");
    }
  }

  return (
    <Modal
      title="Open Project"
      subtitle="Browse to a project folder or pick a recent one"
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label" htmlFor="op-path">
            Project Folder
          </label>
          <div className="field-row">
            <input
              id="op-path"
              className="field-input field-input--path"
              value={path}
              onChange={(event) => setPath(event.target.value)}
              placeholder="Path containing metadata.json"
              autoFocus
              disabled={isBusy}
              spellCheck={false}
            />
            {canPickFolder ? (
              <button
                type="button"
                className="field-browse"
                onClick={pickFolder}
                disabled={isBusy}
              >
                Browse…
              </button>
            ) : null}
          </div>
          <p className="field-hint">
            Looks for a <span className="field-hint__path">metadata.json</span> inside the folder.
          </p>
        </div>

        <div className="field">
          <label className="field-label">
            <span>Recent Projects</span>
            <span className="field-counter">
              {recentLoading ? "…" : recent.length.toString().padStart(2, "0")}
            </span>
          </label>
          {recentLoading ? (
            <div className="recent-empty">Loading…</div>
          ) : recent.length === 0 ? (
            <div className="recent-empty">No recent projects</div>
          ) : (
            <div className="recent-list">
              {recent.map((project) => {
                const isActive = project.id === currentProjectId;
                return (
                  <button
                    key={project.id}
                    type="button"
                    className={`recent-row${isActive ? " recent-row--active" : ""}`}
                    onClick={() => openExisting(project)}
                    disabled={isBusy || isActive}
                  >
                    <span className="recent-row__main">
                      <span className="recent-row__name">{project.name}</span>
                      <span className="recent-row__path">{project.root_path}</span>
                    </span>
                    <span className="recent-row__meta">
                      {padFrames(project.frame_count)} FR
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error ? <p className="modal-error">{error}</p> : null}

        <footer className="modal-actions">
          <button type="button" onClick={onClose} disabled={isBusy}>
            Cancel
          </button>
          <button type="submit" className="action--primary" disabled={!path.trim() || isBusy}>
            {isBusy ? "Opening…" : "Open Folder"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
