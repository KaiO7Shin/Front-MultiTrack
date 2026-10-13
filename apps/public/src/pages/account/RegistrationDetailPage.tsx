import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { INSCRIPTION_STATUS } from "@multitrack/types";
import { DocumentIcon } from "../../components/icons";
import { StatusPill } from "../../components/StatusPill";
import { useSession } from "../../hooks/useSession";
import { needsPartnerTShirt, partnerTShirtLabel } from "../../lib/duoCourses";
import { isMinor } from "../../lib/participant";
import { exportRegistrationPdf } from "../../lib/registrationPdf";
import { formatAmount } from "../../lib/utils";
import { findRegistration } from "../../services/registrationService";
import type { Registration } from "../../types";

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
          <p className="section-lead registration-detail-meta">
            <span>Inscrit le {registration.createdAt}</span>
            <StatusPill status={registration.status} />
          </p>
        </div>
        <div className="content-title-actions">
          <button
            type="button"
            className="button button-outline"
            onClick={() => exportRegistrationPdf(registration)}
          >
            <img src="/pdf.svg" alt="" className="button-icon" aria-hidden />
            Exporter
          </button>
        </div>
      </div>

      <ParticipantSection registration={registration} />
      <DocumentsSection registration={registration} minor={minor} />
      <EmergencySection registration={registration} />
    </div>
  );
}

function ParticipantSection({ registration }: { registration: Registration }) {
  const { runner } = registration;
  return (
    <section className="registration-section">
      <h3>Participant</h3>
      <dl className="profile-details">
        <div><dt>Nom</dt><dd>{runner.lastName || "—"}</dd></div>
        <div><dt>Prénom</dt><dd>{runner.firstName || "—"}</dd></div>
        {registration.status === INSCRIPTION_STATUS.VALIDATED && (
          <>
            <div><dt>Numéro de dossard</dt><dd>{registration.numDossard?.trim() || "—"}</dd></div>
            <div><dt>Catégorie</dt><dd>{runner.category?.trim() || "—"}</dd></div>
          </>
        )}
        <div>
          <dt>Date de naissance</dt>
          <dd>{formatBirthDate(runner.birthDate)}</dd>
        </div>
        <div><dt>Genre</dt><dd>{runner.gender || "—"}</dd></div>
        <div><dt>Taille t-shirt</dt><dd>{runner.tshirtSize || "—"}</dd></div>
        {needsPartnerTShirt(runner.race) && (
          <div>
            <dt>{partnerTShirtLabel(runner.race)}</dt>
            <dd>{runner.tshirtSizeBinome || "—"}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function DocumentsSection({
  registration,
  minor,
}: {
  registration: Registration;
  minor: boolean;
}) {
  const { runner } = registration;
  return (
    <section className="registration-section">
      <h3>Documents et frais</h3>
      <dl className="profile-details">
        <div>
          <dt>Pièce d’identité</dt>
          <dd><DocumentValue url={runner.identityDocument} /></dd>
        </div>
        <div>
          <dt>Certificat médical</dt>
          <dd><DocumentValue url={runner.medicalCertificate} /></dd>
        </div>
        {minor && (
          <div>
            <dt>Autorisation parentale</dt>
            <dd><DocumentValue url={runner.parentalAuthorization} /></dd>
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
  );
}

function EmergencySection({ registration }: { registration: Registration }) {
  const { runner } = registration;
  return (
    <section className="registration-section">
      <h3>Contact d’urgence</h3>
      <dl className="profile-details">
        <div><dt>Nom</dt><dd>{runner.emergencyContactName || "—"}</dd></div>
        <div><dt>Contact</dt><dd>{runner.emergencyContactPhone || "—"}</dd></div>
      </dl>
    </section>
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
