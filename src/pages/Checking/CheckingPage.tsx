import { useCallback, useState } from "react";
import { patchParticipantStatusByBib } from "@/lib/boMemoryCache";
import type { ParticipantStatus } from "@/lib/type";
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
import { CheckingTabs } from "./CheckingTabs";
import { ManualCheckForm } from "./ManualCheckForm";

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

function asParticipantStatus(value?: string): ParticipantStatus | null {
  if (!value?.trim()) return null;
  return value.trim() as ParticipantStatus;
}

export function CheckingPage() {
  const [mode, setMode] = useState<CheckingMode>("presence");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState(0);
  const [lastCheck, setLastCheck] = useState<{ mode: CheckingMode; bib: string } | null>(
    null
  );
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelSaving, setCancelSaving] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const submit = useCallback(
    async (bib: string) => {
      setBusy(true);
      setError(null);
      setSuccess(null);
      try {
        const response =
          mode === "presence" ? await checkPresence(bib) : await checkArrival(bib);
        patchParticipantStatusByBib(bib, mode === "presence" ? "Présent" : "Finisher");
        setLastCheck({ mode, bib });
        setSuccess(response.message?.trim() || "Checking enregistré");
        return true;
      } catch (err: unknown) {
        setLastCheck(null);
        setError(apiErrorMessage(err, "Erreur interne"));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [mode]
  );

  async function confirmCancel() {
    if (!lastCheck || cancelSaving) return;
    setCancelSaving(true);
    setCancelError(null);
    try {
      const response =
        lastCheck.mode === "presence"
          ? await cancelPresence(lastCheck.bib)
          : await cancelArrival(lastCheck.bib);
      const restored = asParticipantStatus(response.data?.statut);
      if (restored) {
        patchParticipantStatusByBib(
          lastCheck.bib,
          restored,
          lastCheck.mode === "arrivee" ? { temps: null } : undefined
        );
      }
      setSuccess(response.message?.trim() || "Checking annulé");
      setError(null);
      setLastCheck(null);
      setCancelOpen(false);
    } catch (err: unknown) {
      setCancelError(apiErrorMessage(err, "Impossible d'annuler le checking."));
    } finally {
      setCancelSaving(false);
    }
  }

  function selectMode(next: CheckingMode) {
    if (next === mode || busy || cancelSaving) return;
    setMode(next);
    setError(null);
    setSuccess(null);
    setLastCheck(null);
    setCancelOpen(false);
    setCancelError(null);
    setManualKey((key) => key + 1);
  }

  const active = MODES.find((item) => item.id === mode) ?? MODES[0];
  const canCancel = lastCheck != null && lastCheck.mode === mode && !busy;

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
          disabled={busy || cancelSaving}
          onChange={selectMode}
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm text-slate-500">{active.hint}</p>
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
              setLastCheck(null);
              setError(message);
            }}
          />
        </div>
      </div>

      <CheckingCancelModal
        open={cancelOpen && lastCheck != null}
        mode={lastCheck?.mode ?? mode}
        bibNumber={lastCheck?.bib ?? ""}
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
