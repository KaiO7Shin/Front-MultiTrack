import type { Category } from "@/lib/type";
import { compareTextFr, sortRows, type ColumnSort } from "@/lib/tableSort";

export type CategorySortKey = "alias" | "libelle" | "ageMin";
export type CategorySort = ColumnSort<CategorySortKey>;

export function sortCategories(rows: Category[], sort: CategorySort): Category[] {
  return sortRows(
    rows,
    sort,
    (left, right, key) => {
      if (key === "ageMin") return left.ageMin - right.ageMin;
      if (key === "libelle") return compareTextFr(categoryLabel(left), categoryLabel(right));
      return compareTextFr(left.alias, right.alias);
    },
    (left, right) => left.id - right.id
  );
}

export function categoryLabel(category: Category): string {
  const stored = category.libelle?.trim();
  if (stored) return stored;
  return `${category.alias} ${category.genre}`.trim();
}
