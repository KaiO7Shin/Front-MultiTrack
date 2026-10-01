import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import { coerceArray } from "@/lib/utils";
import type { RenderResponse } from "@/lib/type";

export type StatutOption = { id: number; libelle: string };

export async function fetchStatuts(scope?: "inscription" | "participant"): Promise<StatutOption[]> {
  const res = await api.get<RenderResponse<Record<string, unknown>[]>>(API.statuts, {
    params: scope ? { scope } : undefined,
  });
  return coerceArray(res?.data?.data ?? res?.data)
    .map((row) => ({
      id: Number(row.id ?? 0),
      libelle: String(row.libelle ?? "").trim(),
    }))
    .filter((s) => s.id > 0 && s.libelle.length > 0);
}
