import { useEffect, useMemo, useRef, useState } from "react";

export const CheckpointScan = () => {
  const [last, setLast] = useState<Array<{ bib: string; ts: number }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const undoTimer = useRef<number | null>(null);
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

  const lastBib = useMemo(() => (last[0]?.bib ? last[0].bib : null), [last]);

  function vibrate(ms = 30) {
    if (navigator?.vibrate) navigator.vibrate(ms);
  }

  function pushBib(bib: string) {
    setLast((arr) => [{ bib, ts: Date.now() }, ...arr].slice(0, 10));
  }

  function handleUndo() {
    setLast((arr) => arr.slice(1));
    setError(null);
    vibrate(10);
  }

  function validateLocal(bib: string) {
    if (!/^\d{1,6}$/.test(bib)) return "Numéro invalide (1 à 6 chiffres)";
    const recent = last.find((x) => x.bib === bib && Date.now() - x.ts < 120000);
    if (recent) return "Doublon récent (< 2 min)";
    return null;
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

    try {
      // TODO: appel API
      // await api.post('/api/passages', { num_dossard: bib, course_id })

      pushBib(bib);
      vibrate(20);

      if (undoTimer.current) window.clearTimeout(undoTimer.current);
      undoTimer.current = window.setTimeout(() => {
        undoTimer.current && window.clearTimeout(undoTimer.current);
        undoTimer.current = null;
      }, 10000);

      setBib1("");
      setBib2("");
      inputRef1.current?.focus();
    } catch (err: any) {
      setError(err?.message || "Erreur d’enregistrement");
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

      {/* LISTE DERNIERS PASSAGES */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">10 derniers passages</div>
          {lastBib && undoTimer.current && (
            <button
              onClick={handleUndo}
              className="text-sm rounded-lg px-3 py-1.5 border hover:bg-slate-50"
              title="Annuler le dernier enregistrement (10s)"
            >
              Annuler dernier ({lastBib})
            </button>
          )}
        </div>

        {last.length === 0 ? (
          <div className="text-sm text-slate-500">Aucun passage pour l’instant.</div>
        ) : (
          <ul className="divide-y">
            {last.map((item, i) => (
              <li key={i} className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center min-w-10 h-8 px-3 rounded-lg bg-slate-100 text-slate-900 font-semibold">
                    {item.bib}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(item.ts).toLocaleTimeString()}
                  </span>
                </div>
                <span className="text-[11px] px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  OK
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
