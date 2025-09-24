import { useEffect, useMemo, useRef, useState } from "react";

export const CheckpointScan = () => {
  const [last, setLast] = useState<Array<{ bib: string; ts: number }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const undoTimer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // focus auto + sélection du contenu au focus (plus rapide à enchaîner)
  useEffect(() => {
    inputRef.current?.focus();
    const el = inputRef.current;
    if (!el) return;
    const onFocus = () => el.select();
    el.addEventListener("focus", onFocus);
    return () => el.removeEventListener("focus", onFocus);
  }, []);

  // dernier passage (pour Undo)
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
    // Ex: n° dossard 1 à 6 chiffres
    if (!/^\d{1,6}$/.test(bib)) return "Numéro invalide (1 à 6 chiffres)";
    // Anti-doublon local < 2 min sur le même bib (indicatif côté UI)
    const recent = last.find((x) => x.bib === bib && Date.now() - x.ts < 120000);
    if (recent) return "Doublon récent (< 2 min)";
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    const raw = String(fd.get("bib") || "");
    const bib = raw.trim();
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
      // TODO: appeler ton API ici (axios) si nécessaire.
      // await api.post('/api/passages', { num_dossard: bib, course_id })

      pushBib(bib);
      vibrate(20);

      // Activer fenêtre d'undo pendant 10s
      if (undoTimer.current) window.clearTimeout(undoTimer.current);
      undoTimer.current = window.setTimeout(() => {
        undoTimer.current && window.clearTimeout(undoTimer.current);
        undoTimer.current = null;
      }, 10000);
      e.currentTarget.reset();
      inputRef.current?.focus();
    } catch (err: any) {
      setError(err?.message || "Erreur d’enregistrement");
      vibrate(60);
    } finally {
      setBusy(false);
    }
  }

  // clavier numérique tactile (visible sur mobile seulement)
  function appendDigit(d: string) {
    const el = inputRef.current;
    if (!el) return;
    el.value = (el.value || "") + d;
    el.focus();
  }
  function backspace() {
    const el = inputRef.current;
    if (!el) return;
    el.value = (el.value || "").slice(0, -1);
    el.focus();
  }
  function clearAll() {
    const el = inputRef.current;
    if (!el) return;
    el.value = "";
    el.focus();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-center">
        <h1 className="text-2xl font-semibold">Pointage Checkpoint</h1>
        {/* état compact (ex: réseau, pc) à brancher plus tard */}
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-3">
        <label className="text-sm text-slate-600">N° Dossard</label>
        <input
          name="bib"
          ref={inputRef}
          autoFocus
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          className="w-full text-3xl px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          placeholder="Ex. 1234"
          onKeyDown={(e) => {
            // limiter aux chiffres, backspace, delete, arrows, enter
            const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"];
            if (/^\d$/.test(e.key) || allowed.includes(e.key)) return;
            e.preventDefault();
          }}
        />

        {error && (
          <div className="text-sm rounded-xl bg-red-50 text-red-700 px-3 py-2 border border-red-200">
            {error}
          </div>
        )}

        <button
          disabled={busy}
          className="w-full rounded-2xl bg-slate-900 text-white px-4 py-3 text-base disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy && <span className="inline-block h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />}
          {busy ? "Enregistrement..." : "Valider (ENTER)"}
        </button>

        {/* Numpad tactile: visible seulement < md */}
        <div className="md:hidden pt-2 grid grid-cols-3 gap-2">
          {["1","2","3","4","5","6","7","8","9","C","0","OK"].map((k) => (
            <button
              key={k}
              type={k === "OK" ? "submit" : "button"}
              onClick={
                k === "C" ? clearAll :
                k === "OK" ? undefined :
                k === "←" ? backspace :
                () => appendDigit(k)
              }
              className={`h-12 rounded-xl border text-lg font-medium ${
                k === "OK" ? "bg-slate-900 text-white" : "bg-white"
              }`}
            >
              {k === "C" ? "⌫" : k}
            </button>
          ))}
          <button type="button" onClick={backspace} className="col-span-3 h-12 rounded-xl border">
            Effacer un caractère
          </button>
        </div>
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
                {/* placeholder pour badges d'état (OK / Doublon / Hors ordre) */}
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
