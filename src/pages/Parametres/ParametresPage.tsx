import { useCallback, useEffect, useState } from "react";
import { Alert, PageLoading } from "@/components/ui/feedback";
import { updateParametre, fetchParametres, type AppParametre } from "@/services/parametres";
import { ParametreConfirm } from "./ParametreConfirm";
import { ParametreSwitch } from "./ParametreSwitch";
import {
  APPLICATION_PARAMETRES,
  draftFromRows,
  type ParametreCle,
} from "./parametreSections";

export function ParametresPage() {
  const [rows, setRows] = useState<AppParametre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);
  const [pending, setPending] = useState<{ cle: ParametreCle; next: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  const values = draftFromRows(rows);
  const pendingSection = APPLICATION_PARAMETRES.find((section) => section.cle === pending?.cle);

  function ask(cle: ParametreCle, next: boolean) {
    setFeedback(null);
    setSaveError(null);
    setPending({ cle, next });
  }

  function cancel() {
    if (saving) return;
    setPending(null);
    setSaveError(null);
  }

  async function confirm() {
    if (!pending) return;
    setSaving(true);
    setSaveError(null);
    try {
      const result = await updateParametre(pending.cle, pending.next);
      setRows((current) =>
        current.map((row) =>
          row.parametre === result.parametre.parametre ? result.parametre : row
        )
      );
      setFeedback({ variant: "success", message: result.message });
      setPending(null);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Impossible d’enregistrer le paramètre."
      );
    } finally {
      setSaving(false);
    }
  }

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
      {!loading && !error && !values && (
        <Alert variant="error" role="alert">
          Les paramètres de l’application sont incomplets.
        </Alert>
      )}

      {loading ? (
        <PageLoading message="Chargement des paramètres…" />
      ) : (
        values && (
          <div className="page-card divide-y divide-border overflow-hidden">
            {APPLICATION_PARAMETRES.map((section) => (
              <div
                key={section.cle}
                className="flex items-center justify-between gap-6 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand">{section.label}</p>
                  {section.hint && (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {section.hint}
                    </p>
                  )}
                </div>
                <ParametreSwitch
                  checked={values[section.cle]}
                  disabled={saving}
                  label={section.label}
                  onToggle={() => ask(section.cle, !values[section.cle])}
                />
              </div>
            ))}
          </div>
        )
      )}

      <ParametreConfirm
        label={pendingSection?.label ?? null}
        next={pending?.next ?? false}
        saving={saving}
        error={saveError}
        onCancel={cancel}
        onConfirm={() => {
          void confirm();
        }}
      />
    </section>
  );
}
