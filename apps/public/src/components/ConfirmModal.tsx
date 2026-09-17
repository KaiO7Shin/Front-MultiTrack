import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Annuler",
  icon,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancelRef.current();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {icon ? <div className="confirm-modal-icon">{icon}</div> : null}
        <h2 id="confirm-modal-title">{title}</h2>
        <p id="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button type="button" className="button button-outline" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="button button-dark" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
