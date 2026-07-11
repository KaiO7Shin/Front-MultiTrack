import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import type { RenderResponse, TypeCourse } from "@/lib/type";

export async function fetchTypesCourse(): Promise<TypeCourse[]> {
  const { data } = await api.get<RenderResponse<TypeCourse[]>>(API.typesCourse);
  return data.data ?? [];
}
