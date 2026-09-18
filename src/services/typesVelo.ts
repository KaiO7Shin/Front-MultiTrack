import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import type { RenderResponse, TypeVelo } from "@/lib/type";

export async function fetchTypesVelo(): Promise<TypeVelo[]> {
  const { data } = await api.get<RenderResponse<TypeVelo[]>>(API.typesVelo);
  return data.data ?? [];
}
