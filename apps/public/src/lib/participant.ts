import { EVENT_INFO } from "../data/catalog";
import type { Runner, RunnerDraft } from "../types";
import { isValidPhone } from "./utils";

const ACCEPTED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg"];
const IDENTITY_MAX_BYTES = 5 * 1024 * 1024;
const MEDICAL_MAX_BYTES = 10 * 1024 * 1024;
const PARENTAL_MAX_BYTES = 5 * 1024 * 1024;

/** Mineur TBB : né en (année de l’événement − 17) ou après. Ex. 2026 → ≥ 2009. */
export function isMinor(birthDate: string, eventDate = EVENT_INFO.date) {
  if (!birthDate) return false;
  const birthYear = Number.parseInt(birthDate.slice(0, 4), 10);
  const eventYear = Number.parseInt(eventDate.slice(0, 4), 10);
  if (!Number.isFinite(birthYear) || !Number.isFinite(eventYear)) return false;
  return birthYear >= eventYear - 17;
}

export function participantFullName(runner: Pick<Runner, "lastName" | "firstName">) {
  return [runner.lastName, runner.firstName].filter((part) => part.trim()).join(" ").trim() || "—";
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
    draft.courseId &&
    draft.identityFile &&
    draft.tshirtSize &&
    draft.emergencyContactName.trim() &&
    isValidPhone(draft.emergencyContactPhone),
  );
}

export function validateIdentityFile(file: File) {
  return fileError(file, IDENTITY_MAX_BYTES, "La pièce d’identité");
}

export function validateMedicalFile(file: File) {
  return fileError(file, MEDICAL_MAX_BYTES, "Le certificat médical");
}

export function validateParentalFile(file: File) {
  return fileError(file, PARENTAL_MAX_BYTES, "L’autorisation parentale");
}

export function validateDraft(draft: RunnerDraft): string | null {
  if (!draft.lastName.trim()) return "Saisissez le nom du participant.";
  if (!draft.firstName.trim()) return "Saisissez le prénom du participant.";
  if (!draft.birthDate) return "Saisissez la date de naissance.";
  if (!draft.gender) return "Choisissez un genre.";
  if (!draft.courseId) return "Choisissez une course.";
  if (!draft.identityFile) return "La pièce d’identité est obligatoire.";
  const identityError = validateIdentityFile(draft.identityFile);
  if (identityError) return identityError;
  if (draft.medicalFile) {
    const medicalError = validateMedicalFile(draft.medicalFile);
    if (medicalError) return medicalError;
  }
  if (isMinor(draft.birthDate) && draft.parentalFile) {
    const parentalError = validateParentalFile(draft.parentalFile);
    if (parentalError) return parentalError;
  }
  if (!draft.tshirtSize) return "Choisissez une taille de t-shirt.";
  if (!draft.emergencyContactName.trim()) return "Saisissez le nom du contact d’urgence.";
  if (!isValidPhone(draft.emergencyContactPhone)) {
    return "Saisissez un numéro de téléphone valide pour le contact d’urgence.";
  }
  return null;
}

function fileError(file: File, maxBytes: number, label: string): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    return "Ce type de fichier n’est pas accepté. Formats autorisés : PDF, JPG, PNG.";
  }
  if (file.size > maxBytes) {
    return `${label} dépasse ${maxBytes / (1024 * 1024)} Mo. Choisissez un fichier plus léger.`;
  }
  return null;
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
    identityDocument: draft.identityFile?.name ?? "",
    medicalCertificate: draft.medicalFile?.name ?? "",
    parentalAuthorization: isMinor(draft.birthDate) ? draft.parentalFile?.name || undefined : undefined,
    tshirtSize: draft.tshirtSize,
    emergencyContactName: draft.emergencyContactName.trim(),
    emergencyContactPhone: draft.emergencyContactPhone,
  };
}
