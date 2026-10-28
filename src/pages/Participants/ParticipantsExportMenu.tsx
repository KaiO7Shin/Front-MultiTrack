import { useEffect, useRef, useState } from "react";

type ParticipantsExportMenuProps = {
  disabled: boolean;
  onChecking: () => void;
  onPublication: () => void;
};

export function ParticipantsExportMenu({
  disabled,
  onChecking,
  onPublication,
}: ParticipantsExportMenuProps) {
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
        className="btn-secondary px-3 py-2 text-sm disabled:opacity-40"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <img src="/pdf.svg" alt="" className="h-4 w-4" aria-hidden />
        Exporter
      </button>
      {open && !disabled && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-border bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
            onClick={() => {
              setOpen(false);
              onChecking();
            }}
          >
            Checking
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
            onClick={() => {
              setOpen(false);
              onPublication();
            }}
          >
            Publication
          </button>
        </div>
      )}
    </div>
  );
}
