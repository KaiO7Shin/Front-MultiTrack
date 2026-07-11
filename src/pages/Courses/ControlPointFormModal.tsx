import { useEffect, useState } from "react";
import type {
  ControlPointConfig,
  ControlPointCreateDTO,
} from "@/lib/type";
import { Alert } from "@/components/ui/feedback";
import { FormField, inputClassName } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";

type ControlPointFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  courseId: number;
  initial?: ControlPointConfig | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (dto: ControlPointCreateDTO) => void;
};

export function ControlPointFormModal({
  open,
  mode,
  courseId,
  initial,
  saving,
  error,
  onClose,
  onSubmit,
}: ControlPointFormModalProps) {
  const [label, setLabel] = useState("");
  const [numero, setNumero] = useState("");
  const [passcode, setPasscode] = useState("");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setLabel(initial.label);
      setNumero(String(initial.numero));
      setPasscode("");
    } else {
      setLabel("");
      setNumero("");
      setPasscode("");
    }
  }, [open, mode, initial]);

  return (
    <Modal
      open={open}
      title={
        mode === "create"
          ? "Ajouter un point de contrôle"
          : "Modifier le point de contrôle"
      }
      onClose={onClose}
      disabled={saving}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const dto: ControlPointCreateDTO = {
            courseId,
            label: label.trim(),
            numero: Number(numero),
          };
          const trimmedPasscode = passcode.trim();
          if (trimmedPasscode) dto.passcode = trimmedPasscode;
          onSubmit(dto);
        }}
        className="space-y-4 px-5 py-4"
      >
        <FormField
          label="Libellé"
          htmlFor="cp-label"
          hint="Court libellé affiché au collaborateur (max. 10 caractères)."
          required
        >
          <input
            id="cp-label"
            className={inputClassName}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex. PC1, Ravito…"
            maxLength={10}
            required
            disabled={saving}
          />
        </FormField>

        <FormField
          label="Numéro"
          htmlFor="cp-numero"
          hint="Ordre d'affichage dans le classement."
          required
        >
          <input
            id="cp-numero"
            type="number"
            min={1}
            max={99}
            className={inputClassName}
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            required
            disabled={saving}
          />
        </FormField>

        <FormField
          label={mode === "create" ? "Passcode collaborateur" : "Nouveau passcode"}
          htmlFor="cp-passcode"
          hint={
            mode === "create"
              ? "Laisser vide pour génération automatique. Le passcode ne sera affiché qu'une fois."
              : "Laisser vide pour conserver le passcode actuel."
          }
        >
          <input
            id="cp-passcode"
            className={inputClassName}
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder={mode === "create" ? "Auto-généré si vide" : "Optionnel"}
            minLength={4}
            disabled={saving}
          />
        </FormField>

        {error && (
          <Alert variant="error" role="alert">
            {error}
          </Alert>
        )}

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
            disabled={saving || !label.trim() || !numero}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
