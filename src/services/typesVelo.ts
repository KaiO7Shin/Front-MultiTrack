// API désactivée : données statiques du back-office.
// import api from "@/lib/api";
// import { API } from "@/lib/apiEndpoints";
import { staticStore } from "@/data/staticStore";
import type { TypeVelo } from "@/lib/type";

export async function fetchTypesVelo(): Promise<TypeVelo[]> {
  // const { data } = await api.get<RenderResponse<TypeVelo[]>>(API.typesVelo);
  // return data.data ?? [];
  return staticStore.listTypesVelo();
}
