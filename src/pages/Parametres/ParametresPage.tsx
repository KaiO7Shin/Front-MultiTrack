import { useCallback, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Alert, PageLoading } from "@/components/ui/feedback";
import { fetchParametres, type AppParametre } from "@/services/parametres";
import { ApplicationParametresModal } from "./ApplicationParametresModal";

export function ParametresPage() {
  const [rows, setRows] = useState<AppParametre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchParametres());
    } catch (err) {
      setRows([]);
      setError(
        err instanceof Error ? err.message : "Impossible de charger les paramètres."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Paramètres</h1>
          <p className="page-subtitle">Réglages de l’application.</p>
        </div>
      </div>

      {error && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}
      {feedback && (
        <Alert variant={feedback.variant} role={feedback.variant === "error" ? "alert" : "status"}>
          {feedback.message}
        </Alert>
      )}

      {loading ? (
        <PageLoading message="Chargement des paramètres…" />
      ) : (
        <div className="page-card divide-y divide-border overflow-hidden">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => {
              setFeedback(null);
              setOpen(true);
            }}
            disabled={Boolean(error)}
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium text-brand">
                Paramètres de l’application
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Classements, inscriptions et publication des résultats
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        </div>
      )}

      <ApplicationParametresModal
        open={open}
        rows={rows}
        onClose={() => setOpen(false)}
        onSaved={(next, message) => {
          setRows(next);
          setFeedback({ variant: "success", message });
          setOpen(false);
        }}
        onSaveError={(message) => setFeedback({ variant: "error", message })}
      />
    </section>
  );
}
