import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { DocumentIcon } from "../../components/icons";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { StatusPill } from "../../components/StatusPill";
import { useRegistrationDraft } from "../../hooks/useRegistrationDraft";
import { useSession } from "../../hooks/useSession";
import { isMinor, participantFullName } from "../../lib/participant";
import { formatAmount } from "../../lib/utils";
import { findRegistration } from "../../services/registrationService";
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
        onCancel={() => setWizardOpen(false)}
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
                <td>{registration.createdAt}</td>
                <td><strong>{participantFullName(registration.runner)}</strong></td>
                <td>{registration.runner.race}</td>
                <td><StatusPill status={registration.status} /></td>
                <td><Link className="table-link" to={`/espace/inscriptions/${registration.id}`}>Consulter</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RegistrationDetailPage() {
  const { registrationId } = useParams();
  const { registrations, loadRegistrations } = useSession();
  const registration = findRegistration(registrations, registrationId);

  useEffect(() => {
    if (!registration) {
      void loadRegistrations();
    }
  }, [loadRegistrations, registration]);

  if (!registration) {
    return (
      <div className="account-content">
        <Link className="arrow-link" to="/espace/inscriptions">← Retour aux inscriptions</Link>
        <p className="form-message">Cette inscription est introuvable.</p>
      </div>
    );
  }

  const minor = isMinor(registration.runner.birthDate);

  return (
    <div className="account-content registration-detail">
      <Link className="arrow-link" to="/espace/inscriptions">← Retour aux inscriptions</Link>
      <div className="content-title-row">
        <div>
          <p className="eyebrow">{registration.runner.race}</p>
          <h2>Détail de l’inscription</h2>
          <p className="section-lead">Inscrit le {registration.createdAt}</p>
        </div>
        <StatusPill status={registration.status} />
      </div>

      <section className="registration-section">
        <h3>Participant</h3>
        <dl className="profile-details">
          <div><dt>Nom</dt><dd>{registration.runner.lastName || "—"}</dd></div>
          <div><dt>Prénom</dt><dd>{registration.runner.firstName || "—"}</dd></div>
          <div>
            <dt>Date de naissance</dt>
            <dd>{formatBirthDate(registration.runner.birthDate)}</dd>
          </div>
          <div><dt>Genre</dt><dd>{registration.runner.gender || "—"}</dd></div>
          <div><dt>Taille t-shirt</dt><dd>{registration.runner.tshirtSize || "—"}</dd></div>
        </dl>
      </section>

      <section className="registration-section">
        <h3>Documents et frais</h3>
        <dl className="profile-details">
          <div>
            <dt>Pièce d’identité</dt>
            <dd><DocumentValue url={registration.runner.identityDocument} /></dd>
          </div>
          <div>
            <dt>Certificat médical</dt>
            <dd><DocumentValue url={registration.runner.medicalCertificate} /></dd>
          </div>
          {minor && (
            <div>
              <dt>Autorisation parentale</dt>
              <dd><DocumentValue url={registration.runner.parentalAuthorization} /></dd>
            </div>
          )}
          <div><dt>Moyen de paiement</dt><dd>{registration.paymentMethod || "—"}</dd></div>
          <div>
            <dt>Montant</dt>
            <dd>{registration.totalAmount ? formatAmount(registration.totalAmount) : "—"}</dd>
          </div>
          <div><dt>Référence</dt><dd>{registration.paymentReference || "—"}</dd></div>
        </dl>
      </section>

      <section className="registration-section">
        <h3>Contact d’urgence</h3>
        <dl className="profile-details">
          <div><dt>Nom</dt><dd>{registration.runner.emergencyContactName || "—"}</dd></div>
          <div><dt>Contact</dt><dd>{registration.runner.emergencyContactPhone || "—"}</dd></div>
        </dl>
      </section>
    </div>
  );
}

function DocumentValue({ url }: { url?: string }) {
  if (!isApiDocumentUrl(url)) {
    return "Non fourni";
  }
  return (
    <a
      className="document-file-link"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <DocumentIcon />
      Ouvrir
    </a>
  );
}

function isApiDocumentUrl(url?: string) {
  if (!url) return false;
  if (/drive\.google\.com/i.test(url)) return false;
  return /\/api\/me\/registrations\/[^/]+\/documents\//.test(url);
}

function formatBirthDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR");
}
