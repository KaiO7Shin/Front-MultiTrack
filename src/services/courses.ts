import api from "../lib/api";
import { API } from "@/lib/apiEndpoints";
import { coerceArray, normalizeCourseFull } from "@/lib/utils";
import type {
  ApiRow,
  Course,
  CourseCreateDTO,
  CourseStatus,
  CourseUpdateDTO,
  RenderResponse,
} from "@/lib/type";
import { staticStore } from "@/data/staticStore";

export { fetchCategories } from "@/services/categories";

function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string; error?: string } } })
    ?.response?.data;
  return data?.message || data?.error || fallback;
}

/** Payload API (denivelePositif) depuis le DTO front (totalDenivele rétrocompat). */
function toApiCourseBody(dto: CourseCreateDTO | CourseUpdateDTO) {
  const body: Record<string, unknown> = {};
  if (dto.libelle !== undefined) body.libelle = dto.libelle;
  if (dto.typeCourseId !== undefined) body.typeCourseId = dto.typeCourseId;
  if (dto.distance !== undefined) body.distance = dto.distance;
  const denivele =
    dto.denivelePositif ?? ("totalDenivele" in dto ? dto.totalDenivele : undefined);
  if (denivele !== undefined) body.denivelePositif = denivele;
  if (dto.dureeBarriereHoraire !== undefined) {
    body.dureeBarriereHoraire = dto.dureeBarriereHoraire || null;
  }
  if (dto.tarif !== undefined) body.tarif = dto.tarif;
  if (dto.description !== undefined) body.description = dto.description;
  return body;
}

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
  try {
    const { data } = await api.post<RenderResponse<Record<string, unknown>>>(
      API.race,
      toApiCourseBody(dto)
    );
    if (data.code !== 200 || !data.data) {
      throw new Error(data.message || data.error || "Création impossible");
    }
    return normalizeCourseFull(data.data);
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Erreur lors de la création de la course."));
  }
}

export async function updateCourse(
  id: number,
  dto: CourseUpdateDTO
): Promise<Course> {
  try {
    const { data } = await api.put<RenderResponse<Record<string, unknown>>>(
      API.raceById(id),
      toApiCourseBody(dto)
    );
    if (data.code !== 200 || !data.data) {
      throw new Error(data.message || data.error || "Mise à jour impossible");
    }
    return normalizeCourseFull(data.data);
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Erreur lors de la mise à jour de la course."));
  }
}

export async function deleteCourse(id: number): Promise<void> {
  try {
    const { data } = await api.delete<RenderResponse<null>>(API.raceById(id));
    if (data.code !== 200) {
      throw new Error(data.message || data.error || "Suppression impossible");
    }
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Erreur lors de la suppression de la course."));
  }
}

export async function finishRace(
  raceId: number
): Promise<{ raceId: number; startAt?: string; status: CourseStatus }> {
  try {
    const { data } = await api.post<
      RenderResponse<{
        raceId: number;
        startDateTime?: string;
        status: string;
      }>
    >(API.raceFinish(raceId));
    if (data.code !== 200 || !data.data) {
      throw new Error(data.message || data.error || "Terminaison impossible");
    }
    return {
      raceId: data.data.raceId,
      startAt: data.data.startDateTime,
      status: data.data.status as CourseStatus,
    };
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Erreur lors de la clôture de la course."));
  }
}

export async function changeRaceStatus(
  raceId: number,
  newStatus: CourseStatus
): Promise<{ raceId: number; startAt?: string; status: CourseStatus }> {
  try {
    const { data } = await api.post<
      RenderResponse<{
        raceId: number;
        startDateTime?: string;
        status: string;
      }>
    >(API.raceChangeStatus, { raceId, newStatus });
    if (data.code !== 200 || !data.data) {
      throw new Error(data.message || data.error || "Changement de statut impossible");
    }
    return {
      raceId: data.data.raceId,
      startAt: data.data.startDateTime,
      status: data.data.status as CourseStatus,
    };
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Erreur lors du changement de statut de la course."));
  }
}
