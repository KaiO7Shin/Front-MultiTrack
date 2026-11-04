import type { RefObject } from "react";
import { Barcode } from "lucide-react";

type ScanFieldProps = {
  value: string;
  busy: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
};

export function ScanField({ value, busy, inputRef }: ScanFieldProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
      <Barcode className="h-5 w-5 shrink-0 text-slate-700" aria-hidden />
      <input
        ref={inputRef}
        value={value}
        placeholder="En attente du scan..."
        inputMode="numeric"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Numéro de dossard"
        aria-busy={busy}
        onChange={() => {}}
        onPaste={(event) => event.preventDefault()}
        className="w-full bg-transparent text-base tabular-nums tracking-wide text-slate-800 placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none"
      />
    </div>
  );
}
