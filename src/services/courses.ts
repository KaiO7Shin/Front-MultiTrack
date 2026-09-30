import api from "../lib/api";
import { API } from "@/lib/apiEndpoints";
import { coerceArray, normalizeCourseFull } from "@/lib/utils";
import { staticStore } from "@/data/staticStore";
import type {
  ApiRow,
  Course,
  CourseCreateDTO,
  CourseStatus,
  CourseUpdateDTO,
  RenderResponse,
} from "@/lib/type";

export { fetchCategories } from "@/services/categories";

export async function fetchRanking(
  raceId: number,
  params: { gender?: "Homme" | "Femme"; categoryId?: number },
  _signal?: AbortSignal
): Promise<ApiRow[]> {
  // Ranking trail encore sur staticStore (endpoint dédié à brancher séparément).
  return staticStore.trailRanking(raceId, params);
}

export async function fetchCourses(): Promise<{ id: number; label: string }[]> {
  const courses = await fetchCoursesDetailed();
  return courses.map((c) => ({ id: c.id, label: c.name }));
}

/** Liste courses depuis l’API (nécessaire pour créer un participant avec un vrai courseId). */
export async function fetchCoursesDetailed(): Promise<Course[]> {
  const res = await api.get<RenderResponse<Record<string, unknown>[]>>(API.races);
  return coerceArray(res?.data?.data ?? res?.data)
    .map(normalizeCourseFull)
    .filter((c) => c.id > 0);
}

export async function fetchCoursesForRegistration(): Promise<Course[]> {
  return fetchCoursesDetailed();
}

export async function createCourse(dto: CourseCreateDTO): Promise<Course> {
  // CRUD courses encore staticStore (hors périmètre login + participants).
  return staticStore.createCourse(dto);
}

export async function updateCourse(
  id: number,
  dto: CourseUpdateDTO
): Promise<Course> {
  return staticStore.updateCourse(id, dto);
}

export async function deleteCourse(id: number): Promise<void> {
  staticStore.deleteCourse(id);
}

export async function changeRaceStatus(
  raceId: number,
  newStatus: CourseStatus
): Promise<{ raceId: number; startAt?: string; status: CourseStatus }> {
  return staticStore.changeRaceStatus(raceId, newStatus);
}
