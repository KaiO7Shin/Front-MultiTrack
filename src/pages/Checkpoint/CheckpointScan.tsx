import { useState } from "react";

export const CheckpointScan = () => {
  const [last, setLast] = useState<string[]>([]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const bib = String(fd.get("bib") || "").trim();
    if (!bib) return;
    setLast((arr) => [bib, ...arr].slice(0, 10));
    e.currentTarget.reset();
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Pointage Checkpoint</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-3">
        <input
          name="bib"
          autoFocus
          inputMode="numeric"
          className="text-3xl px-4 py-3 rounded-2xl border"
          placeholder="N° Dossard"
        />
        <button className="rounded-2xl bg-slate-900 text-white px-4 py-3 text-base">Valider (ENTER)</button>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="font-medium mb-2">10 derniers passages</div>
        <ul className="text-sm text-slate-600 flex flex-wrap gap-2">
          {last.map((b, i) => (
            <li key={i} className="px-2 py-1 rounded-lg bg-slate-100">{b}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
