import { Link } from "react-router-dom";

export const ParticipantsList = () => {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Participants</h1>
        <div className="flex gap-2">
          <Link to="/participants/import" className="rounded-xl border px-3 py-2 text-sm">Importer CSV</Link>
          <Link to="/participants/add" className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm">+ Ajouter</Link>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="text-sm text-slate-500">Tableau à venir… (filtres : course, catégorie, genre)</div>
      </div>
    </section>
  );
}