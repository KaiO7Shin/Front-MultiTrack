export const ImportParticipants = () => {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Import CSV</h1>
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <input type="file" accept=".csv" className="block" />
        <p className="mt-3 text-sm text-slate-500">
          Dépose ton fichier CSV (en-têtes : nom, date_naissance, genre, num_dossard, course_choisie_id, d_categorie_id).
        </p>
      </div>
    </section>
  );
}