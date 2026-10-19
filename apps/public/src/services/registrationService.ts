import { API, ApiError, apiRequest, apiUrl, listFrom, toErrorMessage } from "@multitrack/api-client";
import { INSCRIPTION_STATUS, type InscriptionResponse, type RenderResponse } from "@multitrack/types";
import { needsPartnerTShirt } from "../lib/duoCourses";
import { isIdempotencyKey } from "../lib/idempotencyKey";
import { draftToRunner, isMinor, validateDraft, validateRegistrationEdit, type RegistrationEditInput } from "../lib/participant";
import { formatInscriptionDate } from "../lib/utils";
import {
  GENDERS,
  PAYMENT_METHODS,
  PAYMENT_REFERENCE_MAX_LENGTH,
  TSHIRT_SIZES,
  type PaymentMethod,
  type Registration,
  type RunnerDraft,
} from "../types";

export type PaymentInput = { method: PaymentMethod | ""; reference: string };

/** Mêmes contraintes que `info_paiement` côté API (VARCHAR(15) / VARCHAR(30)). */
export function validatePayment(payment: PaymentInput): string | null {
  if (!payment.method || !PAYMENT_METHODS.includes(payment.method)) {
    return "Choisissez un moyen de paiement.";
  }
  const reference = payment.reference.trim();
  if (!reference) return "Saisissez la référence de paiement.";
  if (reference.length > PAYMENT_REFERENCE_MAX_LENGTH) {
    return `La référence de paiement ne doit pas dépasser ${PAYMENT_REFERENCE_MAX_LENGTH} caractères.`;
  }
  return null;
}

/**
 * Inscriptions du site public.
 * Un seul `POST /api/me/registrations` (multipart) à la confirmation du paiement.
 * Les étapes 1–3 du wizard restent locales (localStorage + IndexedDB).
 */
export function createRegistration(
  draft: RunnerDraft,
  payment: PaymentInput,
  extras?: { id?: string; status?: string; totalAmount?: number },
): Registration {
  return {
    id: extras?.id ?? `TBB-${String(Date.now()).slice(-6)}`,
    createdAt: new Date().toLocaleDateString("fr-FR"),
    status: extras?.status ?? INSCRIPTION_STATUS.PENDING,
    paymentReference: payment.reference,
    paymentMethod: payment.method,
    totalAmount: extras?.totalAmount ?? 0,
    runner: draftToRunner(draft),
  };
}

export function findRegistration(registrations: Registration[], id: string | undefined) {
  return registrations.find((item) => item.id === id);
}

export function mapInscription(item: InscriptionResponse): Registration {
  const method = PAYMENT_METHODS.find((option) => option === item.paymentMethod) ?? "";
  return {
    id: String(item.id),
    createdAt: formatInscriptionDate(item.submittedAt),
    status: item.status,
    paymentReference: item.paymentReference || "—",
    paymentMethod: method,
    totalAmount: Number(item.totalAmount ?? 0),
    numDossard: item.numDossard?.trim() || null,
    documentStates: item.documentStates ?? undefined,
    refusalComment: item.status === INSCRIPTION_STATUS.REFUSED
      ? item.refusalComment?.trim() || null
      : null,
    runner: {
      id: item.id,
      firstName: item.firstName ?? "",
      lastName: item.lastName,
      birthDate: item.birthDate,
      gender: item.gender,
      category: item.category?.trim() ?? "",
      race: item.courseLabel,
      identityDocument: documentHref(item.id, "identite", item.identityDocumentUrl),
      medicalCertificate: documentHref(item.id, "certificat", item.medicalCertificateUrl),
      parentalAuthorization: documentHref(item.id, "autorisation", item.parentalAuthorizationUrl) || undefined,
      tshirtSize: item.tShirtSize,
      tshirtSizeBinome: item.tShirtSizeBinome ?? undefined,
      emergencyContactName: item.emergencyContactName,
      emergencyContactPhone: item.emergencyContactPhone,
    },
  };
}

function documentHref(
  inscriptionId: number,
  type: "identite" | "certificat" | "autorisation",
  provided: string | null | undefined,
): string {
  if (!provided?.trim()) {
    return "";
  }
  return apiUrl(API.myRegistrationDocument(inscriptionId, type));
}

export async function listMyRegistrations(): Promise<Registration[]> {
  const payload = await apiRequest<RenderResponse<InscriptionResponse[]> | InscriptionResponse[]>(
    API.myRegistrations,
  );
  return listFrom(payload).map(mapInscription);
}

