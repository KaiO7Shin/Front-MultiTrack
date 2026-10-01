import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  changeParticipantStatus,
  fetchParticipantById,
} from "@/services/participants";
import { fetchParticipantStatutLogs } from "@/services/statutLogs";
import type {
  ParticipantProjection,
  ParticipantStatus,
} from "@/lib/type";
import { formatParticipantName } from "@/lib/utils";
import { ROLE_ADMIN, useAuth } from "@/lib/auth";
import { Alert, Spinner } from "@/components/ui/feedback";
import {
  statusBadgeClass,
  statusLabel,
} from "@/pages/Participants/participantStatus";
import { ParticipantStatusModal } from "./ParticipantStatusModal";
import {
  StatutHistoryButton,
  StatutHistoryModal,
} from "./StatutHistoryModal";
import { DetailRow, formatBirthDate } from "./detailShared";
import {
  AccountContactSection,
  EmergencyAndDocumentsSection,
} from "./PersonDetailSections";

export function ParticipantDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === ROLE_ADMIN;

  const [participant, setParticipant] = useState<ParticipantProjection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [statusOpen, setStatusOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const loadHistory = useCallback(() => {
    const numericId = Number(id);
    return fetchParticipantStatutLogs(numericId);
  }, [id]);

  useEffect(() => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      setError("Identifiant participant invalide.");
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    fetchParticipantById(numericId)
      .then((row) => {
        if (!mounted) return;
        if (!row) {
          setError("Participant introuvable.");
          setParticipant(null);
          return;
        }
        setParticipant(row);
        setError(null);
      })
      .catch(() => {
        if (!mounted) return;
        setError("Impossible de charger le participant.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  const confirmStatus = async (newStatus: ParticipantStatus) => {
    if (!participant) return;
    setStatusSaving(true);
    setStatusError(null);
    try {
      await changeParticipantStatus(participant.numDossard, newStatus);
      const updated = await fetchParticipantById(participant.id);
      if (updated) setParticipant(updated);
      setSuccess(`Statut mis à jour : ${statusLabel(newStatus)}.`);
      setStatusOpen(false);
    } catch {
      setStatusError("Erreur lors du changement de statut. Réessayez.");
    } finally {
      setStatusSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="page-section">
        <div className="flex items-center gap-2 text-slate-500 p-6">
          <Spinner className="text-brand" />
          <span className="text-sm">Chargement du dossier…</span>
        </div>
      </section>
    );
  }

  if (error || !participant) {
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
          {error ?? "Participant introuvable."}
        </Alert>
      </section>
    );
  }

  const fullName = formatParticipantName(participant.prenom, participant.nom);

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Dossier participant #{participant.id}
          </p>
          <h1 className="page-title">{fullName}</h1>
          <p className="page-subtitle">
            {participant.courseLibelle || participant.nomCourse || "Course non renseignée"}
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
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusBadgeClass(participant.statut)}`}
          >
            {statusLabel(participant.statut)}
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
            Participant
          </h2>
          <dl>
            <DetailRow label="Nom">{participant.nom || "—"}</DetailRow>
            <DetailRow label="Prénom">{participant.prenom || "—"}</DetailRow>
            <DetailRow label="Date de naissance">
              {formatBirthDate(participant.dateNaissance)}
            </DetailRow>
            <DetailRow label="Genre">{participant.genre || "—"}</DetailRow>
            <DetailRow label="Taille t-shirt">
              {participant.tailleTShirt || "—"}
            </DetailRow>
          </dl>
        </section>

        <section className="bg-white border rounded-2xl p-4 sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand mb-2">
            Course et inscription
          </h2>
          <dl>
            <DetailRow label="Course">
              {participant.courseLibelle || participant.nomCourse || "—"}
            </DetailRow>
            <DetailRow label="Dossard">{participant.numDossard || "—"}</DetailRow>
            <DetailRow label="Catégorie">
              {participant.aliasCategorie || "—"}
            </DetailRow>
            <DetailRow label="Statut">{statusLabel(participant.statut)}</DetailRow>
          </dl>

          {isAdmin && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => {
                  setStatusError(null);
                  setSuccess(null);
                  setStatusOpen(true);
                }}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Modifier le statut
              </button>
            </div>
          )}
        </section>

        <AccountContactSection data={participant} />

        <EmergencyAndDocumentsSection
          data={{
            nomContactUrgence: participant.nomContactUrgence,
            telephoneContactUrgence: participant.telephoneContactUrgence,
            hasPieceIdentite: Boolean(participant.hasPieceIdentite),
            hasCertificatMedical: Boolean(participant.hasCertificatMedical),
            hasAutorisationParentale: Boolean(participant.hasAutorisationParentale),
            pieceIdentiteUrl: participant.pieceIdentiteUrl,
            certificatMedicalUrl: participant.certificatMedicalUrl,
            autorisationParentaleUrl: participant.autorisationParentaleUrl,
          }}
        />
      </div>

      <div className="flex justify-start">
        <StatutHistoryButton onClick={() => setHistoryOpen(true)} />
      </div>

      {isAdmin && (
        <ParticipantStatusModal
          participant={
            statusOpen
              ? {
                  numDossard: participant.numDossard,
                  nom: participant.nom,
                  prenom: participant.prenom,
                  statut: participant.statut,
                }
              : null
          }
          saving={statusSaving}
          error={statusError}
          onClose={() => {
            if (statusSaving) return;
            setStatusOpen(false);
            setStatusError(null);
          }}
          onConfirm={confirmStatus}
        />
      )}

      <StatutHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        load={loadHistory}
      />
    </section>
  );
}
