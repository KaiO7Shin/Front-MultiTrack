import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import type { RenderResponse } from "@/lib/type";
import { formatDashboardDate, type TrendMonth } from "@/pages/Dashboard/dashboardView";
import type {
  DashboardCourse,
  DashboardFilters,
  DashboardView,
  FollowUpRow,
  PopularityRow,
  TrackingRow,
} from "@/pages/Dashboard/dashboardTypes";

type DashboardApiData = {
  courses: DashboardCourse[];
  years: number[];
  kpis: DashboardView["kpis"];
  trend: { date: string; count: number }[];
  popularity: PopularityRow[];
  tracking: TrackingRow[];
  trackingTotals: DashboardView["trackingTotals"];
  followUp: FollowUpRow[];
};

export type DashboardData = {
  courses: DashboardCourse[];
  years: number[];
  view: DashboardView;
};

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: { message?: string; error?: string } } })
      .response?.data;
    const message = data?.message?.trim();
    if (message && message !== "Erreur interne") return message;
  }
  if (err instanceof Error && err.message.trim() && !("response" in err)) {
    return err.message;
  }
  return fallback;
}

export async function fetchDashboard(
  filters: DashboardFilters,
  trendMonth: TrendMonth
): Promise<DashboardData> {
  const params: Record<string, string | number> = {
    period: filters.period,
    year: trendMonth.year,
    month: trendMonth.month,
  };
  if (filters.courseId !== "all") params.courseId = filters.courseId;
  if (filters.inscriptionStatut !== "all") {
    params.inscriptionStatut = filters.inscriptionStatut;
  }
  if (filters.participantStatut !== "all") {
    params.participantStatut = filters.participantStatut;
  }

  try {
    const { data } = await api.get<RenderResponse<DashboardApiData>>(API.dashboard, {
      params,
    });
    if (!data.data) {
      throw new Error("Impossible de charger le tableau de bord.");
    }
    const payload = data.data;
    return {
      courses: payload.courses ?? [],
      years: payload.years ?? [],
      view: {
        kpis: payload.kpis,
        popularity: payload.popularity ?? [],
        tracking: (payload.tracking ?? []).map((row) => ({
          ...row,
          finishers: row.finishers ?? 0,
          enCourse: row.enCourse ?? 0,
          dnf: row.dnf ?? 0,
        })),
        trackingTotals: {
          finishers: payload.trackingTotals?.finishers ?? 0,
          enCourse: payload.trackingTotals?.enCourse ?? 0,
          dnf: payload.trackingTotals?.dnf ?? 0,
        },
        followUp: payload.followUp ?? [],
        trend: (payload.trend ?? []).map((point) => ({
          date: point.date,
          count: point.count,
          label: formatDashboardDate(point.date),
        })),
      },
    };
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Impossible de charger le tableau de bord."));
  }
}
