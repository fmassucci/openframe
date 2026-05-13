import { FormEvent, useState } from "react";

import { Modal } from "./Modal";

type NewProjectDialogProps = {
  defaultParent: string;
  pathSeparator: string;
  isBusy: boolean;
  onClose: () => void;
  onSubmit: (name: string, parentDir: string | null) => Promise<void>;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function NewProjectDialog({
  defaultParent,
  pathSeparator,
  isBusy,
  onClose,
  onSubmit
}: NewProjectDialogProps) {
  const [name, setName] = useState("");
  const [parent, setParent] = useState(defaultParent);
  const [error, setError] = useState<string | null>(null);

  const canPickFolder = Boolean(window.openframe?.pickFolder);
  const trimmedName = name.trim();
  const trimmedParent = parent.trim();
  const canSubmit = trimmedName.length > 0 && trimmedParent.length > 0 && !isBusy;
  const folderName = `${slugify(trimmedName) || "untitled"}-XXXXXXXX`;
  const previewPath = `${trimmedParent.replace(/[/\\]+$/, "")}${pathSeparator}${folderName}`;

  async function pickParent() {
    if (!window.openframe?.pickFolder) return;
    const picked = await window.openframe.pickFolder({
      mode: "save",
      defaultPath: trimmedParent || defaultParent,
      title: "Choose Save Location"
    });
    if (picked) setParent(picked);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    try {
      await onSubmit(trimmedName, trimmedParent || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    }
  }

  return (
    <Modal
      title="New Project"
      subtitle="Configure project metadata and storage location"
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label" htmlFor="np-name">
            <span>Project Name</span>
            <span className="field-counter">{trimmedName.length}/120</span>
          </label>
          <input
            id="np-name"
            className="field-input"
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, 120))}
            placeholder="Untitled Sequence"
            autoFocus
            disabled={isBusy}
            spellCheck={false}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="np-parent">
            <span>Save Location</span>
            <button
              type="button"
              className="field-reset"
              onClick={() => setParent(defaultParent)}
              disabled={isBusy || parent === defaultParent}
            >
              Reset
            </button>
          </label>
          <div className="field-row">
            <input
              id="np-parent"
              className="field-input field-input--path"
              value={parent}
              onChange={(event) => setParent(event.target.value)}
              placeholder={defaultParent}
              disabled={isBusy}
              spellCheck={false}
            />
            {canPickFolder ? (
              <button
                type="button"
                className="field-browse"
                onClick={pickParent}
                disabled={isBusy}
              >
                Browse…
              </button>
            ) : null}
          </div>
          <p className="field-hint">
            Project folder
            <span className="field-hint__arrow">→</span>
            <span className="field-hint__path">{previewPath}</span>
          </p>
        </div>

        {error ? <p className="modal-error">{error}</p> : null}

        <footer className="modal-actions">
          <button type="button" onClick={onClose} disabled={isBusy}>
            Cancel
          </button>
          <button type="submit" className="action--primary" disabled={!canSubmit}>
            {isBusy ? "Creating…" : "Create Project"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
