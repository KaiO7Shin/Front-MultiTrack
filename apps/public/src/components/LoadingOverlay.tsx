import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Overlay appears only after loading lasts longer than this delay. */
export const OVERLAY_SHOW_DELAY_MS = 2_000;

export function LoadingOverlay({
  visible,
  delayMs = OVERLAY_SHOW_DELAY_MS,
}: {
  visible: boolean;
  delayMs?: number;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShown(false);
      return undefined;
    }

    if (delayMs <= 0) {
      setShown(true);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShown(true);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [visible, delayMs]);

  useEffect(() => {
    if (!shown) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [shown]);

  if (!shown) return null;

  return createPortal(
    <div className="loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-spinner">
        <span className="loading-spinner-ring" aria-hidden="true" />
        <p className="loading-spinner-label">Patientez un peu...</p>
      </div>
    </div>,
    document.body,
  );
}
