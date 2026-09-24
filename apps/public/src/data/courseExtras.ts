export type CourseExtra = {
  denivele: number;
  gpx: string;
};

function normalizeCourseLabel(label: string) {
  return label
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const COURSE_EXTRAS: Record<string, CourseExtra> = {
  "challenge initiation": { denivele: 350, gpx: "/gpx/initiation.gpx" },
  "challenge initiation trail": { denivele: 350, gpx: "/gpx/initiation.gpx" },
  "challenge explorateur": { denivele: 550, gpx: "/gpx/explorateur.gpx" },
  "challenge explorateur trail": { denivele: 550, gpx: "/gpx/explorateur.gpx" },
  "challenge parent-enfant trail": { denivele: 180, gpx: "/gpx/parent-enfant-trail.gpx" },
  "challenge supreme trail": { denivele: 980, gpx: "/gpx/supreme-trail.gpx" },
  "challenge des amoureux trail": { denivele: 720, gpx: "/gpx/amoureux-trail.gpx" },
  "challenge parent-enfant vtt": { denivele: 220, gpx: "/gpx/parent-enfant-vtt.gpx" },
  "challenge supreme vtt": { denivele: 1100, gpx: "/gpx/supreme-vtt.gpx" },
  "challenge des amoureux vtt": { denivele: 640, gpx: "/gpx/amoureux-vtt.gpx" },
};

export function getCourseExtra(libelle: string | null | undefined): CourseExtra | undefined {
  if (!libelle?.trim()) return undefined;
  return COURSE_EXTRAS[normalizeCourseLabel(libelle)];
}
