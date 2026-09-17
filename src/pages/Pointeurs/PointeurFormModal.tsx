import { useEffect, useState } from "react";
import type { Pointeur } from "@/lib/type";
import { Alert } from "@/components/ui/feedback";
import { FormField, inputClassName } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";

type PointeurFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Pointeur | null;
  saving: boolean;
  error: string | null;
  revealedPasscode: string | null;
  onClose: () => void;
  onSubmit: (dto: { libelle: string; passcode?: string }) => void;
};

export function PointeurFormModal({
  open,
  mode,
  initial,
  saving,
  error,
  revealedPasscode,
  onClose,
  onSubmit,
}: PointeurFormModalProps) {
  const [libelle, setLibelle] = useState("");
  const [passcode, setPasscode] = useState("");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setLibelle(initial.libelle ?? "");
      setPasscode("");
    } else {
      setLibelle("");
      setPasscode("");
    }
  }, [open, mode, initial]);

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Nouveau pointeur" : "Modifier le pointeur"}
      onClose={onClose}
      disabled={saving}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const dto: { libelle: string; passcode?: string } = {
            libelle: libelle.trim(),
          };
          const trimmed = passcode.trim();
          if (trimmed) dto.passcode = trimmed;
          onSubmit(dto);
        }}
        className="space-y-4 px-5 py-4"
      >
        <FormField
          label="Libellé"
          htmlFor="pointeur-libelle"
          hint="Nom affiché au checkpoint (ex. Départ Spé 1)."
          required
        >
          <input
            id="pointeur-libelle"
            className={inputClassName}
            value={libelle}
            onChange={(e) => setLibelle(e.target.value)}
            placeholder="Ex. Arrivée DH, Spé 2…"
            maxLength={80}
            required
            disabled={saving}
          />
        </FormField>

        <FormField
          label={mode === "create" ? "Passcode" : "Nouveau passcode"}
          htmlFor="pointeur-passcode"
          hint={
            mode === "create"
              ? "Laisser vide pour génération automatique. Affiché une seule fois."
              : "Laisser vide pour conserver le passcode actuel."
          }
        >
          <input
            id="pointeur-passcode"
            className={inputClassName}
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder={mode === "create" ? "Auto-généré si vide" : "Optionnel"}
            minLength={4}
            disabled={saving}
          />
        </FormField>

        {revealedPasscode && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Passcode : <strong className="font-mono">{revealedPasscode}</strong>
            <span className="block text-xs mt-1 text-amber-700">
              Notez-le maintenant : il ne sera plus affiché ensuite.
            </span>
          </div>
        )}

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
            {revealedPasscode ? "Fermer" : "Annuler"}
          </button>
          <button
            type="submit"
            disabled={saving || !libelle.trim()}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
