import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users } from "lucide-react"; // npm i lucide-react

const ACCENT = "#8c9962";

type Participant = {
  id: number;
  nom: string;
  dossard: number;
  genre: "M" | "F";
  course: string;
  categorie: string;
};

export const ParticipantsList = () => {
  // Mock data (remplace plus tard par API)
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 1, nom: "Rasoa M.", dossard: 124, genre: "F", course: "Trail 12K", categorie: "Senior" },
    { id: 2, nom: "Rakoto J.", dossard: 89, genre: "M", course: "Trail 12K", categorie: "Veteran" },
  ]);
  const [query, setQuery] = useState("");

  const filtered = participants.filter((p) =>
    p.nom.toLowerCase().includes(query.toLowerCase()) ||
    p.dossard.toString().includes(query)
  );

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Participants</h1>
          <p className="text-sm text-slate-500">Liste des inscrits aux différentes courses</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/participants/import"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-[#8c9962]/10"
          >
            Importer CSV
          </Link>
          <Link
            to="/participants/add"
            className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:opacity-90"
          >
            + Ajouter
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Recherche */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou dossard..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#8c9962]/30"
          />
        </div>

        {/* Filtres (placeholders pour l'instant) */}
        <div className="flex gap-2">
          <select className="rounded-lg border px-2 py-1 text-sm focus:ring-2 focus:ring-[#8c9962]/30">
            <option>Toutes les courses</option>
            <option>Trail 12K</option>
            <option>Trail 35K</option>
          </select>
          <select className="rounded-lg border px-2 py-1 text-sm focus:ring-2 focus:ring-[#8c9962]/30">
            <option>Toutes catégories</option>
            <option>Junior</option>
            <option>Senior</option>
            <option>Veteran</option>
          </select>
          <select className="rounded-lg border px-2 py-1 text-sm focus:ring-2 focus:ring-[#8c9962]/30">
            <option>Genre</option>
            <option>Homme</option>
            <option>Femme</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            <Users className="h-10 w-10 mx-auto mb-2 text-slate-400" />
            <p className="text-sm">Aucun participant trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left">
                  <th className="px-4 py-2">Dossard</th>
                  <th className="px-4 py-2">Nom</th>
                  <th className="px-4 py-2">Genre</th>
                  <th className="px-4 py-2">Course</th>
                  <th className="px-4 py-2">Catégorie</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#8c9962]/5">
                    <td className="px-4 py-2 font-medium">{p.dossard}</td>
                    <td className="px-4 py-2">{p.nom}</td>
                    <td className="px-4 py-2">{p.genre}</td>
                    <td className="px-4 py-2">{p.course}</td>
                    <td className="px-4 py-2">{p.categorie}</td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        to={`/participants/${p.id}`}
                        className="text-sm underline text-slate-700 hover:text-[#8c9962]"
                      >
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
