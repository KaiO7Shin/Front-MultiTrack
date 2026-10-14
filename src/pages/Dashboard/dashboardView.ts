import {
  DEFAULT_DASHBOARD_FILTERS,
  type DashboardFilters,
} from "./dashboardTypes";

export type TrendMonth = {
  year: number;
  month: number;
};

export function currentTrendMonth(): TrendMonth {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function formatCount(value: number) {
  return value.toLocaleString("fr-FR");
}

export function formatDashboardDate(iso: string, style: "short" | "long" = "short") {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (style === "long") {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function filtersAreDefault(filters: DashboardFilters) {
  return (
    filters.courseId === DEFAULT_DASHBOARD_FILTERS.courseId &&
    filters.period === DEFAULT_DASHBOARD_FILTERS.period &&
    filters.inscriptionStatut === DEFAULT_DASHBOARD_FILTERS.inscriptionStatut &&
    filters.participantStatut === DEFAULT_DASHBOARD_FILTERS.participantStatut
  );
}
