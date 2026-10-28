export const INSCRIPTION_STATUTS = [
  "Envoyée",
  "Attente validation",
  "Validée",
  "Refusée",
] as const;

export type InscriptionStatut = (typeof INSCRIPTION_STATUTS)[number];

export const PARTICIPANT_STATUTS = [
  "Inscrit",
  "Présent",
  "En course",
  "Finisher",
  "DNS",
  "DNF",
  "DSQ",
] as const;

export type ParticipantStatut = (typeof PARTICIPANT_STATUTS)[number];

/** Ordre d’affichage du tableau de suivi. */
export const FOLLOW_UP_STATUTS = ["DNF", "DSQ", "DNS"] as const;

export type FollowUpStatut = (typeof FOLLOW_UP_STATUTS)[number];

export const DASHBOARD_PERIODS = [
  { value: "all", label: "Toute la période" },
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
] as const;

export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number]["value"];

export type DashboardCourse = {
  id: number;
  name: string;
};

export type DashboardFilters = {
  courseId: number | "all";
  period: DashboardPeriod;
  inscriptionStatut: InscriptionStatut | "all";
  participantStatut: ParticipantStatut | "all";
};

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilters = {
  courseId: "all",
  period: "all",
  inscriptionStatut: "all",
  participantStatut: "all",
};

export type TrendPoint = {
  date: string;
  label: string;
  count: number;
};

export type PopularityRow = {
  courseId: number;
  course: string;
  count: number;
};

export type TrackingRow = {
  courseId: number;
  course: string;
  finishers: number;
  enCourse: number;
  dnf: number;
};

export const DASHBOARD_MONTHS = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Février" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Août" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Décembre" },
] as const;

export const FOLLOW_UP_PAGE_SIZES = [10, 20, 50, 100] as const;

export type FollowUpPageSize = (typeof FOLLOW_UP_PAGE_SIZES)[number] | "all";

export type FollowUpRow = {
  id: number;
  fullName: string;
  course: string;
  statut: FollowUpStatut;
};

export type DashboardKpis = {
  total: number;
  validated: number;
  pending: number;
  participantCount: number;
  inscrits: number;
  presents: number;
  dns: number;
};

export type DashboardView = {
  kpis: DashboardKpis;
  trend: TrendPoint[];
  popularity: PopularityRow[];
  tracking: TrackingRow[];
  trackingTotals: {
    finishers: number;
    enCourse: number;
    dnf: number;
  };
  followUp: FollowUpRow[];
};
