import { RefreshCw } from "lucide-react";
import { FormField, selectClassName } from "@/components/ui/form-field";
import { filtersAreDefault } from "./dashboardView";
import {
  DASHBOARD_PERIODS,
  DEFAULT_DASHBOARD_FILTERS,
  INSCRIPTION_STATUTS,
  PARTICIPANT_STATUTS,
  type DashboardCourse,
  type DashboardFilters,
  type DashboardPeriod,
  type InscriptionStatut,
  type ParticipantStatut,
} from "./dashboardTypes";

type DashboardFiltersBarProps = {
  filters: DashboardFilters;
  courses: DashboardCourse[];
  refreshing: boolean;
  onChange: (filters: DashboardFilters) => void;
  onRefresh: () => void;
};

export function DashboardFiltersBar({
  filters,
  courses,
  refreshing,
  onChange,
  onRefresh,
}: DashboardFiltersBarProps) {
  const resetDisabled = filtersAreDefault(filters);

  return (
    <div className="filter-panel">
      <div className="filter-fields">
        <FormField label="Course" htmlFor="dashboard-course">
          <select
            id="dashboard-course"
            className={selectClassName}
            value={String(filters.courseId)}
            onChange={(event) =>
              onChange({
                ...filters,
                courseId:
                  event.target.value === "all" ? "all" : Number(event.target.value),
              })
            }
          >
            <option value="all">Toutes les courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Période"
          htmlFor="dashboard-period"
          hint="Jusqu’à aujourd’hui"
        >
          <select
            id="dashboard-period"
            className={selectClassName}
            value={filters.period}
            onChange={(event) =>
              onChange({
                ...filters,
                period: event.target.value as DashboardPeriod,
              })
            }
          >
            {DASHBOARD_PERIODS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Statut d’inscription" htmlFor="dashboard-inscription-status">
          <select
            id="dashboard-inscription-status"
            className={selectClassName}
            value={filters.inscriptionStatut}
            onChange={(event) =>
              onChange({
                ...filters,
                inscriptionStatut: event.target.value as InscriptionStatut | "all",
              })
            }
          >
            <option value="all">Tous les statuts</option>
            {INSCRIPTION_STATUTS.map((statut) => (
              <option key={statut} value={statut}>
                {statut}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Statut du participant" htmlFor="dashboard-participant-status">
          <select
            id="dashboard-participant-status"
            className={selectClassName}
            value={filters.participantStatut}
            onChange={(event) =>
              onChange({
                ...filters,
                participantStatut: event.target.value as ParticipantStatut | "all",
              })
            }
          >
            <option value="all">Tous les statuts</option>
            {PARTICIPANT_STATUTS.map((statut) => (
              <option key={statut} value={statut}>
                {statut}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-muted-foreground">
          La période affine les indicateurs et la popularité. Le mois et l’année
          affinent l’évolution. Les statuts affinent le graphique ou le tableau
          qui leur correspond.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="btn-secondary text-sm disabled:opacity-40"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
            Actualiser
          </button>
          <button
            type="button"
            className="btn-secondary text-sm"
            disabled={resetDisabled}
            onClick={() => onChange(DEFAULT_DASHBOARD_FILTERS)}
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
}
