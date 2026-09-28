import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/feedback";
import { FormField, selectClassName } from "@/components/ui/form-field";
import type { ParticipantStatus } from "@/lib/type";
import { formatParticipantName } from "@/lib/utils";
import { PARTICIPANT_STATUSES, statusBadgeClass } from "./participantStatus";

export type ParticipantStatusTarget = {
  numDossard: string;
  nom: string;
  prenom: string;
  statut: ParticipantStatus;
};

type ParticipantStatusModalProps = {
  participant: ParticipantStatusTarget | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (newStatus: ParticipantStatus) => void;
};

export function ParticipantStatusModal({
  participant,
  saving,
  error,
  onClose,
  onConfirm,
}: ParticipantStatusModalProps) {
  const [selected, setSelected] = useState<ParticipantStatus | "">("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!participant) return;
    setSelected("");
    setConfirming(false);
  }, [participant]);

  if (!participant) return null;

  const available = PARTICIPANT_STATUSES.filter((s) => s !== participant.statut);
  const canContinue = Boolean(selected) && !saving;

  function handleClose() {
    if (saving) return;
    onClose();
  }

  function handlePrimary() {
    if (!selected) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onConfirm(selected);
  }

  return (
    <Modal
      open={Boolean(participant)}
      title="Changer le statut"
      onClose={handleClose}
      disabled={saving}
      size="md"
    >
      <div className="space-y-4 px-4 py-4 sm:px-5">
        <div className="rounded-xl border bg-slate-50 px-3 py-3 text-sm">
          <p className="font-medium text-slate-800">
            {formatParticipantName(participant.prenom, participant.nom)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Dossard {participant.numDossard}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            Statut actuel
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(participant.statut)}`}
            >
              {participant.statut}
            </span>
          </p>
        </div>

        {error && (
          <Alert variant="error" role="alert">
            {error}
          </Alert>
        )}

        {!confirming ? (
          <FormField label="Nouveau statut" htmlFor="status-select" required>
            <select
              id="status-select"
              className={selectClassName}
              value={selected}
              onChange={(e) => setSelected(e.target.value as ParticipantStatus)}
              disabled={saving}
            >
              <option value="" disabled>
                Choisir un statut…
              </option>
              {available.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </FormField>
        ) : (
          <Alert variant="warning" role="status">
            Confirmer le passage de <strong>{participant.statut}</strong> vers{" "}
            <strong>{selected}</strong> pour le dossard {participant.numDossard} ?
          </Alert>
        )}

        <div className="flex justify-end gap-2 border-t pt-4">
          {confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={saving}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-40"
            >
              Retour
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-40"
            >
              Annuler
            </button>
          )}
          <button
            type="button"
            onClick={handlePrimary}
            disabled={!canContinue}
            className="rounded-xl bg-navy px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-40"
          >
            {saving
              ? "Enregistrement…"
              : confirming
                ? "Confirmer"
                : "Continuer"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
