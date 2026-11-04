import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import type { RenderResponse } from "@/lib/type";
import { coerceArray } from "@/lib/utils";

export type AppParametre = {
  id: number;
  parametre: string;
  valeur: boolean;
};

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: { message?: string; error?: string } } })
      .response?.data;
    const message = data?.message?.trim();
    if (message) return message;
    const technical = data?.error?.trim();
    if (technical) return technical;
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

function toParametre(row: Record<string, unknown>): AppParametre | null {
  const id = Number(row.id ?? 0);
  const parametre = String(row.parametre ?? "").trim();
  if (!id || !parametre || typeof row.valeur !== "boolean") return null;
  return { id, parametre, valeur: row.valeur };
}

export async function fetchParametres(): Promise<AppParametre[]> {
  try {
    const res = await api.get<RenderResponse<Record<string, unknown>[]>>(API.parametres);
    return coerceArray(res.data?.data)
      .map((row) => toParametre(row as Record<string, unknown>))
      .filter((row): row is AppParametre => row != null);
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Impossible de charger les paramètres."));
  }
}

export type ParametreUpdateResult = {
  parametre: AppParametre;
  message: string;
};

export async function updateParametre(
  cle: string,
  valeur: boolean
): Promise<ParametreUpdateResult> {
  try {
    const res = await api.put<RenderResponse<Record<string, unknown>>>(
      API.parametreByCle(cle),
      { valeur }
    );
    const row = toParametre((res.data?.data ?? {}) as Record<string, unknown>);
    if (!row) {
      throw new Error("La mise à jour n’a pas renvoyé le paramètre.");
    }
    const message = res.data?.message?.trim() || "Paramètre mis à jour avec succès";
    return { parametre: row, message };
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Impossible de mettre à jour le paramètre."));
  }
}
