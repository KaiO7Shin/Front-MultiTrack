import { useState } from "react";
import api from "@/lib/api";
import { DetailRow, docLabel, formatPhone } from "./detailShared";

export type DocumentOpenUrls = {
  pieceIdentiteUrl?: string | null;
  certificatMedicalUrl?: string | null;
  autorisationParentaleUrl?: string | null;
};

export type AccountContactFields = {
  email?: string | null;
  contact?: string | null;
};

export type EmergencyContactFields = {
  nomContactUrgence?: string | null;
  telephoneContactUrgence?: string | null;
};

export type DocumentPresence = {
  hasPieceIdentite: boolean;
  hasCertificatMedical: boolean;
  hasAutorisationParentale: boolean;
} & DocumentOpenUrls;

/** Retire le préfixe `/api` si présent (baseURL axios inclut déjà `/api`). */
export function toApiRelativePath(path: string): string {
  const trimmed = path.trim();
  if (trimmed.startsWith("/api/")) return trimmed.slice(4);
  if (trimmed.startsWith("api/")) return `/${trimmed.slice(3)}`;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export async function openAuthenticatedDocument(path: string): Promise<void> {
  const relative = toApiRelativePath(path);
  const response = await api.get<Blob>(relative, { responseType: "blob" });
  const contentType =
    String(response.headers["content-type"] ?? "").split(";")[0].trim() ||
    "application/octet-stream";
  if (contentType.includes("application/json") || contentType.includes("text/html")) {
    throw new Error("Impossible d’ouvrir le document.");
  }
  const blob = new Blob([response.data], { type: contentType });
  const objectUrl = URL.createObjectURL(blob);
  const opened = window.open(objectUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

function DocumentOpenButton({
  url,
  present,
}: {
  url?: string | null;
  present: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!url) {
    return (
      <span>
        {docLabel(present)}
        {present ? (
          <span className="text-muted-foreground"> (aperçu indisponible)</span>
        ) : null}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={busy}
        className="text-brand underline-offset-2 hover:underline disabled:opacity-60"
        onClick={() => {
          setError(null);
          setBusy(true);
          openAuthenticatedDocument(url)
            .catch((err: unknown) => {
              setError(
                err instanceof Error
                  ? err.message
                  : "Impossible d’ouvrir le document."
              );
            })
            .finally(() => setBusy(false));
        }}
      >
        {busy ? "Ouverture…" : "Ouvrir"}
      </button>
      {error && (
        <span className="text-xs text-[#a72a1f]" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}

export function AccountContactSection({ data }: { data: AccountContactFields }) {
  return (
    <section className="bg-white border rounded-2xl p-4 sm:p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-brand mb-2">
        Compte de création
      </h2>
      <dl>
        <DetailRow label="Adresse email">{data.email?.trim() || "—"}</DetailRow>
        <DetailRow label="Téléphone">{formatPhone(data.contact)}</DetailRow>
      </dl>
    </section>
  );
}

export function EmergencyAndDocumentsSection({
  data,
  title = "Documents et urgence",
}: {
  data: EmergencyContactFields & DocumentPresence;
  title?: string;
}) {
  return (
    <section className="bg-white border rounded-2xl p-4 sm:p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-brand mb-2">
        {title}
      </h2>
      <dl>
        <DetailRow label="Pièce d’identité">
          <DocumentOpenButton
            url={data.pieceIdentiteUrl}
            present={data.hasPieceIdentite}
          />
        </DetailRow>
        <DetailRow label="Certificat médical">
          <DocumentOpenButton
            url={data.certificatMedicalUrl}
            present={data.hasCertificatMedical}
          />
        </DetailRow>
        <DetailRow label="Autorisation parentale">
          <DocumentOpenButton
            url={data.autorisationParentaleUrl}
            present={data.hasAutorisationParentale}
          />
        </DetailRow>
        <DetailRow label="Contact d’urgence — nom">
          {data.nomContactUrgence?.trim() || "—"}
        </DetailRow>
        <DetailRow label="Contact d’urgence — téléphone">
          {formatPhone(data.telephoneContactUrgence)}
        </DetailRow>
      </dl>
    </section>
  );
}
