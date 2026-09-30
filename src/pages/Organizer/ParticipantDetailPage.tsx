import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchParticipantById } from "@/services/participants";
import type { ParticipantProjection } from "@/lib/type";
import { formatParticipantName } from "@/lib/utils";
import { Alert, Spinner } from "@/components/ui/feedback";
import {
  statusBadgeClass,
  statusLabel,
} from "@/pages/Participants/participantStatus";

function formatBirthDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR");
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[11rem_1fr] gap-1 sm:gap-3 py-2.5 border-b border-border last:border-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

export function ParticipantDetailPage() {
  const { id } = useParams();
  const [participant, setParticipant] = useState<ParticipantProjection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Dossier participant #{participant.id}
          </p>
          <h1 className="page-title">
            {formatParticipantName(participant.prenom, participant.nom)}
          </h1>
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
            <DetailRow label="Type de vélo">
              {participant.typeVelo || "—"}
            </DetailRow>
          </dl>
        </section>

        <section className="bg-white border rounded-2xl p-4 sm:p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand mb-2">
            Documents et contact
          </h2>
          <dl>
            <DetailRow label="Pièce d’identité">Non fourni</DetailRow>
            <DetailRow label="Certificat médical">Non fourni</DetailRow>
            <DetailRow label="Autorisation parentale">Non fourni</DetailRow>
            <DetailRow label="Contact d’urgence — nom">—</DetailRow>
            <DetailRow label="Contact d’urgence — téléphone">—</DetailRow>
          </dl>
        </section>
      </div>
    </section>
  );
}
