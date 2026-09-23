/** Libellés API (`statut.libelle`) → pastille UI (classe CSS + label court). */

export const INSCRIPTION_STATUS = {
  /** Conservé en base / affichage historique. Plus utilisé par le flux. */
  SENT: "Envoyée",
  PENDING: "Attente validation",
  VALIDATED: "Validée",
  REFUSED: "Refusée",
} as const;

export type InscriptionStatusTone = "sent" | "pending" | "validated" | "refused" | "unknown";

export type InscriptionStatusPresentation = {
  tone: InscriptionStatusTone;
  label: string;
  /** Classes CSS : `.status-pill` + modificateur (`.is-sent`, …). */
  className: string;
};

const STATUS_PILLS: Record<string, Omit<InscriptionStatusPresentation, "className">> = {
  [INSCRIPTION_STATUS.SENT]: { tone: "sent", label: "Envoyée" },
  [INSCRIPTION_STATUS.PENDING]: { tone: "pending", label: "En attente" },
  [INSCRIPTION_STATUS.VALIDATED]: { tone: "validated", label: "Validée" },
  [INSCRIPTION_STATUS.REFUSED]: { tone: "refused", label: "Refusée" },
};

export function inscriptionStatusPresentation(
  libelle: string | null | undefined,
): InscriptionStatusPresentation {
  const raw = (libelle ?? "").trim();
  const mapped = STATUS_PILLS[raw];
  const tone = mapped?.tone ?? "unknown";
  return {
    tone,
    label: mapped?.label ?? (raw || "—"),
    className: `status-pill is-${tone}`,
  };
}
