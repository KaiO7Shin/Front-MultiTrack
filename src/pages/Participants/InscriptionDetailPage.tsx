import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  fetchInscriptionById,
  reviewInscription,
} from "@/services/inscriptions";
import { fetchInscriptionStatutLogs } from "@/services/statutLogs";
import type {
  InscriptionDetail,
  InscriptionReviewDecision,
} from "@/lib/type";
import { needsPartnerTShirt, partnerTShirtLabel } from "@/lib/duoCourses";
import { formatParticipantName } from "@/lib/utils";
import { ROLE_ADMIN, useAuth } from "@/lib/auth";
import { Alert, Spinner } from "@/components/ui/feedback";
import {
  INSCRIPTION_PENDING_STATUS,
  statusBadgeClass,
  statusLabel,
} from "@/pages/Participants/participantStatus";
import { InscriptionReviewModal } from "./InscriptionReviewModal";
import {
  StatutHistoryButton,
  StatutHistoryModal,
} from "./StatutHistoryModal";
import {
  DetailRow,
  formatBirthDate,
  formatMoney,
  formatPhone,
} from "./detailShared";
import { EmergencyAndDocumentsSection } from "./PersonDetailSections";

export function InscriptionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === ROLE_ADMIN;

  const [inscription, setInscription] = useState<InscriptionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [reviewDecision, setReviewDecision] =
    useState<InscriptionReviewDecision | null>(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const loadHistory = useCallback(() => {
    const numericId = Number(id);
    return fetchInscriptionStatutLogs(numericId);
  }, [id]);

  const load = async (numericId: number) => {
    const row = await fetchInscriptionById(numericId);
    setInscription(row);
    setError(null);
  };

  useEffect(() => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      setError("Identifiant inscription invalide.");
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    load(numericId)
      .catch((err: unknown) => {
        if (!mounted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger l’inscription."
        );
        setInscription(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  const openReview = (decision: InscriptionReviewDecision) => {
    setReviewError(null);
    setSuccess(null);
    setReviewDecision(decision);
  };

  const closeReview = () => {
    if (reviewSaving) return;
    setReviewDecision(null);
    setReviewError(null);
  };

  const confirmReview = async (commentaire: string) => {
    if (!inscription || !reviewDecision) return;
    setReviewSaving(true);
    setReviewError(null);
    try {
      const res = await reviewInscription(
        inscription.id,
        reviewDecision,
        commentaire
      );
      await load(inscription.id);
      const bib = res.data?.numDossard;
      setSuccess(
        bib
          ? `${res.message || "Inscription validée."} Dossard attribué : ${bib}.`
          : res.message || "Inscription mise à jour."
      );
      setReviewDecision(null);
    } catch (err: unknown) {
      setReviewError(
        err instanceof Error
          ? err.message
          : "Impossible de traiter l’inscription."
      );
    } finally {
      setReviewSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="page-section">
        <div className="flex items-center gap-2 text-slate-500 p-6">
          <Spinner className="text-brand" />
          <span className="text-sm">Chargement de l’inscription…</span>
        </div>
      </section>
    );
  }

  if (error || !inscription) {
    return (
      <section className="page-section">
        <Link
          to="/participants"
          className="inline-flex items-center mb-3 hover:opacity-80"
          aria-label="Retour"
        >
          <img src="/bouton-retour.svg" alt="" className="h-8 w-8" aria-hidden />
        </Link>
        <Alert variant="error" role="alert">
          {error ?? "Inscription introuvable."}
        </Alert>
      </section>
    );
  }

  const canReview =
    isAdmin && inscription.statut === INSCRIPTION_PENDING_STATUS;
  const fullName = formatParticipantName(inscription.prenom, inscription.nom);

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Inscription #{inscription.id}
          </p>
          <h1 className="page-title">{fullName}</h1>
          <p className="page-subtitle">
            {inscription.courseLibelle || "Course non renseignée"}
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
          <Link
            to="/participants"
            className="inline-flex items-center hover:opacity-80"
            aria-label="Retour"
          >
            <img src="/bouton-retour.svg" alt="" className="h-8 w-8" aria-hidden />
          </Link>
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusBadgeClass(inscription.statut)}`}
          >
            {statusLabel(inscription.statut)}
          </span>
        </div>
      </div>

      {success && (
        <Alert variant="success" role="status">
          {success}
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="bg-white border rounded-2xl p-4 sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand mb-2">
            Identité
          </h2>
          <dl>
            <DetailRow label="Nom">{inscription.nom || "—"}</DetailRow>
            <DetailRow label="Prénom">{inscription.prenom || "—"}</DetailRow>
            <DetailRow label="Date de naissance">
              {formatBirthDate(inscription.dateNaissance)}
            </DetailRow>
            <DetailRow label="Genre">{inscription.genre || "—"}</DetailRow>
            <DetailRow label="Taille t-shirt">
              {inscription.tailleTShirt || "—"}
            </DetailRow>
            {needsPartnerTShirt(inscription.courseLibelle) && (
              <DetailRow label={partnerTShirtLabel(inscription.courseLibelle)}>
                {inscription.tailleTShirtBinome || "—"}
              </DetailRow>
            )}
          </dl>
        </section>

        <section className="bg-white border rounded-2xl p-4 sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand mb-2">
            Course et statut
          </h2>
          <dl>
            <DetailRow label="Course">
              {inscription.courseLibelle || "—"}
            </DetailRow>
            <DetailRow label="Statut">
              {statusLabel(inscription.statut)}
            </DetailRow>
            {inscription.numDossard && (
              <DetailRow label="Dossard">{inscription.numDossard}</DetailRow>
            )}
            {inscription.participantId != null && (
              <DetailRow label="Participant">
                <button
                  type="button"
                  className="text-brand underline-offset-2 hover:underline"
                  onClick={() =>
                    navigate(`/participants/${inscription.participantId}`)
                  }
                >
                  Voir le participant #{inscription.participantId}
                </button>
              </DetailRow>
            )}
            {inscription.commentaire && (
              <DetailRow label="Commentaire">
                {inscription.commentaire}
              </DetailRow>
            )}
          </dl>

          {canReview && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => openReview("Validée")}
                className="rounded-xl bg-brand-cta px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Valider
              </button>
              <button
                type="button"
                onClick={() => openReview("Refusée")}
                className="rounded-xl border border-[#a72a1f]/35 bg-[#fff0ee] px-4 py-2 text-sm font-medium text-[#a72a1f] hover:bg-[#fde8e4]"
              >
                Refuser
              </button>
            </div>
          )}
        </section>

        <section className="bg-white border rounded-2xl p-4 sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand mb-2">
            Compte et paiement
          </h2>
          <dl>
            <DetailRow label="Adresse email">
              {inscription.email || "—"}
            </DetailRow>
            <DetailRow label="Téléphone">
              {formatPhone(inscription.contact)}
            </DetailRow>
            <DetailRow label="Moyen de paiement">
              {inscription.moyenPaiement || "—"}
            </DetailRow>
            <DetailRow label="Référence">
              {inscription.referencePaiement || "—"}
            </DetailRow>
            <DetailRow label="Montant">
              {formatMoney(inscription.montant)}
            </DetailRow>
          </dl>
        </section>

        <EmergencyAndDocumentsSection data={inscription} />
      </div>

      <div className="flex justify-start">
        <StatutHistoryButton onClick={() => setHistoryOpen(true)} />
      </div>

      <InscriptionReviewModal
        open={reviewDecision !== null}
        decision={reviewDecision}
        participantName={fullName}
        saving={reviewSaving}
        error={reviewError}
        onClose={closeReview}
        onConfirm={confirmReview}
      />

      <StatutHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        load={loadHistory}
      />
    </section>
  );
}
