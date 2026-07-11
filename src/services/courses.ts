import api from "../lib/api";
import { API } from "@/lib/apiEndpoints";
import type {
  ApiRow,
  Course,
  CourseCreateDTO,
  CourseStatus,
  CourseUpdateDTO,
  RenderResponse,
} from "@/lib/type";
import { coerceArray, normalizeCourseFull } from "@/lib/utils";

export { fetchCategories } from "@/services/categories";

export async function fetchRanking(
  raceId: number,
  params: { gender?: "Homme" | "Femme"; categoryId?: number },
  signal?: AbortSignal
): Promise<ApiRow[]> {
  const qs = new URLSearchParams();
  if (params.gender) qs.set("gender", params.gender);
  if (params.categoryId != null) qs.set("categoryId", String(params.categoryId));
  const opts: { signal?: AbortSignal } = {};
  if (signal) opts.signal = signal;
  const res = await api.get(`${API.raceRanking(raceId)}?${qs.toString()}`, opts);
  const payload = res?.data ?? {};
  return Array.isArray(payload?.data) ? (payload.data as ApiRow[]) : [];
}

export async function fetchCourses(): Promise<{ id: number; label: string }[]> {
  const courses = await fetchCoursesDetailed();
  return courses.map((c) => ({ id: c.id, label: c.name }));
}

export async function fetchCoursesDetailed(): Promise<Course[]> {
  const res = await api.get(API.races);
  return coerceArray(res?.data).map(normalizeCourseFull).filter((c) => c.id > 0);
}

export async function fetchCoursesForRegistration(): Promise<Course[]> {
  return fetchCoursesDetailed();
}

export async function createCourse(dto: CourseCreateDTO): Promise<Course> {
  const { data } = await api.post<RenderResponse<Course>>(API.race, dto);
  return normalizeCourseFull(data.data ?? data);
}

export async function updateCourse(
  id: number,
  dto: CourseUpdateDTO
): Promise<Course> {
  const { data } = await api.put<RenderResponse<Course>>(API.raceById(id), dto);
  return normalizeCourseFull(data.data ?? data);
}

export async function deleteCourse(id: number): Promise<void> {
  await api.delete(API.raceById(id));
}

export async function changeRaceStatus(
  raceId: number,
  newStatus: CourseStatus
): Promise<{ raceId: number; startAt?: string; status: CourseStatus }> {
  const res = await api.post(API.raceChangeStatus, { raceId, newStatus });
  const data = res?.data ?? {};
  return {
    raceId: Number(data?.raceId ?? raceId),
    startAt: data?.start_date_time as string | undefined,
    status: normalizeCourseFull({
      status: data?.status ?? data?.state ?? newStatus,
    }).status,
  };
}
