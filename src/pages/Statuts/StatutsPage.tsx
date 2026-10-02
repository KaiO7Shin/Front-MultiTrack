import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/feedback";
import {
  statusBadgeClass,
  statusLabel,
} from "@/pages/Participants/participantStatus";
import { fetchStatuts, type StatutOption } from "@/services/statuts";
import type { ParticipantStatus } from "@/lib/type";

export function StatutsPage() {
  const [statuts, setStatuts] = useState<StatutOption[]>([]);
  const [scope, setScope] = useState<"all" | "inscription" | "participant">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStatuts(scope === "all" ? undefined : scope);
      setStatuts(data);
    } catch {
      setError("Impossible de charger les statuts.");
      setStatuts([]);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Statuts</h1>
          <p className="page-subtitle">
            Référentiel en lecture seule (libellés uniques côté base). Les écritures
            ne sont pas exposées pour préserver l&apos;intégrité des workflows.
          </p>
        </div>
        <div className="page-actions">
          <select
            className="rounded-xl border px-3 py-2 text-sm"
            value={scope}
            onChange={(e) =>
              setScope(e.target.value as "all" | "inscription" | "participant")
            }
          >
            <option value="all">Tous</option>
            <option value="inscription">Inscription</option>
            <option value="participant">Participant</option>
          </select>
        </div>
      </div>

      {error && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}

      <div className="bg-white border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Chargement des statuts…
          </div>
        ) : statuts.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Aucun statut pour ce filtre.
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Id</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Libellé
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {statuts.map((s) => (
                  <tr key={s.id} className="hover:bg-[#8c9962]/5">
                    <td className="px-4 py-3 text-slate-500">{s.id}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(
                          s.libelle as ParticipantStatus
                        )}`}
                      >
                        {statusLabel(s.libelle)}
                      </span>
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
}
