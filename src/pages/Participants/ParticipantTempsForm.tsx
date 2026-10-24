import { useState } from "react";
import { Alert } from "@/components/ui/feedback";
import { FormField, inputClassName } from "@/components/ui/form-field";
import type { ParticipantProjection } from "@/lib/type";
import { updateParticipantTemps } from "@/services/participants";

export function ParticipantTempsForm({
  participant,
  onUpdated,
  onSuccess,
  onSubmitStart,
}: {
  participant: ParticipantProjection;
  onUpdated: (participant: ParticipantProjection) => void;
  onSuccess: (message: string) => void;
  onSubmitStart?: () => void;
}) {
  const [duree, setDuree] = useState(participant.temps ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="mt-4 space-y-3 border-t border-border pt-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        onSubmitStart?.();
        const value = duree.trim();
        if (!/^\d+:[0-5]\d:[0-5]\d$/.test(value)) {
          setError("Durée invalide : saisissez HH:MM:SS");
          return;
        }
        setSaving(true);
        try {
          const result = await updateParticipantTemps(participant.id, value);
          setDuree(result.participant.temps ?? value);
          onUpdated(result.participant);
          onSuccess(result.message);
        } catch (err: unknown) {
          const message =
            err && typeof err === "object" && "response" in err
              ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
              : null;
          setError(message?.trim() || "Impossible de mettre à jour le temps");
        } finally {
          setSaving(false);
        }
      }}
    >
      {error && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}
      <FormField label="Nouveau temps" htmlFor="participant-temps">
        <input
          id="participant-temps"
          className={`${inputClassName} text-center tabular-nums`}
          value={duree}
          onChange={(event) => setDuree(event.target.value)}
          inputMode="numeric"
          placeholder="HH:MM:SS"
          aria-label="Temps du finisher"
        />
      </FormField>
      <button
        type="submit"
        disabled={saving}
        className="btn-secondary px-4 py-2 text-sm disabled:opacity-60"
      >
        {saving ? "Enregistrement…" : "Enregistrer le temps"}
      </button>
    </form>
  );
}