export async function submitRegistration(
  draft: RunnerDraft,
  payment: PaymentInput,
  idempotencyKey: string,
): Promise<{ ok: true; data: InscriptionResponse } | { ok: false; error: string }> {
  const clientError = validateDraft(draft);
  if (clientError) {
    return { ok: false, error: clientError };
  }
  const paymentError = validatePayment(payment);
  if (paymentError) {
    return { ok: false, error: paymentError };
  }
  if (typeof draft.courseId !== "number" || !draft.identityFile) {
    return { ok: false, error: "La pièce d’identité est obligatoire." };
  }
  if (!isIdempotencyKey(idempotencyKey)) {
    return { ok: false, error: "La demande d’inscription est incomplète. Rechargez la page et réessayez." };
  }

  const genderId = GENDERS.find((gender) => gender.label === draft.gender)?.id;
  const tShirtSizeId = TSHIRT_SIZES.find((size) => size.alias === draft.tshirtSize)?.id;
  const tShirtSizeBinomeId = TSHIRT_SIZES.find((size) => size.alias === draft.tshirtSizeBinome)?.id;
  if (!genderId || !tShirtSizeId) {
    return { ok: false, error: "Genre ou taille de t-shirt introuvable." };
  }

  const body = new FormData();
  body.append("courseId", String(draft.courseId));
  body.append("lastName", draft.lastName.trim());
  body.append("firstName", draft.firstName.trim());
  body.append("birthDate", draft.birthDate);
  body.append("genderId", String(genderId));
  body.append("tShirtSizeId", String(tShirtSizeId));
  if (tShirtSizeBinomeId) {
    body.append("tShirtSizeBinomeId", String(tShirtSizeBinomeId));
  }
  body.append("emergencyContactName", draft.emergencyContactName.trim());
  body.append("emergencyContactPhone", draft.emergencyContactPhone);
  // Le montant n’est jamais envoyé : le serveur le calcule depuis le tarif de la course.
  body.append("paymentMethod", payment.method);
  body.append("paymentReference", payment.reference.trim());
  body.append("idempotencyKey", idempotencyKey.trim());
  body.append("identityFile", draft.identityFile);
  if (draft.medicalFile) body.append("medicalFile", draft.medicalFile);
  if (isMinor(draft.birthDate) && draft.parentalFile) {
    body.append("parentalFile", draft.parentalFile);
  }

  try {
    const payload = await apiRequest<RenderResponse<InscriptionResponse>>(API.myRegistrations, {
      method: "POST",
      body,
    });
    if (payload.code !== 200 || !payload.data) {
      return {
        ok: false,
        error: payload.message?.trim() || payload.error?.trim() || "Impossible d’enregistrer l’inscription.",
      };
    }
    return { ok: true, data: payload.data };
  } catch (error: unknown) {
    if (error instanceof ApiError && error.message.trim()) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateRegistration(
  registrationId: string,
  input: RegistrationEditInput,
  payment: PaymentInput,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const clientError = validateRegistrationEdit(input) ?? validatePayment(payment);
  if (clientError) return { ok: false, error: clientError };

  const genderId = GENDERS.find((gender) => gender.label === input.gender)?.id;
  const tShirtSizeId = TSHIRT_SIZES.find((size) => size.alias === input.tshirtSize)?.id;
  const tShirtSizeBinomeId = needsPartnerTShirt(input.race)
    ? TSHIRT_SIZES.find((size) => size.alias === input.tshirtSizeBinome)?.id
    : undefined;
  if (!genderId || !tShirtSizeId || (needsPartnerTShirt(input.race) && !tShirtSizeBinomeId)) {
    return { ok: false, error: "Genre ou taille de t-shirt introuvable." };
  }

  const body = new FormData();
  body.append("lastName", input.lastName.trim());
  body.append("firstName", input.firstName.trim());
  body.append("birthDate", input.birthDate);
  body.append("genderId", String(genderId));
  body.append("tShirtSizeId", String(tShirtSizeId));
  if (tShirtSizeBinomeId) body.append("tShirtSizeBinomeId", String(tShirtSizeBinomeId));
  body.append("emergencyContactName", input.emergencyContactName.trim());
  body.append("emergencyContactPhone", input.emergencyContactPhone);
  body.append("paymentMethod", payment.method);
  body.append("paymentReference", payment.reference.trim());
  if (input.identityFile) body.append("identityFile", input.identityFile);
  if (input.medicalFile) body.append("medicalFile", input.medicalFile);
  if (isMinor(input.birthDate) && input.parentalFile) body.append("parentalFile", input.parentalFile);

  try {
    const payload = await apiRequest<RenderResponse<InscriptionResponse>>(API.myRegistration(registrationId), {
      method: "PUT",
      body,
    });
    if (payload.code !== 200 || !payload.data) {
      return {
        ok: false,
        error: payload.message?.trim() || payload.error?.trim() || "Impossible de modifier l’inscription.",
      };
    }
    return { ok: true, message: payload.message?.trim() || "Inscription mise à jour avec succès" };
  } catch (error: unknown) {
    if (error instanceof ApiError && error.message.trim()) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: toErrorMessage(error) };
  }
}
