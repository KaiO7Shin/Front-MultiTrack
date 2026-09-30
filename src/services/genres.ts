import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import { coerceArray } from "@/lib/utils";
import type { RenderResponse } from "@/lib/type";

export type GenreOption = { id: number; libelle: string };

export async function fetchGenres(): Promise<GenreOption[]> {
  const res = await api.get<RenderResponse<Record<string, unknown>[]>>(API.genres);
  return coerceArray(res?.data?.data ?? res?.data)
    .map((row) => ({
      id: Number(row.id ?? 0),
      libelle: String(row.libelle ?? "").trim(),
    }))
    .filter((g) => g.id > 0 && g.libelle.length > 0);
}
