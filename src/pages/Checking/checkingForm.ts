export const BIB_LENGTH = 4;
export const INVALID_BIB = "Le numéro de dossard doit être numérique";
export const MISMATCH_BIBS = "Les numéros saisies sont différentes";

export type CheckingInputMethod = "scan" | "manuel";

export function withBibValue(message: string, value: string) {
  return `${message} : ${value}`;
}

export function invalidBibMessage(value: string) {
  return withBibValue(INVALID_BIB, value);
}

export function mismatchBibMessage(first: string, second: string) {
  return withBibValue(MISMATCH_BIBS, `${first} / ${second}`);
}

export function isValidBib(value: string) {
  return /^\d{4}$/.test(value.trim());
}

export function digitsOnly(value: string, max = BIB_LENGTH) {
  return value.replace(/\D/g, "").slice(0, max);
}

/**
 * Chiffre envoyé par un lecteur HID, y compris sur clavier Windows AZERTY
 * (les touches 1–0 non shiftées donnent &, é, " …).
 */
const AZERTY_TOP_ROW: Record<string, string> = {
  "&": "1",
  é: "2",
  '"': "3",
  "'": "4",
  "(": "5",
  "-": "6",
  è: "7",
  _: "8",
  ç: "9",
  à: "0",
  "§": "6",
  "!": "8",
};

export function digitFromHidEvent(event: KeyboardEvent) {
  const fromCode = event.code.match(/^(?:Digit|Numpad)(\d)$/);
  if (fromCode) return fromCode[1];
  if (event.key >= "0" && event.key <= "9") return event.key;
  return AZERTY_TOP_ROW[event.key] ?? null;
}
