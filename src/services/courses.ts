import api from "../lib/api";
import { coerceArray, normalizeCategory, normalizeCourse } from "@/lib/utils";
import type { UICategory, ApiRow } from "@/lib/type";

export async function fetchRanking(
  raceId: number,
  params: { gender?: "Homme" | "Femme"; categoryId?: number },
  signal?: AbortSignal
): Promise<ApiRow[]> {
  const qs = new URLSearchParams();
  if (params.gender) qs.set("gender", params.gender);
  if (params.categoryId != null) qs.set("categoryId", String(params.categoryId));
  // If api.get supports signal, pass it; otherwise ignore
  const opts: any = {};
  if (signal) opts.signal = signal;
  const res = await api.get(`/races/${raceId}/ranking?${qs.toString()}`, opts);
  const payload = res?.data ?? {};
  return Array.isArray(payload?.data) ? (payload.data as ApiRow[]) : [];
}
export async function fetchCourses(): Promise<{ id: number; label: string }[]> {
  const res = await api.get("/races");
  return coerceArray(res?.data).map(normalizeCourse);
}
export async function fetchCategories(): Promise<UICategory[]> {
  const res = await api.get("/categories");
  return coerceArray(res?.data).map(normalizeCategory);
}