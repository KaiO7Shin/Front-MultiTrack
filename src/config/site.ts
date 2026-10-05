/**
 * Configuration back-office MultiTrack (devise, libellés monétaires).
 * Miroir du pattern `apps/public/src/config/site.ts` — fichier séparé, non partagé.
 */
export const CURRENCY = {
  /** Code ISO 4217 (référence). */
  code: "MGA",
  /** Libellé affiché à côté des montants. */
  label: "Ariary",
  /** Suffixe compact (ex. listes). */
  suffix: "Ar",
  /** Locale pour le formatage numérique. */
  locale: "fr-FR",
} as const;
