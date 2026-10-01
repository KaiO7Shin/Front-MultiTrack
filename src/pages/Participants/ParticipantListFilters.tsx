import { Search } from "lucide-react";
import { FormField, selectClassName } from "@/components/ui/form-field";
import type { GenreOption } from "@/services/genres";
import type { StatutOption } from "@/services/statuts";
import {
  PARTICIPANT_LIST_SOURCES,
  type ParticipantListSource,
} from "./participantListSource";

type UICourse = { id: number; label: string };
type UICategory = { id: number; alias: string };

export type ParticipantListFiltersProps = {
  query: string;
  source: ParticipantListSource;
  selectedCourseId: number | "all";
  selectedCategoryId: number | "all";
  selectedGender: string;
  selectedStatus: string;
  courses: UICourse[];
  categories: UICategory[];
  genres: GenreOption[];
  statuts: StatutOption[];
  resultCount?: number;
  showCount?: boolean;
  onQueryChange: (value: string) => void;
  onSourceChange: (value: ParticipantListSource) => void;
  onCourseChange: (value: number | "all") => void;
  onCategoryChange: (value: number | "all") => void;
  onGenderChange: (value: string) => void;
  onStatusChange: (value: string) => void;
};

export function ParticipantListFilters({
  query,
  source,
  selectedCourseId,
  selectedCategoryId,
  selectedGender,
  selectedStatus,
  courses,
  categories,
  genres,
  statuts,
  resultCount,
  showCount = false,
  onQueryChange,
  onSourceChange,
  onCourseChange,
  onCategoryChange,
  onGenderChange,
  onStatusChange,
}: ParticipantListFiltersProps) {
  const isParticipantSource = source === "PARTICIPANT";

  return (
    <div className="filter-panel">
      <div className="relative w-full">
        <label htmlFor="participant-search" className="sr-only">
          Rechercher
        </label>
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          id="participant-search"
          type="text"
          placeholder="Id, dossard, nom ou prénom…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-brand/30"
        />
      </div>

      <div className="filter-fields">
        <FormField label="Type" htmlFor="filter-source">
          <select
            id="filter-source"
            className={selectClassName}
            value={source}
            onChange={(e) =>
              onSourceChange(e.target.value as ParticipantListSource)
            }
          >
            {PARTICIPANT_LIST_SOURCES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Course" htmlFor="filter-course">
          <select
            id="filter-course"
            className={selectClassName}
            value={String(selectedCourseId)}
            onChange={(e) =>
              onCourseChange(
                e.target.value === "all" ? "all" : Number(e.target.value)
              )
            }
          >
            <option value="all">Toutes les courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </FormField>

        {isParticipantSource && (
          <FormField label="Catégorie" htmlFor="filter-category">
            <select
              id="filter-category"
              className={selectClassName}
              value={String(selectedCategoryId)}
              onChange={(e) =>
                onCategoryChange(
                  e.target.value === "all" ? "all" : Number(e.target.value)
                )
              }
            >
              <option value="all">Toutes catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.alias}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <FormField label="Genre" htmlFor="filter-gender">
          <select
            id="filter-gender"
            className={selectClassName}
            value={selectedGender}
            onChange={(e) => onGenderChange(e.target.value)}
          >
            <option value="all">Tous genres</option>
            {genres.map((g) => (
              <option key={g.id} value={g.libelle}>
                {g.libelle}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Statut" htmlFor="filter-status">
          <select
            id="filter-status"
            className={selectClassName}
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {statuts.map((s) => (
              <option key={s.id} value={s.libelle}>
                {s.libelle}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {showCount && resultCount != null && (
        <p className="text-xs text-slate-500">
          {resultCount} résultat{resultCount > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
