import type { ClassementLigne } from "@/services/classement";

export const PODIUM_SIZE = 3;

export type ClassementCategorie = {
  id: number;
  alias: string;
  ageMin: number | null;
};

export type PodiumTable = {
  title: string;
  rows: ClassementLigne[];
};

export function isHc(alias: string) {
  return alias.trim().toUpperCase() === "HC";
}

export function formatRang(rang: number | null) {
  return rang == null ? "—" : rang.toLocaleString("fr-FR");
}

export function formatCltGenre(row: ClassementLigne) {
  if (row.cltGenre == null) return "—";
  const rank = row.cltGenre.toLocaleString("fr-FR");
  if (row.genre === "Homme") return `${rank} H`;
  if (row.genre === "Femme") return `${rank} F`;
  return rank;
}

export function formatCltCategorie(row: ClassementLigne) {
  if (row.cltCategorie == null) return "—";
  const rank = row.cltCategorie.toLocaleString("fr-FR");
  return row.categorieAlias ? `${rank} ${row.categorieAlias}` : rank;
}

export function filterClassement(
  rows: ClassementLigne[],
  genre: string,
  categorieId: string,
  query: string
) {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (genre !== "all" && row.genre !== genre) return false;
    if (categorieId !== "all" && String(row.categorieId) !== categorieId) return false;
    if (!q) return true;
    const id = String(row.participantId);
    const dossard = row.dossard.trim().toLowerCase();
    const nom = row.nom.toLowerCase();
    const prenom = (row.prenom || "").toLowerCase();
    return (
      id.includes(q) ||
      (dossard.length > 0 && dossard.includes(q)) ||
      nom.includes(q) ||
      prenom.includes(q)
    );
  });
}

export function rankingCategories(
  categories: { id: number; alias: string; ageMin: number | null }[]
): ClassementCategorie[] {
  return categories
    .filter((categorie) => categorie.id > 0 && !isHc(categorie.alias))
    .map((categorie) => ({
      id: categorie.id,
      alias: categorie.alias.trim(),
      ageMin: categorie.ageMin,
    }))
    .sort(compareCategories);
}

export function podiumTables(
  rows: ClassementLigne[],
  categories: ClassementCategorie[]
): PodiumTable[] {
  const scratch = (genre: "Homme" | "Femme", title: string): PodiumTable => ({
    title,
    rows: rows
      .filter((row) => row.genre === genre && row.cltGenre != null && row.cltGenre <= PODIUM_SIZE)
      .sort((a, b) => (a.cltGenre ?? 0) - (b.cltGenre ?? 0)),
  });

  const categoryTables = categories
    .filter((categorie) => !isHc(categorie.alias))
    .map((categorie) => ({
      title: `Catégorie ${categorie.alias}`,
      rows: rows
        .filter(
          (row) =>
            row.categorieId === categorie.id &&
            row.cltCategorie != null &&
            row.cltCategorie <= PODIUM_SIZE
        )
        .sort((a, b) => (a.cltCategorie ?? 0) - (b.cltCategorie ?? 0)),
    }));

  return [scratch("Homme", "Scratch Homme"), scratch("Femme", "Scratch Femme"), ...categoryTables];
}

function compareCategories(a: ClassementCategorie, b: ClassementCategorie) {
  if (a.ageMin == null && b.ageMin == null) return a.alias.localeCompare(b.alias, "fr");
  if (a.ageMin == null) return 1;
  if (b.ageMin == null) return -1;
  if (a.ageMin !== b.ageMin) return a.ageMin - b.ageMin;
  return a.alias.localeCompare(b.alias, "fr");
}
