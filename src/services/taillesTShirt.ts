import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import { coerceArray } from "@/lib/utils";
import type { RenderResponse } from "@/lib/type";

export type TailleTShirtOption = { id: number; alias: string };

export async function fetchTaillesTShirt(): Promise<TailleTShirtOption[]> {
  const res = await api.get<RenderResponse<Record<string, unknown>[]>>(
    API.taillesTShirt
  );
  return coerceArray(res?.data?.data ?? res?.data)
    .map((row) => ({
      id: Number(row.id ?? 0),
      alias: String(row.alias ?? "").trim(),
    }))
    .filter((t) => t.id > 0 && t.alias.length > 0);
}
