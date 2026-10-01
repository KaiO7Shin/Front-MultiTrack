import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import { normalizeParticipantStatus, normalizeTshirtSize } from "@/lib/utils";
import type {
  InscriptionDetail,
  InscriptionReviewDecision,
  InscriptionReviewResponse,
  RenderResponse,
} from "@/lib/type";

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: { message?: string; error?: string } } })
      .response?.data;
    const message = data?.message?.trim();
    if (message) return message;
    const error = data?.error?.trim();
    if (error) return error;
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

export function normalizeInscriptionDetail(
  raw: Record<string, unknown>
): InscriptionDetail {
  const tailleTShirt = normalizeTshirtSize(
    raw.tailleTShirt ?? raw.tShirtSize ?? raw.tshirtSize
  );
  const montantRaw = raw.montant;
  const montant =
    typeof montantRaw === "number"
      ? montantRaw
      : montantRaw != null && montantRaw !== ""
        ? Number(montantRaw)
        : undefined;

  const optionalUrl = (value: unknown) => {
    const s = value != null ? String(value).trim() : "";
    return s || undefined;
  };

  return {
    id: Number(raw.id ?? 0),
    nom: String(raw.nom ?? "").trim(),
    prenom: String(raw.prenom ?? "").trim(),
    dateNaissance: String(raw.dateNaissance ?? raw.birthDate ?? ""),
    genre: String(raw.genre ?? "").trim(),
    ...(tailleTShirt ? { tailleTShirt } : {}),
    courseId: Number(raw.courseId ?? 0),
    courseLibelle: String(raw.courseLibelle ?? raw.nomCourse ?? ""),
    statut: normalizeParticipantStatus(raw.statut ?? raw.status),
    ...(raw.email ? { email: String(raw.email) } : {}),
    ...(raw.contact ? { contact: String(raw.contact) } : {}),
    ...(raw.nomContactUrgence
      ? { nomContactUrgence: String(raw.nomContactUrgence) }
      : {}),
    ...(raw.telephoneContactUrgence
      ? { telephoneContactUrgence: String(raw.telephoneContactUrgence) }
      : {}),
    hasPieceIdentite: Boolean(raw.hasPieceIdentite),
    hasCertificatMedical: Boolean(raw.hasCertificatMedical),
    hasAutorisationParentale: Boolean(raw.hasAutorisationParentale),
    ...(optionalUrl(raw.pieceIdentiteUrl)
      ? { pieceIdentiteUrl: optionalUrl(raw.pieceIdentiteUrl) }
      : {}),
    ...(optionalUrl(raw.certificatMedicalUrl)
      ? { certificatMedicalUrl: optionalUrl(raw.certificatMedicalUrl) }
      : {}),
    ...(optionalUrl(raw.autorisationParentaleUrl)
      ? { autorisationParentaleUrl: optionalUrl(raw.autorisationParentaleUrl) }
      : {}),
    ...(raw.moyenPaiement ? { moyenPaiement: String(raw.moyenPaiement) } : {}),
    ...(raw.referencePaiement
      ? { referencePaiement: String(raw.referencePaiement) }
      : {}),
    ...(montant != null && !Number.isNaN(montant) ? { montant } : {}),
    ...(raw.commentaire ? { commentaire: String(raw.commentaire) } : {}),
    ...(raw.submittedAt ? { submittedAt: String(raw.submittedAt) } : {}),
    participantId:
      raw.participantId != null && raw.participantId !== ""
        ? Number(raw.participantId)
        : null,
    numDossard: raw.numDossard != null ? String(raw.numDossard).trim() || null : null,
  };
}

export async function fetchInscriptionById(id: number): Promise<InscriptionDetail> {
  try {
    const { data } = await api.get<RenderResponse<Record<string, unknown>>>(
      API.inscriptionById(id)
    );
    if (!data.data) {
      throw new Error(data.message || "Inscription introuvable");
    }
    return normalizeInscriptionDetail(data.data);
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Impossible de charger l’inscription."));
  }
}

export async function reviewInscription(
  id: number,
  decision: InscriptionReviewDecision,
  commentaire?: string
): Promise<RenderResponse<InscriptionReviewResponse>> {
  try {
    const { data } = await api.post<RenderResponse<InscriptionReviewResponse>>(
      API.inscriptionReview(id),
      { decision, commentaire: commentaire?.trim() || undefined }
    );
    return data;
  } catch (err) {
    throw new Error(
      apiErrorMessage(err, "Impossible de traiter l’inscription.")
    );
  }
}
