import { Alert } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { confirmAction } from "./parametreSections";

export function ParametreConfirm({
  label,
  next,
  saving,
  error,
  onCancel,
  onConfirm,
}: {
  label: string | null;
  next: boolean;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={label != null}
      title="Confirmer"
      onClose={onCancel}
      disabled={saving}
      size="sm"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="btn-secondary px-4 py-2 text-sm"
            onClick={onCancel}
            disabled={saving}
          >
            Annuler
          </button>
          <button
            type="button"
            className="btn-primary px-4 py-2 text-sm"
            onClick={onConfirm}
            disabled={saving}
          >
            {saving ? "Enregistrement…" : "Confirmer"}
          </button>
        </div>
      }
    >
      <div className="space-y-4 px-5 py-4">
        {error && (
          <Alert variant="error" role="alert">
            {error}
          </Alert>
        )}
        {label && <p className="text-sm leading-relaxed text-foreground">{confirmAction(label, next)}</p>}
      </div>
    </Modal>
  );
}
