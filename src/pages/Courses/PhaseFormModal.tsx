import { useEffect, useState } from "react";
import type { Phase, PhaseCreateDTO } from "@/lib/type";
import { Alert } from "@/components/ui/feedback";
import { FormField, inputClassName } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";

type PhaseFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  courseId: number;
  initial?: Phase | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (dto: PhaseCreateDTO) => void;
};

export function PhaseFormModal({
  open,
  mode,
  courseId,
  initial,
  saving,
  error,
  onClose,
  onSubmit,
}: PhaseFormModalProps) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!open) return;
    setLabel(mode === "edit" && initial ? initial.label : "");
  }, [open, mode, initial]);

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Ajouter une phase" : "Modifier la phase"}
      onClose={onClose}
      disabled={saving}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ courseId, label: label.trim() });
        }}
        className="space-y-4 px-5 py-4"
      >
        <FormField
          label="Nom de la phase"
          htmlFor="phase-label"
          hint="Une phase peut contenir plusieurs manches (ex. poules, manches de qualif)."
          required
        >
          <input
            id="phase-label"
            className={inputClassName}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex. Qualifications, Éliminatoires, Finale…"
            maxLength={30}
            required
            disabled={saving}
          />
        </FormField>

        {error && <Alert variant="error" role="alert">{error}</Alert>}

        <div className="flex justify-end gap-2 border-t pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-brand-muted"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving || !label.trim()}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
