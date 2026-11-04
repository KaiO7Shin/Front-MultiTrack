import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";

type ClassementExportMenuProps = {
  disabled: boolean;
  onGeneral: () => void;
  onPodium: () => void;
};

export function ClassementExportMenu({
  disabled,
  onGeneral,
  onPodium,
}: ClassementExportMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="btn-secondary"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Download className="h-4 w-4" aria-hidden />
        Exporter
      </button>
      {open && !disabled && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-border bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
            onClick={() => {
              setOpen(false);
              onGeneral();
            }}
          >
            Classement général
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
            onClick={() => {
              setOpen(false);
              onPodium();
            }}
          >
            Classement podium
          </button>
        </div>
      )}
    </div>
  );
}
