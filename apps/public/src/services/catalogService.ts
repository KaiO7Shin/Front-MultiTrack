import { API, ApiError, apiRequest } from "@multitrack/api-client";
import type { CourseListItem, RenderResponse } from "@multitrack/types";
import { CATEGORIES, CATEGORY_ELIGIBILITY, COURSE_GROUPS, RACES } from "../data/catalog";
import type { Race } from "../types";

export type CourseTypeGroup = {
  typeCourse: string;
  courses: CourseListItem[];
};

export async function fetchCourses(): Promise<CourseListItem[]> {
  const payload = await apiRequest<RenderResponse<CourseListItem[]>>(API.courses);
  if (payload.code !== 200) {
    throw new ApiError(
      payload.message ?? payload.error ?? "Impossible de récupérer les courses",
      payload.code,
    );
  }
  return payload.data ?? [];
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
 * Catalogue public actuel : données TBB locales pour catégories et inscriptions.
 * Les courses affichées sur /courses viennent de `fetchCourses()`.
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
