import { Alert } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import type { CheckingMode } from "@/services/checking";

type CheckingCancelModalProps = {
  open: boolean;
  mode: CheckingMode;
  bibNumber: string;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function CheckingCancelModal({
  open,
  mode,
  bibNumber,
  saving,
  error,
  onClose,
  onConfirm,
}: CheckingCancelModalProps) {
  const action = mode === "presence" ? "la présence" : "l'arrivée";

  return (
    <Modal
      open={open}
      title="Annuler le checking"
      onClose={() => {
        if (saving) return;
        onClose();
      }}
      disabled={saving}
      size="sm"
    >
      <div className="space-y-4 p-4 sm:p-5">
        {error && (
          <Alert variant="error" role="alert">
            {error}
          </Alert>
        )}
        <p className="text-sm text-foreground">
          Annuler {action} du dossard{" "}
          <span className="font-medium tabular-nums">{bibNumber}</span> ?
        </p>
        <p className="text-xs text-muted-foreground">
          Le participant reviendra à son statut précédent
          {mode === "arrivee" ? " et l'heure d'arrivée sera vidée" : ""}.
        </p>
        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
          <button
            type="button"
            onClick={() => {
              if (saving) return;
              onClose();
            }}
            disabled={saving}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="btn-warning px-4 py-2 text-sm"
          >
            {saving ? "Annulation…" : "Confirmer l'annulation"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
