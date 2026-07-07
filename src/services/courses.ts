import api from "../lib/api";
import { API } from "@/lib/apiEndpoints";
import { apiOrLocal, apiWriteOrLocal } from "@/lib/apiFallback";
import {
  localChangeRaceStatus,
  localCreateCourse,
  localDeleteCourse,
  localGetCourses,
  localUpdateCourse,
} from "@/lib/localData";
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
export { FORCE_LOCAL_DATA, API_STRICT_MODE, HYBRID_MODE, USE_LOCAL_DATA } from "@/lib/apiMode";

export async function fetchRanking(
  raceId: number,
  params: { gender?: "Homme" | "Femme"; categoryId?: number },
  signal?: AbortSignal
): Promise<ApiRow[]> {
  return apiOrLocal(
    async () => {
      const qs = new URLSearchParams();
      if (params.gender) qs.set("gender", params.gender);
      if (params.categoryId != null)
        qs.set("categoryId", String(params.categoryId));
      const opts: { signal?: AbortSignal } = {};
      if (signal) opts.signal = signal;
      const res = await api.get(`${API.raceRanking(raceId)}?${qs.toString()}`, opts);
      const payload = res?.data ?? {};
      return Array.isArray(payload?.data) ? (payload.data as ApiRow[]) : [];
    },
    () => [],
    { label: `GET ${API.raceRanking(raceId)}` }
  );
}

export async function fetchCourses(): Promise<{ id: number; label: string }[]> {
  const courses = await fetchCoursesDetailed();
  return courses.map((c) => ({ id: c.id, label: c.name }));
}

export async function fetchCoursesDetailed(): Promise<Course[]> {
  return apiOrLocal(
    async () => {
      const res = await api.get(API.races);
      return coerceArray(res?.data).map(normalizeCourseFull).filter((c) => c.id > 0);
    },
    () => localGetCourses(),
    { label: `GET ${API.races}` }
  );
}

export async function createCourse(dto: CourseCreateDTO): Promise<Course> {
  return apiWriteOrLocal(
    async () => {
      const { data } = await api.post<RenderResponse<Course>>(API.race, dto);
      return normalizeCourseFull(data.data ?? data);
    },
    () => localCreateCourse(dto),
    `POST ${API.race}`
  );
}

export async function updateCourse(
  id: number,
  dto: CourseUpdateDTO,
  existing?: Course
): Promise<Course> {
  return apiWriteOrLocal(
    async () => {
      const { data } = await api.put<RenderResponse<Course>>(API.raceById(id), dto);
      return normalizeCourseFull(data.data ?? data);
    },
    () => {
      if (!existing) throw new Error("Course existante requise pour la mise à jour");
      return localUpdateCourse(id, dto, existing);
    },
    `PUT ${API.raceById(id)}`
  );
}

export async function deleteCourse(id: number): Promise<void> {
  return apiWriteOrLocal(
    async () => {
      await api.delete(API.raceById(id));
    },
    () => {
      localDeleteCourse(id);
    },
    `DELETE ${API.raceById(id)}`
  );
}

export async function changeRaceStatus(
  raceId: number,
  newStatus: CourseStatus
): Promise<{ raceId: number; startAt?: string; status: CourseStatus }> {
  return apiWriteOrLocal(
    async () => {
      const res = await api.post(API.raceChangeStatus, { raceId, newStatus });
      const data = res?.data ?? {};
      return {
        raceId: Number(data?.raceId ?? raceId),
        startAt: data?.start_date_time as string | undefined,
        status: normalizeCourseFull({
          status: data?.status ?? data?.state ?? newStatus,
        }).status,
      };
    },
    () => localChangeRaceStatus(raceId, newStatus),
    `POST ${API.raceChangeStatus}`
  );
}
