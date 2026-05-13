import { FormEvent, useState } from "react";

import { Modal } from "./Modal";
import type { Project } from "../types";

type DeleteProjectDialogProps = {
  project: Project;
  isBusy: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function DeleteProjectDialog({
  project,
  isBusy,
  onClose,
  onConfirm
}: DeleteProjectDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canConfirm = confirmText === project.name && !isBusy;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canConfirm) return;
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    }
  }

  return (
    <Modal
      title="Delete Project"
      subtitle="The project folder and all captured frames will be permanently removed."
      tone="danger"
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="danger-card">
          <div className="danger-card__row">
            <span className="danger-card__label">Name</span>
            <span className="danger-card__value">{project.name}</span>
          </div>
          <div className="danger-card__row">
            <span className="danger-card__label">Path</span>
            <span className="danger-card__value danger-card__value--path">
              {project.root_path}
            </span>
          </div>
          <div className="danger-card__row">
            <span className="danger-card__label">Frames</span>
            <span className="danger-card__value danger-card__value--accent">
              {project.frame_count.toString().padStart(4, "0")}
            </span>
          </div>
        </div>

        <p className="modal-warning">
          This action cannot be undone. The folder above will be removed recursively from disk,
          along with all {project.frame_count} captured frames and any exports.
        </p>

        <div className="field">
          <label className="field-label" htmlFor="dp-confirm">
            Type <strong className="danger-text">{project.name}</strong> to confirm
          </label>
          <input
            id="dp-confirm"
            className="field-input field-input--danger"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder={project.name}
            autoFocus
            disabled={isBusy}
            spellCheck={false}
          />
        </div>

        {error ? <p className="modal-error">{error}</p> : null}

        <footer className="modal-actions">
          <button type="button" onClick={onClose} disabled={isBusy}>
            Cancel
          </button>
          <button type="submit" className="action--danger" disabled={!canConfirm}>
            {isBusy ? "Deleting…" : "Delete Forever"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
