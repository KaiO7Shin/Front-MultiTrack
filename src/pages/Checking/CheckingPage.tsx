import { useCallback, useEffect, useRef, useState } from "react";
import {
  apiErrorMessage,
  cancelArrival,
  cancelPresence,
  checkArrival,
  checkPresence,
  type CheckingMode,
} from "@/services/checking";
import { CheckingCancelModal } from "./CheckingCancelModal";
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
  const [lastManualCheck, setLastManualCheck] = useState<{
    mode: CheckingMode;
    bib: string;
  } | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelSaving, setCancelSaving] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

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
        if (inputMethod === "manuel") {
          setLastManualCheck({ mode, bib });
        }
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

  async function confirmCancel() {
    if (!lastManualCheck || cancelSaving) return;
    setCancelSaving(true);
    setCancelError(null);
    try {
      const response =
        lastManualCheck.mode === "presence"
          ? await cancelPresence(lastManualCheck.bib)
          : await cancelArrival(lastManualCheck.bib);
      setSuccess(response.message?.trim() || "Checking annulé");
      setError(null);
      setLastManualCheck(null);
      setCancelOpen(false);
    } catch (err: unknown) {
      setCancelError(apiErrorMessage(err, "Impossible d'annuler le checking."));
    } finally {
      setCancelSaving(false);
    }
  }

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
    if (next === mode || busy || cancelSaving) return;
    setMode(next);
    resetFeedback();
    setLastManualCheck(null);
    setCancelOpen(false);
    setCancelError(null);
    setManualKey((key) => key + 1);
    if (inputMethod === "scan") scan.focus();
  }

  function selectInputMethod(next: CheckingInputMethod) {
    if (next === inputMethod || busy || cancelSaving) return;
    setInputMethod(next);
    resetFeedback();
    setLastManualCheck(null);
    setCancelOpen(false);
    setCancelError(null);
    setManualKey((key) => key + 1);
    if (next === "scan") scan.focus();
  }

  const active = MODES.find((item) => item.id === mode) ?? MODES[0];
  const canCancel =
    inputMethod === "manuel" &&
    lastManualCheck != null &&
    lastManualCheck.mode === mode &&
    !busy;

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
              busy={busy || cancelSaving}
              feedback={<CheckingFeedback error={error} success={success} />}
              afterSubmit={
                canCancel ? (
                  <button
                    type="button"
                    className="btn-warning w-full"
                    onClick={() => {
                      setCancelError(null);
                      setCancelOpen(true);
                    }}
                  >
                    Annuler
                  </button>
                ) : null
              }
              onSubmit={submit}
              onInvalid={(message) => {
                setSuccess(null);
                setLastManualCheck(null);
                setError(message);
              }}
            />
          )}
        </div>
      </div>

      <CheckingCancelModal
        open={cancelOpen && lastManualCheck != null}
        mode={lastManualCheck?.mode ?? mode}
        bibNumber={lastManualCheck?.bib ?? ""}
        saving={cancelSaving}
        error={cancelError}
        onClose={() => {
          if (cancelSaving) return;
          setCancelOpen(false);
          setCancelError(null);
        }}
        onConfirm={() => void confirmCancel()}
      />
    </section>
  );
}
