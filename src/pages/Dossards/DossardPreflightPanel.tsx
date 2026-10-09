import { Alert } from "@/components/ui/feedback";
import type { DossardAnomalie, DossardPreflight } from "@/lib/type";

export function DossardPreflightPanel({ report }: { report: DossardPreflight }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3 text-sm">
        <Stat label="Participants « Inscrit »" value={String(report.participants)} />
        <Stat label="Pages PDF" value={String(report.pages)} />
        <Stat
          label="Type"
          value={
            report.duo
              ? `${report.dossardsPrincipaux} nominatifs + ${report.dossardsBinome} binôme`
              : "Dossards nominatifs"
          }
        />
      </div>

      {report.participantsIgnores > 0 && (
        <Alert variant="info">
          {report.participantsIgnores} participant
          {report.participantsIgnores > 1 ? "s" : ""} d’un autre statut (Présent,
          DNS, DSQ…) {report.participantsIgnores > 1 ? "sont exclus" : "est exclu"}{" "}
          de la génération.
        </Alert>
      )}

      {report.erreurs.length > 0 && (
        <Alert variant="error" role="alert">
          <p className="font-medium mb-1">
            {report.erreurs.length} anomalie{report.erreurs.length > 1 ? "s" : ""}{" "}
            bloquante{report.erreurs.length > 1 ? "s" : ""}
          </p>
          <AnomalieList items={report.erreurs} />
        </Alert>
      )}

      {report.avertissements.length > 0 && (
        <Alert variant="warning">
          <p className="font-medium mb-1">
            {report.avertissements.length} avertissement
            {report.avertissements.length > 1 ? "s" : ""}
          </p>
          <AnomalieList items={report.avertissements} />
        </Alert>
      )}

      {report.generable && report.erreurs.length === 0 && (
        <Alert variant="success">
          {report.pages} dossard{report.pages > 1 ? "s" : ""} prêt
          {report.pages > 1 ? "s" : ""} à générer
          {report.duo
            ? " (le second exemplaire d’une paire duo n’imprime que le code-barres et le numéro)."
            : "."}
        </Alert>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  );
}

function AnomalieList({ items }: { items: DossardAnomalie[] }) {
  return (
    <ul className="list-disc pl-4 space-y-1 text-sm">
      {items.slice(0, 20).map((item, index) => (
        <li key={`${item.code}-${item.participantId ?? "x"}-${index}`}>
          {item.numDossard ? (
            <span className="font-mono">{item.numDossard} — </span>
          ) : null}
          {item.message}
        </li>
      ))}
      {items.length > 20 && <li>… et {items.length - 20} de plus</li>}
    </ul>
  );
}
