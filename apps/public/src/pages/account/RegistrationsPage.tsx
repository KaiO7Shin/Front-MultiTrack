import { Link, useParams } from "react-router-dom";
import { useSession } from "../../hooks/useSession";
import { formatAmount } from "../../lib/utils";
import { findRegistration } from "../../services/registrationService";

const REGISTRATION_SOON_MESSAGE = "Les inscriptions sur ce site seront bientôt disponibles.";

export function RegistrationsPage() {
  const { registrations } = useSession();

  if (registrations.length === 0) {
    return (
      <div className="account-content empty-results">
        <p className="eyebrow">DOSSIERS</p>
        <span className="empty-number">—</span>
        <h2>{REGISTRATION_SOON_MESSAGE}</h2>
        <p>La création d’une nouvelle inscription n’est pas encore ouverte.</p>
      </div>
    );
  }

  return (
    <div className="account-content">
      <div className="content-title-row">
        <div>
          <p className="eyebrow">DOSSIERS</p>
          <h2>Mes inscriptions</h2>
          <p className="section-lead">{REGISTRATION_SOON_MESSAGE}</p>
        </div>
      </div>
      <div className="registration-table-wrap">
        <table className="registration-table">
          <thead>
            <tr>
              <th>Inscription</th>
              <th>Date</th>
              <th>Participant</th>
              <th>Course</th>
              <th>Montant</th>
              <th>Statut</th>
              <th><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((registration) => (
              <tr key={registration.id}>
                <td><strong>{registration.id}</strong></td>
                <td>{registration.createdAt}</td>
                <td>{registration.runner.firstName} {registration.runner.lastName}</td>
                <td>{registration.runner.race}</td>
                <td>{formatAmount(registration.totalAmount)}</td>
                <td><span className="status-pill">{registration.status}</span></td>
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
  const { registrations } = useSession();
  const registration = findRegistration(registrations, registrationId);

  if (!registration) {
    return (
      <div className="account-content">
        <Link className="arrow-link" to="/espace/inscriptions">← Retour aux inscriptions</Link>
        <p className="form-message">Cette inscription est introuvable dans cette session fictive.</p>
      </div>
    );
  }

  return (
    <div className="account-content registration-detail">
      <Link className="arrow-link" to="/espace/inscriptions">← Retour aux inscriptions</Link>
      <div className="content-title-row">
        <div>
          <p className="eyebrow">DOSSIER {registration.id}</p>
          <h2>Détail de l’inscription</h2>
        </div>
        <span className="status-pill">{registration.status}</span>
      </div>
      <dl className="registration-metadata">
        <div><dt>Date d’inscription</dt><dd>{registration.createdAt}</dd></div>
        <div><dt>Mode de paiement</dt><dd>{registration.paymentMethod}</dd></div>
        <div><dt>Référence de paiement</dt><dd>{registration.paymentReference}</dd></div>
        <div><dt>Montant</dt><dd>{formatAmount(registration.totalAmount)}</dd></div>
      </dl>
      <h3>Participant</h3>
      <dl className="registration-metadata">
        <div><dt>Nom</dt><dd>{registration.runner.lastName}</dd></div>
        <div><dt>Prénom</dt><dd>{registration.runner.firstName}</dd></div>
        <div><dt>Date de naissance</dt><dd>{new Date(registration.runner.birthDate).toLocaleDateString("fr-FR")}</dd></div>
        <div><dt>Genre</dt><dd>{registration.runner.gender}</dd></div>
        <div><dt>Catégorie</dt><dd>{registration.runner.category}</dd></div>
        <div><dt>Course choisie</dt><dd>{registration.runner.race}</dd></div>
        <div><dt>Taille de t-shirt finisher</dt><dd>{registration.runner.tshirtSize}</dd></div>
        <div><dt>Pièce d’identité</dt><dd>{registration.runner.identityDocument}</dd></div>
        <div><dt>Certificat médical</dt><dd>{registration.runner.medicalCertificate || "Non fourni"}</dd></div>
        {registration.runner.parentalAuthorization && (
          <div><dt>Autorisation parentale</dt><dd>{registration.runner.parentalAuthorization}</dd></div>
        )}
        <div><dt>Nom du contact d’urgence</dt><dd>{registration.runner.emergencyContactName}</dd></div>
        <div><dt>Téléphone du contact d’urgence</dt><dd>{registration.runner.emergencyContactPhone}</dd></div>
      </dl>
    </div>
  );
}
