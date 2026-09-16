import { API, ApiError, apiRequest } from "@multitrack/api-client";
import type { CategoryListItem, CourseEligibleCategories, CourseListItem, RenderResponse } from "@multitrack/types";
import { CATEGORIES, CATEGORY_ELIGIBILITY, COURSE_GROUPS, RACES } from "../data/catalog";
import type { Race } from "../types";

export type CourseTypeGroup = {
  typeCourse: string;
  courses: CourseListItem[];
};

function readRenderList<T>(payload: RenderResponse<T[]>, fallbackMessage: string): T[] {
  if (payload.code !== 200) {
    throw new ApiError(
      payload.message ?? payload.error ?? fallbackMessage,
      payload.code,
    );
  }
  return payload.data ?? [];
}

export async function fetchCourses(): Promise<CourseListItem[]> {
  const payload = await apiRequest<RenderResponse<CourseListItem[]>>(API.courses);
  return readRenderList(payload, "Impossible de récupérer les courses");
}

export async function fetchCategoriesList(): Promise<CategoryListItem[]> {
  const payload = await apiRequest<RenderResponse<CategoryListItem[]>>(API.categories);
  return readRenderList(payload, "Impossible de récupérer les catégories");
}

export async function fetchEligibleCategoriesByCourse(): Promise<CourseEligibleCategories[]> {
  const payload = await apiRequest<RenderResponse<CourseEligibleCategories[]>>(
    API.courseEligibleCategories,
  );
  return readRenderList(payload, "Impossible de récupérer les catégories éligibles");
}

export function isCategoryEligibleForCourse(
  course: CourseEligibleCategories,
  categoryLibelle: string,
) {
  return course.categories_eligibles.some(
    (category) => category.libelle_categorie === categoryLibelle,
  );
}

export function groupCoursesByType(courses: CourseListItem[]): CourseTypeGroup[] {
  const groups: CourseTypeGroup[] = [];

  for (const course of courses) {
    const typeCourse = course.type_course ?? "";
    const last = groups.at(-1);
    if (last && last.typeCourse === typeCourse) {
      last.courses.push(course);
      continue;
    }
    groups.push({ typeCourse, courses: [course] });
  }

  return groups;
}

export function courseGroupTitle(typeCourse: string) {
  return typeCourse ? `Challenge ${typeCourse}` : "Courses";
}

/**
 * Catalogue public actuel : données TBB locales pour l’éligibilité et les inscriptions.
 * Les listes /courses et /categories viennent de l’API.
 */
export function getRaces(): Race[] {
  return RACES;
}

export function getCourseGroups() {
  return COURSE_GROUPS;
}

export function getCategories() {
  return CATEGORIES;
}

export function isCategoryEligible(raceName: string, categoryName: string) {
  return Boolean(CATEGORY_ELIGIBILITY[raceName]?.includes(categoryName));
}

export function formatRaceLabel(race: Race) {
  return [race.name, race.discipline, race.distance].filter(Boolean).join(" — ");
}

export function findRace(raceLabel: string) {
  return RACES.find((race) => raceLabel.startsWith(race.name));
}

export function findRaceByName(name: string) {
  return RACES.find((race) => race.name === name);
}

export function getRacePrice(raceLabel: string) {
  return findRace(raceLabel)?.price ?? 0;
}

export function isDuoRace(raceLabel: string) {
  return Boolean(findRace(raceLabel)?.duo);
}
