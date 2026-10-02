import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/feedback";
import type { Category } from "@/lib/type";
import { fetchCategoriesDetailed } from "@/services/categories";
import { fetchCoursesDetailed } from "@/services/courses";
import {
  addEligibility,
  fetchEligibleCategoriesByCourse,
  removeEligibility,
  type CourseEligibleCategories,
} from "@/services/eligibility";

export function EligibilitesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [coursesMeta, setCoursesMeta] = useState<
    { id: number; name: string; type: string }[]
  >([]);
  const [eligibility, setEligibility] = useState<CourseEligibleCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, courses, elig] = await Promise.all([
        fetchCategoriesDetailed(),
        fetchCoursesDetailed(),
        fetchEligibleCategoriesByCourse(),
      ]);
      setCategories(cats);
      setCoursesMeta(
        courses.map((c) => ({ id: c.id, name: c.name, type: c.type }))
      );
      setEligibility(elig);
    } catch {
      setError("Impossible de charger les éligibilités.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const rows = useMemo(() => {
    return coursesMeta.map((course) => {
      const fromApi = eligibility.find(
        (e) =>
          e.course_id === course.id ||
          e.libelle_course === course.name
      );
      return {
        courseId: course.id,
        libelle: course.name,
        type: course.type,
        eligibility: fromApi ?? {
          course_id: course.id,
          libelle_course: course.name,
          nom_course: course.type,
          categories_eligibles: [],
        },
      };
    });
  }, [coursesMeta, eligibility]);

  async function toggle(courseId: number, category: Category, currentlyEligible: boolean) {
    const key = `${courseId}-${category.id}`;
    setBusyKey(key);
    setError(null);
    try {
      if (currentlyEligible) {
        await removeEligibility(courseId, category.id);
      } else {
        await addEligibility(courseId, category.id);
      }
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la mise à jour.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Éligibilités</h1>
          <p className="page-subtitle">
            Catégories éligibles par course — combinaison course + catégorie unique
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}

      <div className="bg-white border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Chargement des éligibilités…
          </div>
        ) : rows.length === 0 || categories.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Aucune course ou catégorie disponible.
          </div>
        ) : (
          <div className="table-scroll">
            <table className="eligibility-matrix min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600 sticky left-0 bg-slate-50 z-10">
                    Course
                  </th>
                  {categories.map((cat) => (
                    <th
                      key={cat.id}
                      className="px-2 py-3 text-center font-medium text-slate-600 whitespace-nowrap"
                      title={cat.alias}
                    >
                      {cat.alias}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.courseId} className="hover:bg-[#8c9962]/5">
                    <td className="px-4 py-3 sticky left-0 bg-white z-10">
                      <strong className="block">{row.libelle}</strong>
                      <span className="text-xs text-slate-500">{row.type}</span>
                    </td>
                    {categories.map((cat) => {
                      const eligibleById = row.eligibility.categories_eligibles.some(
                        (c) => c.categorie_id === cat.id
                      );
                      const eligibleByLibelle =
                        row.eligibility.categories_eligibles.some((c) => {
                          const lib = c.libelle_categorie.toLowerCase();
                          return (
                            (cat.libelle &&
                              lib === cat.libelle.toLowerCase()) ||
                            lib === cat.alias.toLowerCase() ||
                            lib.startsWith(cat.alias.toLowerCase() + " ")
                          );
                        });
                      const isOn = eligibleById || eligibleByLibelle;
                      const key = `${row.courseId}-${cat.id}`;
                      return (
                        <td key={cat.id} className="px-2 py-2 text-center">
                          <button
                            type="button"
                            disabled={busyKey === key}
                            onClick={() => toggle(row.courseId, cat, isOn)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-semibold ${
                              isOn
                                ? "border-[#8c9962] bg-[#8c9962]/15 text-[#5c6640]"
                                : "border-slate-200 text-slate-300 hover:border-slate-300"
                            } disabled:opacity-40`}
                            aria-label={
                              isOn
                                ? `Retirer ${cat.alias} de ${row.libelle}`
                                : `Ajouter ${cat.alias} à ${row.libelle}`
                            }
                            title={
                              isOn
                                ? "Éligible — cliquer pour retirer"
                                : "Non éligible — cliquer pour ajouter"
                            }
                          >
                            {isOn ? "✓" : "–"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Cliquez sur une cellule pour activer ou désactiver l&apos;éligibilité.
        La combinaison course + catégorie est unique.
      </p>
    </section>
  );
}
