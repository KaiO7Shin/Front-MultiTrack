import type { ParticipantStatus } from "@/lib/type";

export const PARTICIPANT_STATUSES: readonly ParticipantStatus[] = [
  "Inscrit",
  "Present",
  "En course",
  "Finisher",
  "DNS",
  "DNF",
  "DSQ",
] as const;

/** Libellés UI (Présent avec accent) — valeurs API inchangées. */
export const PARTICIPANT_STATUS_LABELS: Record<ParticipantStatus, string> = {
  Inscrit: "Inscrit",
  Present: "Présent",
  "En course": "En course",
  Finisher: "Finisher",
  DNS: "DNS",
  DNF: "DNF",
  DSQ: "DSQ",
};

export function statusLabel(statut: ParticipantStatus | string | null | undefined) {
  if (!statut) return "—";
  return PARTICIPANT_STATUS_LABELS[statut as ParticipantStatus] ?? statut;
}

export function statusBadgeClass(statut: ParticipantStatus) {
  switch (statut) {
    case "Present":
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
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}
