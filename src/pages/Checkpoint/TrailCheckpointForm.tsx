import { useEffect, useRef, useState } from "react";
import { recordTrailCheckpoint } from "@/services/checkpoint";
import { Alert, Spinner } from "@/components/ui/feedback";
import { FormField } from "@/components/ui/form-field";
import type { ControlPointConfig } from "@/lib/type";
import { ROLE_CHECKPOINT } from "@/lib/auth";

type SessionUser = {
  id: number;
  role: number;
  assignedControlPoint?: {
    id: number;
    courseId?: number;
    label?: string;
    controlPointNumber?: number;
  };
  name?: string | null;
};

function readStoredUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

type TrailCheckpointFormProps = {
  courseId: number;
  controlPoints: ControlPointConfig[];
};

export function TrailCheckpointForm({
  courseId,
  controlPoints,
}: TrailCheckpointFormProps) {
  const [user, setUser] = useState<SessionUser | null>(() => readStoredUser());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "user") setUser(readStoredUser());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isCollaborateur = user?.role === ROLE_CHECKPOINT;
  const assignedPoint = user?.assignedControlPoint ?? null;

  const [adminMode, setAdminMode] = useState<"finishline" | number>("finishline");

  const effectiveControlPointId: number | null = isCollaborateur
    ? assignedPoint?.id ?? null
    : adminMode === "finishline"
      ? null
      : adminMode;

  const controlPointLabel = isCollaborateur
    ? assignedPoint?.label
    : adminMode === "finishline"
      ? undefined
      : controlPoints.find((cp) => cp.id === adminMode)?.label;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const successTimerRef = useRef<number | null>(null);
  const inputRef1 = useRef<HTMLInputElement | null>(null);
  const inputRef2 = useRef<HTMLInputElement | null>(null);
  const [bib1, setBib1] = useState("");
  const [bib2, setBib2] = useState("");

  useEffect(() => {
    inputRef1.current?.focus();
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, [courseId]);

  useEffect(() => {
    if (!isCollaborateur) {
      setAdminMode("finishline");
    }
  }, [courseId, isCollaborateur]);

  function vibrate(ms = 30) {
    if (navigator?.vibrate) navigator.vibrate(ms);
  }

  function validateLocal(bib: string) {
    if (!/^\d{1,6}$/.test(bib)) return "Numéro invalide (1 à 6 chiffres)";
    return null;
  }

  async function submitToServer(bibNumber: string) {
    return recordTrailCheckpoint(bibNumber, effectiveControlPointId);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (bib1 !== bib2) {
      setError("Les deux numéros ne correspondent pas.");
      vibrate(60);
      return;
    }
    const bib = bib1.trim();
    if (!bib) return;
    const localErr = validateLocal(bib);
    if (localErr) {
      setError(localErr);
      vibrate(60);
      return;
    }

    if (isCollaborateur && !effectiveControlPointId) {
      setError("Aucun point de contrôle assigné à votre session.");
      vibrate(60);
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await submitToServer(bib);
      const timeStr = new Date(result.ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setSuccess(
        `Pointage enregistré (${result.where === "PC" ? `PC: ${result.cpLabel ?? ""}` : "Arrivée"}) à ${timeStr}`
      );
      successTimerRef.current = window.setTimeout(() => setSuccess(null), 5000);
      setBib1("");
      setBib2("");
      inputRef1.current?.focus();
      vibrate(30);
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Erreur d'enregistrement"
      );
      vibrate(60);
    } finally {
      setBusy(false);
    }
  }

  function restrictKeys(e: React.KeyboardEvent<HTMLInputElement>) {
    const allowed = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
      "Enter",
    ];
    if (/^\d$/.test(e.key) || allowed.includes(e.key)) return;
    e.preventDefault();
  }

  if (isCollaborateur && assignedPoint?.courseId && assignedPoint.courseId !== courseId) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
        Votre point de contrôle est assigné à une autre course. Sélectionnez la
        course correspondante ou contactez l'organisateur.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-3"
    >
      {!isCollaborateur && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            Mode de pointage
          </label>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={
              adminMode === "finishline" ? "finishline" : String(adminMode)
            }
            onChange={(e) => {
              const v = e.target.value;
              setAdminMode(v === "finishline" ? "finishline" : Number(v));
              setError(null);
              setSuccess(null);
            }}
          >
            <option value="finishline">Arrivée finale (ligne d'arrivée)</option>
            {controlPoints.map((cp) => (
              <option key={cp.id} value={cp.id}>
                {cp.label} (n°{cp.numero})
              </option>
            ))}
          </select>
          {controlPoints.length === 0 && (
            <p className="text-xs text-slate-500">
              Aucun PC configuré — configurez-les dans la fiche course Trail.
            </p>
          )}
        </div>
      )}

      {effectiveControlPointId ? (
        <div className="text-sm text-center">
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 border-[#8c9962]/50 text-[#8c9962]">
            Point de contrôle : {controlPointLabel ?? `#${effectiveControlPointId}`}
          </span>
        </div>
      ) : (
        <div className="text-sm text-center text-slate-500">
          Mode arrivée (admin)
        </div>
      )}

      <FormField label="N° Dossard" htmlFor="bib-1">
        <input
          id="bib-1"
          ref={inputRef1}
          value={bib1}
          onChange={(e) => setBib1(e.target.value)}
          inputMode="numeric"
          maxLength={6}
          autoComplete="off"
          className="w-full text-3xl px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-brand/30"
          placeholder="Ex. 1234"
          onKeyDown={restrictKeys}
        />
      </FormField>

      <FormField label="Confirmer N° Dossard" htmlFor="bib-2">
        <input
          id="bib-2"
          ref={inputRef2}
          value={bib2}
          onChange={(e) => setBib2(e.target.value)}
          inputMode="numeric"
          maxLength={6}
          autoComplete="off"
          className="w-full text-3xl px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-brand/30"
          placeholder="Retapez le numéro"
          onKeyDown={restrictKeys}
        />
      </FormField>

      <div aria-live="polite" aria-atomic="true" className="space-y-2">
        {error && (
          <Alert variant="error" role="alert">
            {error}
          </Alert>
        )}
        {success && <Alert variant="success">{success}</Alert>}
      </div>

      <button
        disabled={
          busy || !bib1 || !bib2 || bib1 !== bib2 || validateLocal(bib1) !== null
        }
        className="w-full rounded-2xl bg-slate-900 text-white px-4 py-3 text-base disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {busy && <Spinner className="border-white" />}
        {busy ? "Enregistrement..." : "Valider (ENTER)"}
      </button>
    </form>
  );
}
