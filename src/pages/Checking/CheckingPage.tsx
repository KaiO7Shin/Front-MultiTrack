import { useCallback, useState } from "react";
import {
  apiErrorMessage,
  checkArrival,
  checkPresence,
  type CheckingMode,
} from "@/services/checking";
import { CheckingFeedback } from "./CheckingFeedback";
import { CheckingTabs } from "./CheckingTabs";
import { ManualCheckForm } from "./ManualCheckForm";
// Pack essential : saisie par scan commentée. Seule la saisie manuelle reste.
// import { ScanField } from "./ScanField";
// import { useBarcodeScan } from "./useBarcodeScan";
// import type { CheckingInputMethod } from "./checkingForm";

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

export function CheckingPage() {
  const [mode, setMode] = useState<CheckingMode>("presence");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState(0);

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
      }
    },
    [mode]
  );

  function selectMode(next: CheckingMode) {
    if (next === mode || busy) return;
    setMode(next);
    setError(null);
    setSuccess(null);
    setManualKey((key) => key + 1);
  }

  const active = MODES.find((item) => item.id === mode) ?? MODES[0];

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Checking</h1>
          <p className="page-subtitle">
            Enregistrez la présence ou l'arrivée par saisie manuelle du dossard.
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
        </div>
      </div>
    </section>
  );
}
