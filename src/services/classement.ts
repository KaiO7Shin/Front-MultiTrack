import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import type { RenderResponse } from "@/lib/type";
import { coerceArray } from "@/lib/utils";

export type ClassementLigne = {
  participantId: number;
  rang: number | null;
  dossard: string;
  nom: string;
  prenom: string;
  categorieId: number;
  categorieAlias: string;
  ageMin: number | null;
  genre: string;
  temps: string | null;
  cltGenre: number | null;
  cltCategorie: number | null;
  statut: string;
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

function numberOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toLigne(row: Record<string, unknown>): ClassementLigne | null {
  const participantId = numberOrNull(row.participantId);
  const categorieId = numberOrNull(row.categorieId);
  const dossard = String(row.dossard ?? "").trim();
  const nom = String(row.nom ?? "").trim();
  if (participantId == null || categorieId == null || !dossard || !nom) return null;
  return {
    participantId,
    rang: numberOrNull(row.rang),
    dossard,
    nom,
    prenom: String(row.prenom ?? "").trim(),
    categorieId,
    categorieAlias: String(row.categorieAlias ?? "").trim(),
    ageMin: numberOrNull(row.ageMin),
    genre: String(row.genre ?? "").trim(),
    temps: row.temps == null || String(row.temps).trim() === "" ? null : String(row.temps).trim(),
    cltGenre: numberOrNull(row.cltGenre),
    cltCategorie: numberOrNull(row.cltCategorie),
    statut: String(row.statut ?? "").trim(),
  };
}

export async function fetchClassement(courseId: number): Promise<ClassementLigne[]> {
  try {
    const res = await api.get<RenderResponse<Record<string, unknown>[]>>(
      API.classementByCourse(courseId)
    );
    return coerceArray(res.data?.data)
      .map((row) => toLigne(row as Record<string, unknown>))
      .filter((row): row is ClassementLigne => row != null);
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Impossible de charger le classement."));
  }
}
