// API désactivée : données statiques du back-office.
// import api from "../lib/api";
// import { API } from "@/lib/apiEndpoints";
import { staticStore } from "@/data/staticStore";
import type {
  ApiRow,
  Course,
  CourseCreateDTO,
  CourseStatus,
  CourseUpdateDTO,
} from "@/lib/type";

export { fetchCategories } from "@/services/categories";

export async function fetchRanking(
  raceId: number,
  params: { gender?: "Homme" | "Femme"; categoryId?: number },
  _signal?: AbortSignal
): Promise<ApiRow[]> {
  // const qs = new URLSearchParams();
  // if (params.gender) qs.set("gender", params.gender);
  // if (params.categoryId != null) qs.set("categoryId", String(params.categoryId));
  // const res = await api.get(`${API.raceRanking(raceId)}?${qs.toString()}`, { signal });
  // const payload = res?.data ?? {};
  // return Array.isArray(payload?.data) ? (payload.data as ApiRow[]) : [];
  return staticStore.trailRanking(raceId, params);
}

export async function fetchCourses(): Promise<{ id: number; label: string }[]> {
  const courses = await fetchCoursesDetailed();
  return courses.map((c) => ({ id: c.id, label: c.name }));
}

export async function fetchCoursesDetailed(): Promise<Course[]> {
  // const res = await api.get(API.races);
  // return coerceArray(res?.data).map(normalizeCourseFull).filter((c) => c.id > 0);
  return staticStore.listCourses();
}

export async function fetchCoursesForRegistration(): Promise<Course[]> {
  return fetchCoursesDetailed();
}

export async function createCourse(dto: CourseCreateDTO): Promise<Course> {
  // const { data } = await api.post<RenderResponse<Course>>(API.race, dto);
  // return normalizeCourseFull(data.data ?? data);
  return staticStore.createCourse(dto);
}

export async function updateCourse(
  id: number,
  dto: CourseUpdateDTO
): Promise<Course> {
  // const { data } = await api.put<RenderResponse<Course>>(API.raceById(id), dto);
  // return normalizeCourseFull(data.data ?? data);
  return staticStore.updateCourse(id, dto);
}

export async function deleteCourse(id: number): Promise<void> {
  // await api.delete(API.raceById(id));
  staticStore.deleteCourse(id);
}

export async function changeRaceStatus(
  raceId: number,
  newStatus: CourseStatus
): Promise<{ raceId: number; startAt?: string; status: CourseStatus }> {
  // const res = await api.post(API.raceChangeStatus, { raceId, newStatus });
  return staticStore.changeRaceStatus(raceId, newStatus);
}
