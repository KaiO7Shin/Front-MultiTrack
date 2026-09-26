import { GENDERS, TSHIRT_SIZES } from "../types";

export type ParticipantGender = (typeof GENDERS)[number]["label"];
export type ParticipantTshirtSize = (typeof TSHIRT_SIZES)[number]["alias"];

export type ParticipantIdentity = {
  lastName: string;
  firstName: string;
  birthDate: string;
  gender: ParticipantGender;
  tshirtSize: ParticipantTshirtSize;
};

export type ParticipantField = keyof ParticipantIdentity;
export type ParticipantFormValues = Record<ParticipantField, string>;

const STORAGE_KEY = "tbb.participant";
const GENDER_LABELS = new Set<string>(GENDERS.map((item) => item.label));
const TSHIRT_ALIASES = new Set<string>(TSHIRT_SIZES.map((item) => item.alias));

export const EMPTY_PARTICIPANT_FORM: ParticipantFormValues = {
  lastName: "",
  firstName: "",
  birthDate: "",
  gender: "",
  tshirtSize: "",
};

export const PARTICIPANT_FIELDS: readonly ParticipantField[] = [
  "lastName",
  "firstName",
  "birthDate",
  "gender",
  "tshirtSize",
];

function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function validateParticipantField(field: ParticipantField, value: string) {
  if (field === "lastName") {
    return value.trim() ? "" : "Indiquez votre nom.";
  }
  if (field === "firstName") {
    return value.trim() ? "" : "Indiquez votre prénom.";
  }
  if (field === "birthDate") {
    if (!value) return "Indiquez votre date de naissance.";
    const date = parseIsoDate(value);
    if (!date || date.getFullYear() < 1900) return "Indiquez une date de naissance valide.";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) return "La date de naissance ne peut pas être dans le futur.";
    return "";
  }
  if (field === "gender") {
    return GENDER_LABELS.has(value) ? "" : "Choisissez un genre.";
  }
  return TSHIRT_ALIASES.has(value) ? "" : "Choisissez une taille de t-shirt.";
}

export function validateParticipantForm(values: ParticipantFormValues) {
  const errors: Partial<Record<ParticipantField, string>> = {};
  for (const field of PARTICIPANT_FIELDS) {
    const message = validateParticipantField(field, values[field]);
    if (message) errors[field] = message;
  }
  return errors;
}

export function participantFormSummary(errors: Partial<Record<ParticipantField, string>>) {
  const messages = Object.values(errors).filter((message): message is string => Boolean(message));
  if (messages.length === 0) return "";
  if (messages.length === 1) return messages[0];
  return "Complétez les champs indiqués pour continuer.";
}

function isGender(value: string): value is ParticipantGender {
  return GENDER_LABELS.has(value);
}

function isTshirtSize(value: string): value is ParticipantTshirtSize {
  return TSHIRT_ALIASES.has(value);
}

export function toParticipantIdentity(values: ParticipantFormValues): ParticipantIdentity | null {
  const lastName = values.lastName.trim();
  const firstName = values.firstName.trim();
  if (
    !lastName ||
    !firstName ||
    validateParticipantField("birthDate", values.birthDate) ||
    !isGender(values.gender) ||
    !isTshirtSize(values.tshirtSize)
  ) {
    return null;
  }
  return {
    lastName,
    firstName,
    birthDate: values.birthDate,
    gender: values.gender,
    tshirtSize: values.tshirtSize,
  };
}

export function participantIdentityToForm(identity: ParticipantIdentity): ParticipantFormValues {
  return {
    lastName: identity.lastName,
    firstName: identity.firstName,
    birthDate: identity.birthDate,
    gender: identity.gender,
    tshirtSize: identity.tshirtSize,
  };
}

export function loadParticipantIdentity(): ParticipantIdentity | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Partial<Record<ParticipantField, unknown>>;
    if (
      typeof candidate.lastName !== "string" ||
      typeof candidate.firstName !== "string" ||
      typeof candidate.birthDate !== "string" ||
      typeof candidate.gender !== "string" ||
      typeof candidate.tshirtSize !== "string"
    ) {
      return null;
    }
    return toParticipantIdentity({
      lastName: candidate.lastName,
      firstName: candidate.firstName,
      birthDate: candidate.birthDate,
      gender: candidate.gender,
      tshirtSize: candidate.tshirtSize,
    });
  } catch {
    return null;
  }
}

export function saveParticipantIdentity(identity: ParticipantIdentity) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

export function maxBirthDateIso(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
