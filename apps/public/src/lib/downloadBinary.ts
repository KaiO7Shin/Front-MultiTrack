import { apiUrl } from "@multitrack/api-client";

type DownloadBinaryOptions = {
  /** Message si le réseau échoue. */
  networkErrorMessage?: string;
  /** Message si la réponse n’est pas un binaire utilisable. */
  fallbackErrorMessage?: string;
  /** Message si le corps est vide. */
  emptyErrorMessage?: string;
};

/**
 * Télécharge un fichier binaire via l’API (`VITE_API_URL` / `apiUrl`).
 * Ne pas utiliser de chemin relatif `/api/...` hors proxy Vite.
 */
export async function downloadBinary(
  path: string,
  filename: string,
  options: DownloadBinaryOptions = {},
): Promise<void> {
  const {
    networkErrorMessage = "Impossible de télécharger le fichier. Vérifiez votre connexion.",
    fallbackErrorMessage = "Impossible de télécharger le fichier",
    emptyErrorMessage = "Le fichier est introuvable ou inaccessible",
  } = options;

  let response: Response;
  try {
    response = await fetch(apiUrl(path), { credentials: "include" });
  } catch {
    throw new Error(networkErrorMessage);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (
    !response.ok
    || contentType.includes("application/json")
    || contentType.includes("text/html")
  ) {
    let message = fallbackErrorMessage;
    if (contentType.includes("application/json")) {
      try {
        const payload = (await response.json()) as { message?: string };
        if (payload.message) message = payload.message;
      } catch {
        /* message par défaut */
      }
    }
    throw new Error(message);
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0) {
    throw new Error(emptyErrorMessage);
  }

  const preview = new TextDecoder("utf-8").decode(buffer.slice(0, 200)).trimStart();
  if (preview.startsWith("<!DOCTYPE") || preview.startsWith("<html")) {
    throw new Error(fallbackErrorMessage);
  }

  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

/** URL absolue (ou relative en local via proxy) pour un lien de secours. */
export function apiDownloadHref(path: string): string {
  return apiUrl(path);
}
