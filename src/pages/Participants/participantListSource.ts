import { ROLE_ADMIN, ROLE_ORGANIZER } from "@/lib/auth";

export type ParticipantListSource = "INSCRIPTION" | "PARTICIPANT";

export const PARTICIPANT_LIST_SOURCES: ReadonlyArray<{
  value: ParticipantListSource;
  label: string;
}> = [
  { value: "INSCRIPTION", label: "Inscription" },
  { value: "PARTICIPANT", label: "Participant" },
];

export const DEFAULT_STATUT_BY_SOURCE: Record<ParticipantListSource, string> = {
  INSCRIPTION: "Attente validation",
  PARTICIPANT: "Inscrit",
};

export function defaultListSourceForRole(role: number | undefined): ParticipantListSource {
  if (role === ROLE_ADMIN) return "INSCRIPTION";
  if (role === ROLE_ORGANIZER) return "PARTICIPANT";
  return "PARTICIPANT";
}

export function defaultStatutForRole(role: number | undefined): string {
  return DEFAULT_STATUT_BY_SOURCE[defaultListSourceForRole(role)];
}

export function statutScopeParam(source: ParticipantListSource): "inscription" | "participant" {
  return source === "INSCRIPTION" ? "inscription" : "participant";
}
