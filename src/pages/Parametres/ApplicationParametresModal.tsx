import { useEffect, useId, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { fetchParametres, updateParametre, type AppParametre } from "@/services/parametres";
import {
  APPLICATION_PARAMETRES,
  draftFromRows,
  type ParametreCle,
  type ParametreDraft,
} from "./parametreSections";

type ApplicationParametresModalProps = {
  open: boolean;
  rows: AppParametre[];
  onClose: () => void;
  onSaved: (rows: AppParametre[], message: string) => void;
  onSaveError: (message: string) => void;
};

export function ApplicationParametresModal({
  open,
  rows,
  onClose,
  onSaved,
  onSaveError,
}: ApplicationParametresModalProps) {
  const [draft, setDraft] = useState<ParametreDraft | null>(null);
  const [baseline, setBaseline] = useState<ParametreDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const formId = useId();

  useEffect(() => {
    if (!open) return;
    const next = draftFromRows(rows);
    setDraft(next);
    setBaseline(next);
    setError(
      next
        ? null
        : "Les paramètres de l’application sont incomplets."
    );
  }, [open, rows]);

  function setValue(cle: ParametreCle, valeur: boolean) {
    setDraft((current) => (current ? { ...current, [cle]: valeur } : current));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft || !baseline) {
      setError("Les paramètres de l’application sont incomplets.");
      return;
    }

    const changed = APPLICATION_PARAMETRES.filter(
      (section) => draft[section.cle] !== baseline[section.cle]
    );
    if (changed.length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await Promise.all(
        changed.map((section) => updateParametre(section.cle, draft[section.cle]))
      );
      const message =
        updated.find((result) => result.message)?.message ??
        "Paramètre mis à jour avec succès";
      onSaved(await fetchParametres(), message);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible d’enregistrer les paramètres.";
      setError(message);
      onSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Paramètres de l’application"
      onClose={onClose}
      disabled={saving}
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="btn-secondary px-4 py-2 text-sm"
            onClick={onClose}
            disabled={saving}
          >
            Annuler
          </button>
          <button
            type="submit"
            form={formId}
            className="btn-primary px-4 py-2 text-sm"
            disabled={saving || !draft}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-5 px-5 py-4">
        {error && (
          <Alert variant="error" role="alert">
            {error}
          </Alert>
        )}

        {draft &&
          APPLICATION_PARAMETRES.map((section) => (
            <fieldset key={section.cle} className="space-y-2" disabled={saving}>
              <legend className="text-sm font-medium text-brand">{section.label}</legend>
              {section.hint && (
                <p className="text-xs leading-relaxed text-muted-foreground">{section.hint}</p>
              )}
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
                <label className="inline-flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="radio"
                    name={section.cle}
                    className="h-4 w-4 accent-brand"
                    checked={draft[section.cle] === true}
                    onChange={() => setValue(section.cle, true)}
                  />
                  Oui
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="radio"
                    name={section.cle}
                    className="h-4 w-4 accent-brand"
                    checked={draft[section.cle] === false}
                    onChange={() => setValue(section.cle, false)}
                  />
                  Non
                </label>
              </div>
            </fieldset>
          ))}
      </form>
    </Modal>
  );
}
