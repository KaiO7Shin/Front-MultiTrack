import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { Alert } from "@/components/ui/feedback";
import { FormField, selectClassName } from "@/components/ui/form-field";
import { fetchCategoriesDetailed } from "@/services/categories";
import { fetchCourses } from "@/services/courses";
import { fetchClassement, type ClassementLigne } from "@/services/classement";
import { ClassementExportMenu } from "./ClassementExportMenu";
import { ClassementTable } from "./ClassementTable";
import { exportClassementGeneral, exportClassementPodium } from "./classementPdf";
import {
  filterClassement,
  rankingCategories,
  type ClassementCategorie,
} from "./classementView";

export function LeaderboardPage() {
  const [courses, setCourses] = useState<{ id: number; label: string }[]>([]);
  const [courseId, setCourseId] = useState("");
  const [genre, setGenre] = useState("all");
  const [categorieId, setCategorieId] = useState("all");
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<ClassementCategorie[]>([]);
  const [rows, setRows] = useState<ClassementLigne[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCourses()
      .then((data) => {
        if (!cancelled) setCourses(data);
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger les courses.");
      })
      .finally(() => {
        if (!cancelled) setLoadingCourses(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchCategoriesDetailed()
      .then((data) => {
        if (!cancelled) setCategories(rankingCategories(data));
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger les catégories.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadClassement = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchClassement(id));
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "Impossible de charger le classement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!courseId) {
      setRows([]);
      return;
    }
    void loadClassement(Number(courseId));
  }, [courseId, loadClassement]);

  const courseLabel = courses.find((course) => String(course.id) === courseId)?.label ?? "";
  const filtered = useMemo(
    () => filterClassement(rows, genre, categorieId, query),
    [rows, genre, categorieId, query]
  );
  const ready = Boolean(courseId) && !loading;

  function changeCourse(next: string) {
    setCourseId(next);
    setGenre("all");
    setCategorieId("all");
    setQuery("");
    setError(null);
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Résultats</h1>
          <p className="page-subtitle">Classement de la compétition.</p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn-secondary"
            disabled={!ready}
            onClick={() => {
              if (courseId) void loadClassement(Number(courseId));
            }}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
            Rafraîchir
          </button>
          <ClassementExportMenu
            disabled={!ready || rows.length === 0}
            onGeneral={() => exportClassementGeneral(rows, courseLabel)}
            onPodium={() => exportClassementPodium(rows, courseLabel, categories)}
          />
        </div>
      </div>

      {error && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}

      <div className="filter-panel">
        <div className="relative w-full">
          <label htmlFor="classement-search" className="sr-only">
            Rechercher
          </label>
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="classement-search"
            type="text"
            placeholder="Id, dossard, nom ou prénom…"
            value={query}
            disabled={!ready}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-lg border py-2 pl-8 pr-3 text-sm focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
        <div className="filter-fields">
          <FormField label="Course" htmlFor="classement-course">
            <select
              id="classement-course"
              className={selectClassName}
              value={courseId}
              disabled={loadingCourses}
              onChange={(event) => changeCourse(event.target.value)}
            >
              <option value="">Choisir une course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Genre" htmlFor="classement-genre">
            <select
              id="classement-genre"
              className={selectClassName}
              value={genre}
              disabled={!ready}
              onChange={(event) => setGenre(event.target.value)}
            >
              <option value="all">Tous genres</option>
              <option value="Homme">Homme</option>
              <option value="Femme">Femme</option>
            </select>
          </FormField>
          <FormField label="Catégorie" htmlFor="classement-categorie">
            <select
              id="classement-categorie"
              className={selectClassName}
              value={categorieId}
              disabled={!ready}
              onChange={(event) => setCategorieId(event.target.value)}
            >
              <option value="all">Toutes catégories</option>
              {categories.map((categorie) => (
                <option key={categorie.id} value={categorie.id}>
                  {categorie.alias}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      {!courseId ? (
        <div className="page-card p-8 text-center text-sm text-muted-foreground">
          Choisissez une course pour afficher le classement.
        </div>
      ) : loading ? (
        <div className="page-card p-8 text-center text-sm text-muted-foreground">
          Chargement du classement…
        </div>
      ) : (
        <ClassementTable rows={filtered} />
      )}
    </section>
  );
}
