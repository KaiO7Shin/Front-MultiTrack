import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../lib/api"; // axios instance

// Même forme que dans App.tsx
type SessionUser = {
  id: number;
  role: number;
  assignedControlPoint?: {
    id: number;
    label?: string;
    controlPointNumber?: number;
  };
  name?: string | null;
};

/** Lecture sûre du user depuis localStorage */
function readStoredUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export const CheckpointScan = () => {
  // === Nouveauté : on gère user ici, sans props ===
  const [user, setUser] = useState<SessionUser | null>(() => readStoredUser());

  // Réagit si le localStorage change (autre onglet / autre partie de l’app)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "user") {
        setUser(readStoredUser());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const controlPointId = useMemo(
    () => user?.assignedControlPoint?.id ?? null,
    [user]
  );
  const controlPointLabel = useMemo(
    () => user?.assignedControlPoint?.label ?? undefined,
    [user]
  );

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
    const el = inputRef1.current;
    if (!el) return;
    const onFocus = () => el.select();
    el.addEventListener("focus", onFocus);
    return () => el.removeEventListener("focus", onFocus);
  }, []);

  // cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  function vibrate(ms = 30) {
    if (navigator?.vibrate) navigator.vibrate(ms);
  }

  function validateLocal(bib: string) {
    if (!/^\d{1,6}$/.test(bib)) return "Numéro invalide (1 à 6 chiffres)";
    return null;
  }

  async function submitToServer(bibNumber: string) {
    // Si l’utilisateur a un PC assigné => /checking/pc
    if (controlPointId) {
      const res = await api.post("/checking/pc", {
        bibNumber,
        controlPointId,
      });
      const data = res?.data ?? {};
      // { bibNumber, controlPoint:{ id, label }, checkpointTime }
      const iso = data?.checkpointTime as string | undefined;
      const ts = iso ? Date.parse(iso) : Date.now();
      return {
        where: "PC" as const,
        ts,
        cpLabel: data?.controlPoint?.label as string | undefined,
      };
    } else {
      // Sinon => arrivée (admin)
      const res = await api.post("/checking/finishline", { bibNumber });
      const data = res?.data ?? {};
      // { bibNumber, arrivalTime }
      const iso = data?.arrivalTime as string | undefined;
      const ts = iso ? Date.parse(iso) : Date.now();
      return {
        where: "FINISHER" as const,
        ts,
        cpLabel: undefined,
      };
    }
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

    setBusy(true);
    setError(null);
    setSuccess(null);
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }

    try {
      const result = await submitToServer(bib);
      // Succès
      const timeStr = new Date(result.ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const successMsg = `Pointage enregistré (${result.where === "PC" ? `PC: ${result.cpLabel ?? ""}` : "Arrivée"
        }) à ${timeStr}`;

      // show inline success message instead of alert
      setSuccess(successMsg);
      successTimerRef.current = window.setTimeout(() => setSuccess(null), 5000);

      setBib1("");
      setBib2("");
      inputRef1.current?.focus();
      vibrate(30);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Erreur d’enregistrement";
      setError(msg);
      vibrate(60);
    } finally {
      setBusy(false);
    }
  }

  function restrictKeys(e: React.KeyboardEvent<HTMLInputElement>) {
    const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"];
    if (/^\d$/.test(e.key) || allowed.includes(e.key)) return;
    e.preventDefault();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-center">
        <h1 className="text-2xl font-semibold">Pointage Checkpoint</h1>
      </div>

      {/* Info PC en haut si disponible */}
      {controlPointId ? (
        <div className="text-sm text-center">
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 border-[#8c9962]/50 text-[#8c9962]">
            Point de contrôle : {controlPointLabel ?? `#${controlPointId}`}
          </span>
        </div>
      ) : (
        <div className="text-sm text-center text-slate-500">
          Mode arrivée (admin)
        </div>
      )}

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-3"
      >
        <label className="text-sm text-slate-600">N° Dossard</label>
        <input
          name="bib1"
          ref={inputRef1}
          value={bib1}
          onChange={(e) => setBib1(e.target.value)}
          autoFocus
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          className="w-full text-3xl px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          placeholder="Ex. 1234"
          onKeyDown={restrictKeys}
        />

        <label className="text-sm text-slate-600">Confirmer N° Dossard</label>
        <input
          name="bib2"
          ref={inputRef2}
          value={bib2}
          onChange={(e) => setBib2(e.target.value)}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          className="w-full text-3xl px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          placeholder="Retapez le numéro"
          onKeyDown={restrictKeys}
        />

        {error && (
          <div className="text-sm rounded-xl bg-red-50 text-red-700 px-3 py-2 border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm rounded-xl bg-green-50 text-green-700 px-3 py-2 border border-green-200">
            {success}
          </div>
        )}
        <button
          disabled={
            busy || !bib1 || !bib2 || bib1 !== bib2 || validateLocal(bib1) !== null
          }
          className="w-full rounded-2xl bg-slate-900 text-white px-4 py-3 text-base disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy && (
            <span className="inline-block h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
          )}
          {busy ? "Enregistrement..." : "Valider (ENTER)"}
        </button>
      </form>
    </section>
  );
};
