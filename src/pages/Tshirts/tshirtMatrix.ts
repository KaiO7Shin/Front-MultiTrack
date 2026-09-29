import { TSHIRT_SIZES } from "@/lib/participantIdentity";

export type TshirtMatrixCourse = {
  id: number;
  name: string;
};

export type TshirtMatrixParticipant = {
  courseId: number;
  tailleTShirt?: string;
};

export type TshirtMatrix = {
  sizes: string[];
  courses: TshirtMatrixCourse[];
  /** counts[size][courseId] */
  counts: Record<string, Record<number, number>>;
  rowTotals: Record<string, number>;
  columnTotals: Record<number, number>;
  grandTotal: number;
};

export function buildTshirtMatrix(
  courses: TshirtMatrixCourse[],
  participants: TshirtMatrixParticipant[]
): TshirtMatrix {
  const sizes = TSHIRT_SIZES.map((s) => s.alias);
  const sizeSet = new Set<string>(sizes);

  const counts: Record<string, Record<number, number>> = {};
  for (const size of sizes) {
    counts[size] = {};
    for (const course of courses) {
      counts[size][course.id] = 0;
    }
  }

  for (const participant of participants) {
    const size = participant.tailleTShirt?.trim().toUpperCase();
    if (!size || !sizeSet.has(size)) continue;
    if (!(participant.courseId in (counts[size] ?? {}))) continue;
    counts[size][participant.courseId] += 1;
  }

  const rowTotals: Record<string, number> = {};
  const columnTotals: Record<number, number> = {};
  for (const course of courses) {
    columnTotals[course.id] = 0;
  }

  let grandTotal = 0;
  for (const size of sizes) {
    let rowTotal = 0;
    for (const course of courses) {
      const value = counts[size][course.id] ?? 0;
      rowTotal += value;
      columnTotals[course.id] += value;
    }
    rowTotals[size] = rowTotal;
    grandTotal += rowTotal;
  }

  return { sizes, courses, counts, rowTotals, columnTotals, grandTotal };
}

/** Applique les filtres course / taille et recalcule les totaux sur la sous-matrice. */
export function filterTshirtMatrix(
  matrix: TshirtMatrix,
  courseId: number | "all",
  size: string | "all"
): TshirtMatrix {
  const courses =
    courseId === "all"
      ? matrix.courses
      : matrix.courses.filter((c) => c.id === courseId);
  const sizes =
    size === "all" ? matrix.sizes : matrix.sizes.filter((s) => s === size);

  const counts: Record<string, Record<number, number>> = {};
  const rowTotals: Record<string, number> = {};
  const columnTotals: Record<number, number> = {};
  for (const course of courses) {
    columnTotals[course.id] = 0;
  }

  let grandTotal = 0;
  for (const rowSize of sizes) {
    counts[rowSize] = {};
    let rowTotal = 0;
    for (const course of courses) {
      const value = matrix.counts[rowSize]?.[course.id] ?? 0;
      counts[rowSize][course.id] = value;
      rowTotal += value;
      columnTotals[course.id] += value;
    }
    rowTotals[rowSize] = rowTotal;
    grandTotal += rowTotal;
  }

  return { sizes, courses, counts, rowTotals, columnTotals, grandTotal };
}
