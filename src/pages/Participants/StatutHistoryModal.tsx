import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Alert, Spinner } from "@/components/ui/feedback";
import type { StatutLogEntry } from "@/services/statutLogs";

type StatutHistoryModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  load: () => Promise<StatutLogEntry[]>;
};

function formatLogDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StatutHistoryModal({
  open,
  title = "Historique des statuts",
  onClose,
  load,
}: StatutHistoryModalProps) {
  const [rows, setRows] = useState<StatutLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    load()
      .then((data) => {
        if (mounted) setRows(data);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        const message =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data
                ?.message
            : null;
        setError(
          message ||
            (err instanceof Error ? err.message : "Impossible de charger l’historique.")
        );
        setRows([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [open, load]);

  return (
    <Modal open={open} title={title} onClose={onClose} size="lg">
      <div className="space-y-3 p-4 sm:p-5">
        {error && (
          <Alert variant="error" role="alert">
            {error}
          </Alert>
        )}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
            <Spinner className="text-brand" />
            <span className="text-sm">Chargement de l’historique…</span>
          </div>
        ) : rows.length === 0 && !error ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Aucun changement de statut enregistré.
          </p>
        ) : (
          <div className="table-scroll max-h-[60vh] overflow-auto rounded-xl border">
            <table>
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
                    Commentaire
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row, index) => (
                  <tr key={`${row.dateCreation}-${index}`}>
                    <td className="px-3 py-2 text-sm tabular-nums whitespace-nowrap">
                      {formatLogDate(row.dateCreation)}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {row.commentaire?.trim() || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end border-t pt-3">
          <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}

type StatutHistoryButtonProps = {
  onClick: () => void;
  label?: string;
};

export function StatutHistoryButton({
  onClick,
  label = "Historique de statut",
}: StatutHistoryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm text-slate-700 hover:bg-[#8c9962]/10"
      title={label}
      aria-label={label}
    >
      <img src="/archiver.svg" alt="" className="h-5 w-5" aria-hidden />
      <span>{label}</span>
    </button>
  );
}
