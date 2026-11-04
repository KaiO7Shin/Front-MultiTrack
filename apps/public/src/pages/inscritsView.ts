import type { PublicInscrit } from "../services/publicSite";

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 500] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number] | "all";

export function filterInscrits(rows: PublicInscrit[], query: string) {
  const needle = query.trim().toLocaleLowerCase("fr");
  if (!needle) return rows;
  return rows.filter((row) =>
    [row.nom, row.prenom, row.dossard].some((value) =>
      value.toLocaleLowerCase("fr").includes(needle),
    ),
  );
}

export function pageOf(rows: PublicInscrit[], page: number, pageSize: PageSizeOption) {
  if (rows.length === 0) {
    return { page: 1, pages: 1, slice: rows, label: "0 inscrit" };
  }
  if (pageSize === "all") {
    const label = `${rows.length} inscrit${rows.length > 1 ? "s" : ""}`;
    return { page: 1, pages: 1, slice: rows, label };
  }
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(Math.max(page, 1), pages);
  const start = (current - 1) * pageSize;
  const slice = rows.slice(start, start + pageSize);
  const to = start + slice.length;
  return {
    page: current,
    pages,
    slice,
    label: `${start + 1}–${to} sur ${rows.length}`,
  };
}
