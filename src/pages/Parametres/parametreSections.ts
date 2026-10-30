import type { AppParametre } from "@/services/parametres";

export const PARAMETRE_CLES = [
  "type_classement",
  "fin_inscription",
  "pub_inscrits",
  "pub_resultat",
] as const;

export type ParametreCle = (typeof PARAMETRE_CLES)[number];

export type ParametreSection = {
  cle: ParametreCle;
  label: string;
  hint?: string;
};

export const APPLICATION_PARAMETRES: ParametreSection[] = [
  {
    cle: "type_classement",
    label: "Cumuler les classements",
    hint: "Activé : un coureur au scratch général de son genre conserve aussi son classement de catégorie. Désactivé : il n’est plus classé dans sa catégorie.",
  },
  {
    cle: "fin_inscription",
    label: "Arrêt des inscriptions",
  },
  {
    cle: "pub_inscrits",
    label: "Publier la liste des inscrits",
  },
  {
    cle: "pub_resultat",
    label: "Publier les résultats",
  },
];

export type ParametreDraft = Record<ParametreCle, boolean>;

export function confirmAction(label: string, next: boolean) {
  return next
    ? `Voulez-vous vraiment activer « ${label} » ?`
    : `Voulez-vous vraiment désactiver « ${label} » ?`;
}

export function draftFromRows(rows: AppParametre[]): ParametreDraft | null {
  const found = new Map(rows.map((row) => [row.parametre, row.valeur]));
  const draft = {} as ParametreDraft;
  for (const section of APPLICATION_PARAMETRES) {
    const value = found.get(section.cle);
    if (typeof value !== "boolean") return null;
    draft[section.cle] = value;
  }
  return draft;
}
