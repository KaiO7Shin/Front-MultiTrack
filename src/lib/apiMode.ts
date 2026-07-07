/**
 * Stratégie de données (`.env`) :
 *
 * VITE_USE_LOCAL_DATA=true   → localStorage uniquement (offline / démo)
 * VITE_USE_LOCAL_DATA=false  → API obligatoire, pas de fallback mock (prod)
 * (non défini)               → hybride : API si disponible, sinon mock local
 */
export const FORCE_LOCAL_DATA =
  import.meta.env.VITE_USE_LOCAL_DATA === "true";

export const API_STRICT_MODE =
  import.meta.env.VITE_USE_LOCAL_DATA === "false";

export const HYBRID_MODE = !FORCE_LOCAL_DATA && !API_STRICT_MODE;

/** Rétrocompat — vrai seulement en mode local forcé */
export const USE_LOCAL_DATA = FORCE_LOCAL_DATA;
