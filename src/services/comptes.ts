import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import type { CompteUtilisateurRow, CompteUpdatePayload, RenderResponse } from "@/lib/type";

function normalizeCompte(raw: Record<string, unknown>): CompteUtilisateurRow {
  return {
    id: Number(raw.id),
    username: String(raw.username ?? raw.nomUtilisateur ?? ""),
    email: String(raw.email ?? raw.adresseEmail ?? ""),
    phone: String(raw.phone ?? raw.numeroTelephone ?? ""),
  };
}

export async function fetchComptesUtilisateur(): Promise<CompteUtilisateurRow[]> {
  const { data } = await api.get<RenderResponse<Record<string, unknown>[]>>(
    API.comptesUtilisateur
  );
  return (data.data ?? []).map(normalizeCompte);
}

export async function updateCompteUtilisateur(
  id: number,
  payload: CompteUpdatePayload
): Promise<RenderResponse<CompteUtilisateurRow>> {
  const { data } = await api.put<RenderResponse<Record<string, unknown>>>(
    API.compteUtilisateurById(id),
    {
      username: payload.username.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      password: payload.password?.trim() || null,
    }
  );
  if (data.data) {
    return { ...data, data: normalizeCompte(data.data) };
  }
  return data as RenderResponse<CompteUtilisateurRow>;
}
