import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  title: string;
  subtitle?: string;
  tone?: "default" | "danger";
  onClose: () => void;
  children: ReactNode;
};

export function Modal({ title, subtitle, tone = "default", onClose, children }: ModalProps) {
  const mouseDownOnOverlay = useRef(false);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  function handleMouseDown(event: React.MouseEvent) {
    mouseDownOnOverlay.current = event.target === event.currentTarget;
  }

  function handleClick(event: React.MouseEvent) {
    if (mouseDownOnOverlay.current && event.target === event.currentTarget) {
      onClose();
    }
    mouseDownOnOverlay.current = false;
  }

  return createPortal(
    <div className="modal-overlay" onMouseDown={handleMouseDown} onClick={handleClick}>
      <div
        className={`modal-panel modal-panel--${tone}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal-header">
          <div className="modal-heading">
            <span className="modal-eyebrow">{tone === "danger" ? "Destructive" : "Dialog"}</span>
            <h2 className="modal-title">{title}</h2>
            {subtitle ? <p className="modal-subtitle">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
