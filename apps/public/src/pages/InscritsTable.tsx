import type { PublicInscrit } from "../services/publicSite";

export function InscritsTable({ rows, emptyLabel }: { rows: PublicInscrit[]; emptyLabel: string }) {
  return (
    <div className="registration-table-wrap">
      <table className="registration-table inscrits-table">
        <thead>
          <tr>
            <th className="col-num">Dossard</th>
            <th className="col-text">Nom</th>
            <th className="col-text">Prénom</th>
            <th className="col-text">Course</th>
            <th className="col-code">Genre</th>
            <th className="col-code">Catégorie</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty-table">{emptyLabel}</td>
            </tr>
          ) : rows.map((row, index) => (
            <tr key={`${row.dossard}-${row.nom}-${row.prenom}-${index}`}>
              <td className="col-num">{row.dossard || "—"}</td>
              <td className="col-text"><strong>{row.nom}</strong></td>
              <td className="col-text">{row.prenom}</td>
              <td className="col-text">{row.course}</td>
              <td className="col-code">{row.genre}</td>
              <td className="col-code">{row.categorie}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
