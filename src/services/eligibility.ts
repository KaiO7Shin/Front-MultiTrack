import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import { coerceArray } from "@/lib/utils";
import type { RenderResponse } from "@/lib/type";

export type EligibleCategoryItem = {
  categorie_id?: number;
  libelle_categorie: string;
};

export type CourseEligibleCategories = {
  course_id?: number;
  libelle_course: string;
  nom_course: string;
  categories_eligibles: EligibleCategoryItem[];
};

function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string; error?: string } } })
    ?.response?.data;
  return data?.message || data?.error || fallback;
}

export async function fetchEligibleCategoriesByCourse(): Promise<
  CourseEligibleCategories[]
> {
  const res = await api.get<RenderResponse<Record<string, unknown>[]>>(
    API.courseEligibleCategories
  );
  return coerceArray(res?.data?.data ?? res?.data).map((row) => ({
    course_id: Number(row.course_id ?? row.courseId ?? 0) || undefined,
    libelle_course: String(row.libelle_course ?? row.libelleCourse ?? ""),
    nom_course: String(row.nom_course ?? row.nomCourse ?? ""),
    categories_eligibles: coerceArray(
      row.categories_eligibles ?? row.categoriesEligibles
    ).map((c) => ({
      categorie_id: Number(c.categorie_id ?? c.categorieId ?? 0) || undefined,
      libelle_categorie: String(c.libelle_categorie ?? c.libelleCategorie ?? ""),
    })),
  }));
}

export function isCategoryEligibleForCourse(
  course: CourseEligibleCategories,
  categoryLibelle: string
): boolean {
  return course.categories_eligibles.some(
    (c) => c.libelle_categorie === categoryLibelle
  );
}

export async function addEligibility(
  courseId: number,
  categorieId: number
): Promise<void> {
  try {
    const { data } = await api.post<RenderResponse<unknown>>(API.eligibility, {
      courseId,
      categorieId,
    });
    if (data.code !== 200) {
      throw new Error(data.message || data.error || "Ajout impossible");
    }
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Erreur lors de l'ajout de l'éligibilité."));
  }
}

export async function removeEligibility(
  courseId: number,
  categorieId: number
): Promise<void> {
  try {
    const { data } = await api.delete<RenderResponse<null>>(
      API.eligibilityByIds(courseId, categorieId)
    );
    if (data.code !== 200) {
      throw new Error(data.message || data.error || "Retrait impossible");
    }
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Erreur lors du retrait de l'éligibilité."));
  }
}
