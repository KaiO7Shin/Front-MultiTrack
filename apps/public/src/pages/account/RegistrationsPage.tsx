import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { StatusPill } from "../../components/StatusPill";
import { usePublicFlags } from "../../hooks/usePublicFlags";
import { useRegistrationDraft } from "../../hooks/useRegistrationDraft";
import { useSession } from "../../hooks/useSession";
import { INSCRIPTIONS_CLOTUREES } from "../../lib/registrationGate";
import { participantFullName } from "../../lib/participant";
import type { Registration } from "../../types";
import { RegistrationWizard } from "./RegistrationWizard";

export function RegistrationsPage() {
  const { registrations, addRegistration, loadRegistrations } = useSession();
  const { flags } = usePublicFlags();
  const [closedMessage, setClosedMessage] = useState("");
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
    resolveIdempotencyKey,
    clearDraft,
  } = useRegistrationDraft();

  useEffect(() => {
    void loadRegistrations();
  }, [loadRegistrations]);

  function requestNewRegistration() {
    if (flags?.finInscription) {
      setClosedMessage(INSCRIPTIONS_CLOTUREES);
      return;
    }
    setClosedMessage("");
    setWizardOpen(true);
  }

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
        resolveIdempotencyKey={resolveIdempotencyKey}
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
        {closedMessage && <p className="form-error" role="alert">{closedMessage}</p>}
        <button type="button" className="button button-dark" onClick={requestNewRegistration}>
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
        <button type="button" className="button button-dark" onClick={requestNewRegistration}>
          Nouvelle inscription
        </button>
      </div>
      {closedMessage && <p className="form-error" role="alert">{closedMessage}</p>}
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
              <RegistrationRow key={registration.id} registration={registration} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RegistrationRow({ registration }: { registration: Registration }) {
  const navigate = useNavigate();
  const detailPath = `/espace/inscriptions/${registration.id}`;
  return (
    <tr
      className="is-clickable"
      role="link"
      tabIndex={0}
      onClick={() => navigate(detailPath)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(detailPath);
        }
      }}
    >
      <td data-label="Date d’inscription">{registration.createdAt}</td>
      <td data-label="Participant"><strong>{participantFullName(registration.runner)}</strong></td>
      <td data-label="Course">{registration.runner.race}</td>
      <td data-label="Statut"><StatusPill status={registration.status} /></td>
      <td
        data-label="Action"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <Link className="table-link" to={detailPath}>Consulter</Link>
      </td>
    </tr>
  );
}
