import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import { filenameFromContentDisposition } from "@/lib/downloadBlob";
import type { DossardPreflight, RenderResponse } from "@/lib/type";

const FALLBACK_NAME = "dossards.pdf";
const DISABLED_MESSAGE =
  "Génération des dossards désactivée sur ce serveur : définir DOSSARDS_ENABLED=true dans trail-api/.env (local uniquement) puis redémarrer l’API.";

export async function fetchDossardPreflight(
  courseId: number
): Promise<DossardPreflight> {
  try {
    const { data } = await api.get<RenderResponse<DossardPreflight>>(
      API.dossardsPreflight,
      { params: { courseId } }
    );
    if (!data.data) {
      throw new Error(data.message || data.error || "Vérification impossible.");
    }
    return data.data;
  } catch (err) {
    if (err instanceof Error && !(err as { response?: unknown }).response) {
      throw err;
    }
    throw new Error(await messageFromBlobError(err, "Vérification impossible."));
  }
}

export type GeneratedDossardPdf = {
  blob: Blob;
  filename: string;
};

export async function generateDossardsPdf(
  courseId: number,
  file: File
): Promise<GeneratedDossardPdf> {
  const form = new FormData();
  form.append("courseId", String(courseId));
  form.append("template", file);

  try {
    const response = await api.post<Blob>(API.dossardsGenerate, form, {
      responseType: "blob",
      headers: { "Content-Type": "multipart/form-data" },
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const filename = filenameFromContentDisposition(
      String(response.headers["content-disposition"] ?? ""),
      FALLBACK_NAME
    );
    return { blob, filename };
  } catch (err) {
    throw new Error(await messageFromBlobError(err, "Génération impossible."));
  }
}

async function messageFromBlobError(err: unknown, fallback: string): Promise<string> {
  const response = (err as { response?: { status?: number; data?: unknown } })?.response;
  if (response?.status === 404) {
    return DISABLED_MESSAGE;
  }
  const data = response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text()) as {
        message?: string;
        error?: string;
      };
      return parsed.message || parsed.error || fallback;
    } catch {
      return fallback;
    }
  }
  if (data && typeof data === "object") {
    const rec = data as { message?: string; error?: string };
    return rec.message || rec.error || fallback;
  }
  return fallback;
}
