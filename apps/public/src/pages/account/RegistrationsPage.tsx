import { useEffect } from "react";
import { Link } from "react-router-dom";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { StatusPill } from "../../components/StatusPill";
import { useRegistrationDraft } from "../../hooks/useRegistrationDraft";
import { useSession } from "../../hooks/useSession";
import { participantFullName } from "../../lib/participant";
import { RegistrationWizard } from "./RegistrationWizard";

export function RegistrationsPage() {
  const { registrations, addRegistration, loadRegistrations } = useSession();
  const {
    hydrated,
    wizardOpen,
    setWizardOpen,
    step,
    setStep,
    rulesAccepted,
    setRulesAccepted,
    draft,
    setDraft,
    missingFileNames,
    clearDraft,
  } = useRegistrationDraft();

  useEffect(() => {
    void loadRegistrations();
  }, [loadRegistrations]);

  if (!hydrated) {
    return <LoadingOverlay visible />;
  }

  if (wizardOpen) {
    return (
      <RegistrationWizard
        step={step}
        rulesAccepted={rulesAccepted}
        draft={draft}
        missingFileNames={missingFileNames}
        onStepChange={setStep}
        onRulesAcceptedChange={setRulesAccepted}
        onDraftChange={setDraft}
        onCancel={() => { void clearDraft(); }}
        onClearDraft={clearDraft}
        onValidate={(registration) => {
          addRegistration(registration);
          void loadRegistrations();
          setWizardOpen(false);
        }}
      />
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="account-content empty-results">
        <p className="eyebrow">DOSSIERS</p>
        <span className="empty-number">0</span>
        <h2>Aucune inscription pour le moment</h2>
        <p>Créez une inscription pour réserver votre place à l’événement.</p>
        <button type="button" className="button button-dark" onClick={() => setWizardOpen(true)}>
          Nouvelle inscription
        </button>
      </div>
    );
  }

  return (
    <div className="account-content">
      <div className="content-title-row">
        <div>
          <p className="eyebrow">DOSSIERS</p>
          <h2>Mes inscriptions</h2>
          <p className="section-lead">Retrouvez ici vos dossiers d’inscription.</p>
        </div>
        <button type="button" className="button button-dark" onClick={() => setWizardOpen(true)}>
          Nouvelle inscription
        </button>
      </div>
      <div className="registration-table-wrap">
        <table className="registration-table">
          <thead>
            <tr>
              <th>Date d’inscription</th>
              <th>Participant</th>
              <th>Course</th>
              <th>Statut</th>
              <th><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((registration) => (
              <tr key={registration.id}>
                <td data-label="Date d’inscription">{registration.createdAt}</td>
                <td data-label="Participant"><strong>{participantFullName(registration.runner)}</strong></td>
                <td data-label="Course">{registration.runner.race}</td>
                <td data-label="Statut"><StatusPill status={registration.status} /></td>
                <td data-label="Action"><Link className="table-link" to={`/espace/inscriptions/${registration.id}`}>Consulter</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
