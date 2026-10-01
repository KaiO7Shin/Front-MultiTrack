import { formatParticipantName } from "@/lib/utils";
import type { ParticipantProjection } from "@/lib/type";
import { Alert } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";

type ParticipantDeleteModalProps = {
  target: ParticipantProjection | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function ParticipantDeleteModal({
  target,
  saving,
  error,
  onClose,
  onConfirm,
}: ParticipantDeleteModalProps) {
  return (
    <Modal
      open={target !== null}
      title="Supprimer le participant"
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
          Souhaitez-vous vraiment supprimer{" "}
          <span className="font-medium">
            {target ? formatParticipantName(target.prenom, target.nom) : ""}
          </span>{" "}
          ?
        </p>
        <p className="text-xs text-muted-foreground">Cette action est définitive.</p>
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
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="rounded-xl border border-[#a72a1f]/35 bg-[#fff0ee] px-4 py-2 text-sm font-medium text-[#a72a1f] hover:bg-[#fde8e4] disabled:opacity-40"
          >
            {saving ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
