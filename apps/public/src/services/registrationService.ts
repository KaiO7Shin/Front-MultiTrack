import type { CreateRegistrationRequest } from "@multitrack/types";
import { draftToRunner } from "../lib/participant";
import { getRacePrice } from "./catalogService";
import type { PaymentMethod, Registration, RunnerDraft } from "../types";

/**
 * Inscriptions du prototype public.
 * Le mapper `toApiRegistrationPayload` prépare le contrat
 * `POST /api/me/registrations` sans changer l’écran actuel.
 */
export function createRegistration(
  draft: RunnerDraft,
  payment: { method: PaymentMethod; reference: string },
): Registration {
  return {
    id: `TBB-${String(Date.now()).slice(-6)}`,
    createdAt: new Date().toLocaleDateString("fr-FR"),
    status: "Validée",
    paymentReference: payment.reference,
    paymentMethod: payment.method,
    totalAmount: getRacePrice(draft.race),
    runner: draftToRunner(draft),
  };
}

export function findRegistration(registrations: Registration[], id: string | undefined) {
  return registrations.find((item) => item.id === id);
}

export function toApiRegistrationPayload(
  draft: RunnerDraft,
  courseId: number,
  extras: Pick<
    CreateRegistrationRequest,
    "genderId" | "tShirtSizeId" | "emergencyContactName" | "emergencyContactPhone"
  >,
): CreateRegistrationRequest {
  return {
    courseId,
    lastName: draft.lastName.trim(),
    firstName: draft.firstName.trim(),
    birthDate: draft.birthDate,
    identityDocumentUrl: draft.identityDocument,
    medicalCertificateUrl: draft.medicalCertificate || undefined,
    parentalAuthorizationUrl: draft.parentalAuthorization || undefined,
    ...extras,
  };
}
