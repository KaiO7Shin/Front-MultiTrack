import { useState } from "react";
import { ParticipantCreateForm } from "@/pages/Participants/ParticipantCreateForm";
import { OrganizerParticipantsTracking } from "./OrganizerParticipantsTracking";

export function ParticipantManagementPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <section className="page-section">
      <div>
        <h1 className="page-title">Gestion participant</h1>
        <p className="page-subtitle">
          Ajoutez un coureur et suivez les inscrits.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-brand uppercase tracking-wide">
          Ajout d’un participant
        </h2>
        <ParticipantCreateForm onCreated={() => setRefreshKey((k) => k + 1)} />
      </div>

      <hr className="border-border" />

      <OrganizerParticipantsTracking refreshKey={refreshKey} />
    </section>
  );
}
