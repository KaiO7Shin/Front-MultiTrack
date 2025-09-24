export const AddParticipant = () => {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Ajouter un participant</h1>
      <form className="bg-white border border-slate-200 rounded-2xl p-6 grid gap-4 sm:grid-cols-2">
        <input className="border rounded-xl px-3 py-2" placeholder="Nom" />
        <input className="border rounded-xl px-3 py-2" type="date" placeholder="Date de naissance" />
        <select className="border rounded-xl px-3 py-2">
          <option>Genre</option>
          <option value="M">Homme</option>
          <option value="F">Femme</option>
        </select>
        <input className="border rounded-xl px-3 py-2" placeholder="N° Dossard" />
        <input className="border rounded-xl px-3 py-2" placeholder="Course ID" />
        <input className="border rounded-xl px-3 py-2" placeholder="Catégorie ID" />
        <div className="sm:col-span-2 flex gap-2">
          <button type="submit" className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm">Enregistrer</button>
          <button type="button" className="rounded-xl border px-4 py-2 text-sm">Enregistrer & ajouter un autre</button>
        </div>
      </form>
    </section>
  );
}