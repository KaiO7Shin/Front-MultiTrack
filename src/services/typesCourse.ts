// API désactivée : données statiques du back-office.
// import api from "@/lib/api";
// import { API } from "@/lib/apiEndpoints";
import { staticStore } from "@/data/staticStore";
import type { TypeCourse } from "@/lib/type";

export async function fetchTypesCourse(): Promise<TypeCourse[]> {
  // const { data } = await api.get<RenderResponse<Record<string, unknown>[]>>(API.typesCourse);
  // return (data.data ?? []).map(normalizeTypeCourse);
  return staticStore.listTypesCourse();
}
