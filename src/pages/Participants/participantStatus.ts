import type { ParticipantStatus } from "@/lib/type";

export const PARTICIPANT_STATUSES: readonly ParticipantStatus[] = [
  "Envoyée",
  "Attente validation",
  "Validée",
  "Refusée",
  "Inscrit",
  "Présent",
  "En course",
  "Finisher",
  "DNS",
  "DNF",
  "DSQ",
] as const;

/** Libellés UI — valeurs API inchangées. */
export const PARTICIPANT_STATUS_LABELS: Record<ParticipantStatus, string> = {
  Envoyée: "Envoyée",
  "Attente validation": "Attente validation",
  Validée: "Validée",
  Refusée: "Refusée",
  Inscrit: "Inscrit",
  Present: "Présent",
  Présent: "Présent",
  "En course": "En course",
  Finisher: "Finisher",
  DNS: "DNS",
  DNF: "DNF",
  DSQ: "DSQ",
};

export const INSCRIPTION_PENDING_STATUS: ParticipantStatus = "Attente validation";

export function statusLabel(statut: ParticipantStatus | string | null | undefined) {
  if (!statut) return "—";
  return PARTICIPANT_STATUS_LABELS[statut as ParticipantStatus] ?? statut;
}

export function statusBadgeClass(statut: ParticipantStatus | string) {
  switch (statut) {
    case "Envoyée":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "Attente validation":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Validée":
      return "bg-green-100 text-green-700 border-green-200";
    case "Refusée":
      return "bg-red-100 text-red-700 border-red-200";
    case "Inscrit":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "Present":
    case "Présent":
      return "bg-green-100 text-green-700 border-green-200";
    case "En course":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "DNF":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "DNS":
      return "bg-red-100 text-red-700 border-red-200";
    case "DSQ":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "Finisher":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "A venir":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "En cours":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Terminée":
    case "Terminee":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}
