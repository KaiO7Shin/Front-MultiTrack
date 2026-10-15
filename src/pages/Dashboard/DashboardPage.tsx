import { useEffect, useRef, useState } from "react";
import { Alert, PageLoading } from "@/components/ui/feedback";
import { fetchDashboard } from "@/services/dashboard";
import { DashboardFiltersBar } from "./DashboardFiltersBar";
import { DashboardKpiGrid } from "./DashboardKpiGrid";
import { CoursePopularityChart } from "./CoursePopularityChart";
import { CourseTrackingChart } from "./CourseTrackingChart";
import { FollowUpTable } from "./FollowUpTable";
import { RegistrationsTrendChart } from "./RegistrationsTrendChart";
import { currentTrendMonth } from "./dashboardView";
import {
  DEFAULT_DASHBOARD_FILTERS,
  type DashboardCourse,
  type DashboardFilters,
  type DashboardView,
} from "./dashboardTypes";

export const DashboardPage = () => {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_DASHBOARD_FILTERS);
  const [trendMonth, setTrendMonth] = useState(currentTrendMonth);
  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [view, setView] = useState<DashboardView | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const hasView = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (!hasView.current) setLoading(true);
    else setRefreshing(true);

    fetchDashboard(filters, trendMonth)
      .then((data) => {
        if (cancelled) return;
        setCourses(data.courses);
        setYears(data.years.includes(trendMonth.year) ? data.years : [trendMonth.year, ...data.years]);
        setView(data.view);
        hasView.current = true;
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Impossible de charger le tableau de bord.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters, trendMonth, refreshTick]);

  const seriesName =
    filters.inscriptionStatut === "all"
      ? "Nouvelles inscriptions"
      : filters.inscriptionStatut;

  if (loading && !view) {
    return <PageLoading message="Chargement du tableau de bord…" />;
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">Pilotage des inscriptions et suivi des courses.</p>
        </div>
      </div>

      {error && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}

      <DashboardFiltersBar
        filters={filters}
        courses={courses}
        refreshing={refreshing}
        onChange={setFilters}
        onRefresh={() => setRefreshTick((tick) => tick + 1)}
      />

      {view && (
        <>
          <p className="sr-only" aria-live="polite">
            {view.kpis.participantCount.toLocaleString("fr-FR")} inscriptions
            totales, {view.kpis.total.toLocaleString("fr-FR")} inscriptions en
            ligne,{" "}
            {view.followUp.length.toLocaleString("fr-FR")} participants à suivre.
          </p>
          <DashboardKpiGrid kpis={view.kpis} />

          <div className="grid gap-4 xl:grid-cols-2">
            <RegistrationsTrendChart
              points={view.trend}
              seriesName={seriesName}
              trendMonth={trendMonth}
              years={years}
              onTrendMonthChange={setTrendMonth}
            />
            <CoursePopularityChart rows={view.popularity} />
          </div>

          <CourseTrackingChart rows={view.tracking} totals={view.trackingTotals} />
          <FollowUpTable
            rows={view.followUp}
            participantStatut={filters.participantStatut}
          />
        </>
      )}
    </section>
  );
};
