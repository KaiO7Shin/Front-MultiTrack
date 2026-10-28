import { useEffect, useState } from "react";
import { Alert, PageLoading } from "@/components/ui/feedback";
import { fetchDashboard } from "@/services/dashboard";
import { DashboardKpiGrid } from "./DashboardKpiGrid";
import { CoursePopularityChart } from "./CoursePopularityChart";
import { CourseTrackingChart } from "./CourseTrackingChart";
// Pack essential : filtres, courbe d'inscriptions et tableau de suivi commentés.
// import { DashboardFiltersBar } from "./DashboardFiltersBar";
// import { FollowUpTable } from "./FollowUpTable";
// import { RegistrationsTrendChart } from "./RegistrationsTrendChart";
import { currentTrendMonth } from "./dashboardView";
import {
  DEFAULT_DASHBOARD_FILTERS,
  type DashboardView,
} from "./dashboardTypes";

export const DashboardPage = () => {
  const [view, setView] = useState<DashboardView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDashboard(DEFAULT_DASHBOARD_FILTERS, currentTrendMonth())
      .then((data) => {
        if (cancelled) return;
        setView(data.view);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Impossible de charger le tableau de bord.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !view) {
    return <PageLoading message="Chargement du tableau de bord…" />;
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">Participants et suivi des courses.</p>
        </div>
      </div>

      {error && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}

      {view && (
        <>
          <p className="sr-only" aria-live="polite">
            {view.kpis.inscrits.toLocaleString("fr-FR")} participants inscrits,{" "}
            {view.kpis.presents.toLocaleString("fr-FR")} présents,{" "}
            {view.kpis.dns.toLocaleString("fr-FR")} DNS.
          </p>
          <DashboardKpiGrid kpis={view.kpis} />
          <CoursePopularityChart rows={view.popularity} />
          <CourseTrackingChart rows={view.tracking} totals={view.trackingTotals} />
        </>
      )}
    </section>
  );
};
