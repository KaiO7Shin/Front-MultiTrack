import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/feedback";
import { FormField, inputClassName } from "@/components/ui/form-field";

type InscriptionCancelModalProps = {
  open: boolean;
  participantName: string;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (commentaire: string) => void;
};

export function InscriptionCancelModal({
  open,
  participantName,
  saving,
  error,
  onClose,
  onConfirm,
}: InscriptionCancelModalProps) {
  const [commentaire, setCommentaire] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCommentaire("");
    setLocalError(null);
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const trimmed = commentaire.trim();
    if (!trimmed) {
      setLocalError("Un commentaire est obligatoire pour annuler une inscription.");
      return;
    }
    onConfirm(trimmed);
  };

  const displayError = localError || error;

  return (
    <Modal
      open={open}
      title="Annuler l’inscription"
      onClose={onClose}
      disabled={saving}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-5">
        {displayError && (
          <Alert variant="error" role="alert">
            {displayError}
          </Alert>
        )}

        <p className="text-sm text-foreground">
          Souhaitez-vous vraiment annuler cette inscription ? Cette action est irréversible.
        </p>
        <p className="text-sm text-muted-foreground">
          Participant : <span className="font-medium text-foreground">{participantName}</span>
        </p>

        <FormField
          label="Motif"
          htmlFor="inscription-cancel-comment"
          required
          hint="Obligatoire. Il sera communiqué par e-mail au coureur."
        >
          <textarea
            id="inscription-cancel-comment"
            className={`${inputClassName} min-h-[100px] resize-y`}
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            disabled={saving}
            placeholder="Précisez le motif de l’annulation…"
          />
        </FormField>

        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
          >
            Fermer
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-[#a72a1f]/35 bg-[#fff0ee] px-4 py-2 text-sm font-medium text-[#a72a1f] hover:bg-[#fde8e4] disabled:opacity-40"
          >
            {saving ? "Annulation…" : "Confirmer l’annulation"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
