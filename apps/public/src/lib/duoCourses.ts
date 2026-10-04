export type PartnerTShirtKind = "parent" | "binome";

export function partnerTShirtKind(libelle: string): PartnerTShirtKind | null {
  if (!libelle?.trim()) return null;
  const normalized = libelle.toLowerCase();
  if (normalized.includes("parent-enfant")) return "parent";
  if (normalized.includes("amoureux")) return "binome";
  return null;
}

export function needsPartnerTShirt(libelle: string) {
  return partnerTShirtKind(libelle) != null;
}

export function isParentEnfantCourse(libelle: string) {
  return partnerTShirtKind(libelle) === "parent";
}

export function partnerTShirtLabel(libelle: string) {
  return partnerTShirtKind(libelle) === "parent"
    ? "Taille t-shirt du parent"
    : "Taille t-shirt du binôme";
}

export function partnerTShirtChoiceMessage(libelle: string) {
  return partnerTShirtKind(libelle) === "parent"
    ? "Choisissez la taille de t-shirt du parent."
    : "Choisissez la taille de t-shirt du binôme.";
}
