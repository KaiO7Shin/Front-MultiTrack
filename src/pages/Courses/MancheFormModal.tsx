import { useEffect, useState } from "react";
import type { Manche, MancheCreateDTO } from "@/lib/type";
import { Alert } from "@/components/ui/feedback";
import { FormField, inputClassName } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";

type MancheFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  phaseId: number;
  phaseLabel: string;
  initial?: Manche | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (dto: MancheCreateDTO) => void;
};

export function MancheFormModal({
  open,
  mode,
  phaseId,
  phaseLabel,
  initial,
  saving,
  error,
  onClose,
  onSubmit,
}: MancheFormModalProps) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!open) return;
    setLabel(mode === "edit" && initial ? initial.label : "");
  }, [open, mode, initial]);

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Ajouter une manche" : "Modifier la manche"}
      onClose={onClose}
      disabled={saving}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ phaseId, label: label.trim() });
        }}
        className="space-y-4 px-5 py-4"
      >
        <p className="text-xs text-slate-500">
          Phase : <span className="font-medium text-slate-700">{phaseLabel}</span>
        </p>

        <FormField
          label="Label de la manche"
          htmlFor="manche-label"
          hint="Une manche appartient toujours à la phase sélectionnée."
          required
        >
          <input
            id="manche-label"
            className={inputClassName}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex. Manche 1, Poule A, Finale…"
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
