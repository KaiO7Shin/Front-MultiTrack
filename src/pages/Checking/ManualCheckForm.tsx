import { useState, type FormEvent, type ReactNode } from "react";
import { FormField, inputClassName } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { digitsOnly, isValidBib, INVALID_BIB, MISMATCH_BIBS } from "./checkingForm";

/** Pavé 0-9 sur iOS/Android (type tel + pattern [0-9]*), comme l’ancien checking. */
function BibNumberInput({
  id,
  value,
  disabled,
  enterKeyHint,
  onChange,
}: {
  id: string;
  value: string;
  disabled: boolean;
  enterKeyHint: "next" | "done";
  onChange: (value: string) => void;
}) {
  return (
    <input
      id={id}
      type="tel"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      maxLength={4}
      disabled={disabled}
      aria-required
      enterKeyHint={enterKeyHint}
      value={value}
      onChange={(event) => onChange(digitsOnly(event.target.value))}
      className={cn(inputClassName, "tabular-nums tracking-wide")}
    />
  );
}

type ManualCheckFormProps = {
  busy: boolean;
  feedback: ReactNode;
  onSubmit: (bib: string) => Promise<boolean>;
  onInvalid: (message: string) => void;
};

export function ManualCheckForm({
  busy,
  feedback,
  onSubmit,
  onInvalid,
}: ManualCheckFormProps) {
  const [bib, setBib] = useState("");
  const [confirm, setConfirm] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!isValidBib(bib) || !isValidBib(confirm)) {
      onInvalid(INVALID_BIB);
      return;
    }
    if (bib !== confirm) {
      onInvalid(MISMATCH_BIBS);
      return;
    }
    const ok = await onSubmit(bib);
    if (ok) {
      setBib("");
      setConfirm("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {feedback}
      <FormField label="Numéro de dossard" htmlFor="checking-bib" required>
        <BibNumberInput
          id="checking-bib"
          value={bib}
          disabled={busy}
          enterKeyHint="next"
          onChange={setBib}
        />
      </FormField>
      <FormField label="Confirmer le numéro" htmlFor="checking-bib-confirm" required>
        <BibNumberInput
          id="checking-bib-confirm"
          value={confirm}
          disabled={busy}
          enterKeyHint="done"
          onChange={setConfirm}
        />
      </FormField>
      <button type="submit" disabled={busy} className="btn-primary w-full">
        Valider
      </button>
    </form>
  );
}
