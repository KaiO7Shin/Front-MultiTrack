export const LeaderboardPage = () => {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Classement</h1>
        <button className="rounded-xl border px-4 py-2 text-sm">Exporter PDF</button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="text-sm text-slate-500">Filtres : Course, Général/Catégorie, Genre</div>
        <div className="mt-4 text-sm text-slate-500">Tableau des résultats à venir…</div>
      </div>
    </section>
  );
}