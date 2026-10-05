import { useEffect, useState } from "react";
import type { InscriptionReviewDecision } from "@/lib/type";
import { Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/feedback";
import { FormField, inputClassName } from "@/components/ui/form-field";

type InscriptionReviewModalProps = {
  open: boolean;
  decision: InscriptionReviewDecision | null;
  participantName: string;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (commentaire: string) => void;
};

export function InscriptionReviewModal({
  open,
  decision,
  participantName,
  saving,
  error,
  onClose,
  onConfirm,
}: InscriptionReviewModalProps) {
  const [commentaire, setCommentaire] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCommentaire("");
    setLocalError(null);
  }, [open, decision]);

  if (!decision) return null;

  const isRefuse = decision === "Refusée";
  const question = isRefuse
    ? "Souhaitez-vous vraiment refuser cette inscription ?"
    : "Souhaitez-vous vraiment valider cette inscription ?";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const trimmed = commentaire.trim();
    if (isRefuse && !trimmed) {
      setLocalError("Un commentaire est obligatoire pour refuser une inscription.");
      return;
    }
    onConfirm(trimmed);
  };

  const displayError = localError || error;

  return (
    <Modal
      open={open}
      title={isRefuse ? "Refuser l’inscription" : "Valider l’inscription"}
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

        <p className="text-sm text-foreground">{question}</p>
        <p className="text-sm text-muted-foreground">
          Participant : <span className="font-medium text-foreground">{participantName}</span>
        </p>

        <FormField
          label="Commentaire"
          htmlFor="inscription-review-comment"
          required={isRefuse}
          hint={
            isRefuse
              ? "Obligatoire pour un refus."
              : "Optionnel pour une validation."
          }
        >
          <textarea
            id="inscription-review-comment"
            className={`${inputClassName} min-h-[100px] resize-y`}
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            disabled={saving}
            placeholder="Précisez le motif ou une remarque…"
          />
        </FormField>

        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className={
              isRefuse
                ? "rounded-xl border border-[#a72a1f]/35 bg-[#fff0ee] px-4 py-2 text-sm font-medium text-[#a72a1f] hover:bg-[#fde8e4] disabled:opacity-40"
                : "rounded-xl bg-brand-cta px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
            }
          >
            {saving ? "Enregistrement…" : isRefuse ? "Confirmer le refus" : "Confirmer la validation"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
