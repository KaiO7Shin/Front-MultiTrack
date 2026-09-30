import { Breadcrumb } from "@/components/Breadcrumb";
import { ParticipantCreateForm } from "./ParticipantCreateForm";

export const AddParticipant = () => {
  return (
    <section className="page-section">
      <Breadcrumb
        items={[
          { label: "Participants", to: "/participants" },
          { label: "Ajouter un participant" },
        ]}
      />
      <div>
        <h1 className="page-title">Ajouter un participant</h1>
        <p className="page-subtitle">Inscrivez un coureur à une course.</p>
      </div>
      <ParticipantCreateForm />
    </section>
  );
};
