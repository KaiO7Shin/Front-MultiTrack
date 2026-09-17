import { EVENT_INFO } from "../data/catalog";
import type { Runner, RunnerDraft } from "../types";
import { isValidPhone } from "./utils";

export function isMinor(birthDate: string) {
  if (!birthDate) return false;
  const birthday = new Date(birthDate);
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() - 18);
  return birthday > limit;
}

export function getAgeOnEvent(birthDate: string, eventDate = EVENT_INFO.date) {
  const birth = new Date(birthDate);
  const event = new Date(eventDate);
  let age = event.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    event.getMonth() < birth.getMonth() ||
    (event.getMonth() === birth.getMonth() && event.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function getCategory(birthDate: string, gender: string) {
  if (!birthDate) return "";
  const age = getAgeOnEvent(birthDate);
  const band = age < 16 ? "Cadet" : age < 18 ? "Junior" : age < 40 ? "Senior" : "Master";
  if (gender === "Femme") return `${band} Femme`;
  if (gender === "Homme") return `${band} Homme`;
  return band;
}

export function isDraftComplete(draft: RunnerDraft) {
  return Boolean(
    draft.firstName.trim() &&
    draft.lastName.trim() &&
    draft.birthDate &&
    draft.gender &&
    draft.race &&
    draft.identityDocument &&
    draft.tshirtSize &&
    draft.emergencyContactName.trim() &&
    isValidPhone(draft.emergencyContactPhone),
  );
}

export function draftToRunner(draft: RunnerDraft): Runner {
  return {
    id: Date.now(),
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    birthDate: draft.birthDate,
    gender: draft.gender,
    category: getCategory(draft.birthDate, draft.gender),
    race: draft.race,
    identityDocument: draft.identityDocument,
    medicalCertificate: draft.medicalCertificate,
    parentalAuthorization: isMinor(draft.birthDate) ? draft.parentalAuthorization || undefined : undefined,
    tshirtSize: draft.tshirtSize,
    emergencyContactName: draft.emergencyContactName.trim(),
    emergencyContactPhone: draft.emergencyContactPhone,
  };
}
