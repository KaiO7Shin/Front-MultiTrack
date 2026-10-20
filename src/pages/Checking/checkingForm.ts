export const BIB_LENGTH = 4;
export const INVALID_BIB = "Le numéro de dossard doit être numérique";
export const MISMATCH_BIBS = "Les numéros saisies sont différentes";

export type CheckingInputMethod = "scan" | "manuel";

export function isValidBib(value: string) {
  return /^\d{4}$/.test(value.trim());
}

export function digitsOnly(value: string, max = BIB_LENGTH) {
  return value.replace(/\D/g, "").slice(0, max);
}
