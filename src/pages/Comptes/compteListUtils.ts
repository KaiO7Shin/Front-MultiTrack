import type { CompteUtilisateurRow } from "@/lib/type";

export const COMPTE_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export type ComptePageSize = (typeof COMPTE_PAGE_SIZE_OPTIONS)[number] | "all";

/** Recherche libre sur toutes les colonnes affichées. */
export function filterComptesByQuery(
  rows: CompteUtilisateurRow[],
  query: string
): CompteUtilisateurRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    const haystack = [
      String(row.id),
      row.username,
      row.email,
      row.phone,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function paginateComptes<T>(
  rows: T[],
  pageSize: ComptePageSize,
  page: number
): { paged: T[]; totalPages: number; currentPage: number } {
  if (pageSize === "all") {
    return { paged: rows, totalPages: 1, currentPage: 1 };
  }
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    paged: rows.slice(start, start + pageSize),
    totalPages,
    currentPage,
  };
}

export function compteRangeLabel(
  filteredCount: number,
  pageSize: ComptePageSize,
  currentPage: number
): string {
  if (filteredCount === 0) return "0 compte";
  if (pageSize === "all") {
    return `${filteredCount} compte${filteredCount > 1 ? "s" : ""}`;
  }
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, filteredCount);
  return `${from}–${to} sur ${filteredCount}`;
}
