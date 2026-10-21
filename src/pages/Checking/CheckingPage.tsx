import { useCallback, useEffect, useRef, useState } from "react";
import {
  apiErrorMessage,
  checkArrival,
  checkPresence,
  type CheckingMode,
} from "@/services/checking";
import { CheckingFeedback } from "./CheckingFeedback";
import type { CheckingInputMethod } from "./checkingForm";
import { CheckingTabs } from "./CheckingTabs";
import { ManualCheckForm } from "./ManualCheckForm";
import { ScanField } from "./ScanField";
import { useBarcodeScan } from "./useBarcodeScan";

const MODES: { id: CheckingMode; label: string; hint: string }[] = [
  {
    id: "presence",
    label: "Présence",
    hint: "Un inscrit passe au statut Présent.",
  },
  {
    id: "arrivee",
    label: "Arrivée",
    hint: "Le participant passe en Finisher, avec son heure d'arrivée.",
  },
];

const INPUT_METHODS: { id: CheckingInputMethod; label: string }[] = [
  { id: "scan", label: "Scan" },
  { id: "manuel", label: "Manuel" },
];

export function CheckingPage() {
  const [mode, setMode] = useState<CheckingMode>("presence");
  const [inputMethod, setInputMethod] = useState<CheckingInputMethod>("scan");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState(0);

  const clearRef = useRef<() => void>(() => {});
  const focusRef = useRef<() => void>(() => {});

  const submit = useCallback(
    async (bib: string) => {
      setBusy(true);
      setError(null);
      setSuccess(null);
      try {
        const response =
          mode === "presence" ? await checkPresence(bib) : await checkArrival(bib);
        setSuccess(response.message?.trim() || "Checking enregistré");
        return true;
      } catch (err: unknown) {
        setError(apiErrorMessage(err, "Erreur interne"));
        return false;
      } finally {
        setBusy(false);
        clearRef.current();
        if (inputMethod === "scan") focusRef.current();
      }
    },
    [inputMethod, mode]
  );

  const scan = useBarcodeScan({
    enabled: !busy && inputMethod === "scan",
    onScan: (bib) => {
      void submit(bib);
    },
    onInvalid: (message) => {
      setSuccess(null);
      setError(message);
    },
  });

  clearRef.current = scan.clear;
  focusRef.current = scan.focus;

  useEffect(() => {
    if (inputMethod === "scan" && !busy) focusRef.current();
  }, [busy, inputMethod]);

  function resetFeedback() {
    setError(null);
    setSuccess(null);
    scan.clear();
  }

  function selectMode(next: CheckingMode) {
    if (next === mode || busy) return;
    setMode(next);
    resetFeedback();
    setManualKey((key) => key + 1);
    if (inputMethod === "scan") scan.focus();
  }

  function selectInputMethod(next: CheckingInputMethod) {
    if (next === inputMethod || busy) return;
    setInputMethod(next);
    resetFeedback();
    setManualKey((key) => key + 1);
    if (next === "scan") scan.focus();
  }

  const active = MODES.find((item) => item.id === mode) ?? MODES[0];

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Checking</h1>
          <p className="page-subtitle">
            Enregistrez la présence ou l'arrivée par scan ou saisie manuelle.
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
        <CheckingTabs
          label="Mode de checking"
          value={mode}
          options={MODES}
          disabled={busy}
          onChange={selectMode}
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm text-slate-500">{active.hint}</p>
          <div className="mb-4">
            <CheckingTabs
              label="Saisie du dossard"
              value={inputMethod}
              options={INPUT_METHODS}
              disabled={busy}
              onChange={selectInputMethod}
            />
          </div>
          {inputMethod === "scan" ? (
            <div className="space-y-4">
              <CheckingFeedback error={error} success={success} />
              <ScanField value={scan.value} busy={busy} inputRef={scan.inputRef} />
            </div>
          ) : (
            <ManualCheckForm
              key={manualKey}
              busy={busy}
              feedback={<CheckingFeedback error={error} success={success} />}
              onSubmit={submit}
              onInvalid={(message) => {
                setSuccess(null);
                setError(message);
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
