import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PodiumGroup, Row, Course, CourseType, CourseStatus, Category, CategoryGenre, ParticipantProjection, ParticipantStatus, BikeType } from "./type";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Horodatage local au clic (ISO sans fuseau) : yyyy-MM-dd'T'HH:mm:ss.SSS */
export function captureClientTimestamp(): string {
  const d = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `.${pad(d.getMilliseconds(), 3)}`
  );
}

/** Affichage chrono indicatif : hh:mm:ss.mss */
export function formatStopwatchMs(ms: number): string {
  const safe = Math.max(0, Math.floor(ms));
  const h = Math.floor(safe / 3_600_000);
  const m = Math.floor((safe % 3_600_000) / 60_000);
  const s = Math.floor((safe % 60_000) / 1_000);
  const milli = safe % 1_000;
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(milli, 3)}`;
}

/* ===== Utils ===== */
export function courseLabelOf(id: number, list: { id: number; label: string }[]) {
  return list.find((c) => c.id === id)?.label ?? `Course #${id}`;
}
export function coerceArray(x: any): any[] {
  if (Array.isArray(x)) return x;
  if (x && typeof x === "object" && Array.isArray((x as any).data))
    return (x as any).data;
  return [];
}
export function normalizeCourse(raw: any): { id: number; label: string } {
  const id = Number(raw?.id ?? raw?.raceId ?? 0);
  const label = String(
    raw?.name ?? raw?.label ?? raw?.title ?? `Course #${id}`
  );
  return { id, label };
}
export function normalizeCategory(raw: any): Category {
  const ageMaxRaw = raw?.ageMax ?? raw?.age_max;
  const alias = String(raw?.alias ?? "");
  const genreFromApi = raw?.genre;
  return {
    id: Number(raw?.id ?? 0),
    alias,
    genre:
      genreFromApi === "Femme" || genreFromApi === "Homme"
        ? genreFromApi
        : alias.trim().toUpperCase().endsWith("F")
          ? "Femme"
          : "Homme",
    ageMin: Number(raw?.ageMin ?? raw?.age_min ?? 0),
    ageMax:
      ageMaxRaw === null || ageMaxRaw === undefined || ageMaxRaw === ""
        ? null
        : Number(ageMaxRaw),
  };
}

export function formatDurationBetween(
  startIso: string | null,
  endIso: string | null
): string | null {
  if (!startIso || !endIso) return null;
  const ms = Date.parse(endIso) - Date.parse(startIso);
  if (!Number.isFinite(ms) || ms < 0) return null;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatTimeShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

export function formatAgeRange(ageMin: number, ageMax: number | null): string {
  if (ageMax == null) return `${ageMin} ans et +`;
  if (ageMin === ageMax) return `${ageMin} ans`;
  return `${ageMin} – ${ageMax} ans`;
}

/** Affichage « Prénom Nom » (nom de famille en dernier). */
export function formatParticipantName(prenom: string, nom: string): string {
  const p = prenom.trim();
  const n = nom.trim();
  if (p && n) return `${p} ${n}`;
  return p || n;
}

/** Découpe un nom complet legacy (ex. API athleteName). */
export function parseParticipantName(full: string): { prenom: string; nom: string } {
  const trimmed = full.trim();
  if (!trimmed) return { prenom: "", nom: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { prenom: "", nom: parts[0] };
  return { prenom: parts[0], nom: parts.slice(1).join(" ") };
}

export function normalizeParticipantIdentity(raw: {
  nom?: string;
  prenom?: string;
}): { nom: string; prenom: string } {
  const prenom = (raw.prenom ?? "").trim();
  const nom = (raw.nom ?? "").trim();
  if (prenom || !nom.includes(" ")) {
    return { nom, prenom };
  }
  return parseParticipantName(nom);
}

export function findCategoryAliasForAge(
  genre: CategoryGenre,
  age: number,
  categories: Category[]
): string | null {
  const match = categories.find(
    (c) =>
      c.genre === genre &&
      age >= c.ageMin &&
      (c.ageMax == null || age <= c.ageMax)
  );
  return match?.alias ?? null;
}

function numOrUndef(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function intOrZero(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}

export function normalizeCourseType(raw: unknown): CourseType {
  const upper = String(raw ?? "TRAIL").trim().toUpperCase();
  if (
    upper === "TRAIL" ||
    upper === "DH" ||
    upper === "XC" ||
    upper === "ENDURO"
  ) {
    return upper;
  }
  return "TRAIL";
}

/** Courses VTT nécessitant un type de vélo à l'inscription (DH, Enduro). */
export function isBikeCourse(type: CourseType | undefined): boolean {
  return type === "DH" || type === "ENDURO";
}

/** Courses configurées avec phases et manches (DH, XC, Enduro). */
export function usesPhaseMancheStructure(type: CourseType | undefined): boolean {
  return type === "DH" || type === "XC" || type === "ENDURO";
}

/** Courses chronométrées départ + arrivée sur une même manche (DH, Enduro). */
export function usesStartStopTiming(type: CourseType | null | undefined): boolean {
  return type === "DH" || type === "ENDURO";
}

/** Affiche une durée barrière horaire (ex. "04:00:00" → "4 h"). */
export function formatBarrierDuration(value?: string | null): string {
  if (!value) return "—";
  const [hRaw, mRaw] = value.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h)) return value.slice(0, 5);
  if (h > 0 && m > 0) return `${h} h ${m} min`;
  if (h > 0) return `${h} h`;
  if (m > 0) return `${m} min`;
  return value.slice(0, 5);
}

export function normalizeCourseStatus(raw: unknown): CourseStatus {
  const lower = String(raw ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  if (lower === "a venir" || lower === "à venir") return "A venir";
  if (lower === "en cours") return "En cours";
  if (lower === "terminee" || lower === "terminée") return "Terminee";
  return "A venir";
}

export function normalizeBikeType(raw: unknown): BikeType | undefined {
  const upper = String(raw ?? "").trim().toUpperCase();
  if (upper === "TOUT SUSPENDU") return "TOUT SUSPENDU";
  if (upper === "SEMI-RIGIDE") return "SEMI-RIGIDE";
  return undefined;
}

export function normalizeParticipantStatus(raw: unknown): ParticipantStatus {
  const s = String(raw ?? "Inscrit").trim();
  if (s === "Finisher" || s === "Finished") return "Finisher";
  if (s.toUpperCase() === "DSQ") return "DSQ";
  const allowed: ParticipantStatus[] = [
    "Inscrit",
    "Present",
    "En course",
    "Finisher",
    "DNS",
    "DNF",
    "DSQ",
  ];
  if (allowed.includes(s as ParticipantStatus)) return s as ParticipantStatus;
  return "Inscrit";
}

/** Normalise un participant depuis GET /participants ou POST /participant */
export function normalizeParticipantProjection(
  raw: Record<string, unknown>,
  courseIdFallback?: number
): ParticipantProjection & { typeVelo?: BikeType } {
  const identity = normalizeParticipantIdentity({
    nom: raw.nom as string | undefined,
    prenom: raw.prenom as string | undefined,
  });
  const fallbackName =
    !identity.nom && !identity.prenom
      ? parseParticipantName(String(raw.athleteName ?? raw.name ?? ""))
      : identity;

  const courseId = Number(
    raw.courseId ?? raw.courseChoisieId ?? raw.raceId ?? courseIdFallback ?? 0
  );

  const typeVelo = normalizeBikeType(raw.typeVelo ?? raw.type_velo);

  return {
    id: Number(raw.id ?? raw.participantId ?? 0),
    nom: fallbackName.nom,
    prenom: fallbackName.prenom,
    numDossard: String(raw.numDossard ?? raw.bibNumber ?? ""),
    genre: raw.genre === "Femme" ? "Femme" : "Homme",
    aliasCategorie: String(
      raw.aliasCategorie ?? raw.categorie ?? raw.categoryName ?? ""
    ).trim(),
    courseId,
    courseLibelle: String(
      raw.courseLibelle ?? raw.nomCourse ?? raw.courseName ?? ""
    ),
    statut: normalizeParticipantStatus(raw.statut ?? raw.status),
    dateNaissance: String(
      raw.dateNaissance ?? raw.date_naissance ?? raw.birthDate ?? ""
    ),
    nomCourse: String(raw.nomCourse ?? raw.courseLibelle ?? raw.courseName ?? ""),
    typeVelo,
  };
}

/** Normalise une course complète depuis la réponse API */
export function normalizeCourseFull(raw: any): Course {
  const id = Number(raw?.id ?? raw?.course_id ?? raw?.raceId ?? 0);

  return {
    id,
    name: String(raw?.name ?? raw?.label ?? raw?.title ?? `Course #${id}`),
    type: normalizeCourseType(raw?.type ?? raw?.raceType ?? raw?.courseType),
    distanceKm: numOrUndef(raw?.distanceKm ?? raw?.distance_km ?? raw?.distance),
    elevation: numOrUndef(raw?.elevation ?? raw?.elevation_gain ?? raw?.ascent),
    startAt: raw?.startAt ?? raw?.start_at ?? raw?.start_time ?? raw?.start_date_time,
    status: normalizeCourseStatus(raw?.status ?? raw?.status_label ?? raw?.code ?? raw?.state),
    checkpoints: intOrZero(raw?.checkpoints ?? raw?.checkpoints_count ?? raw?.cps),
    dureeBarriereHoraire:
      raw?.dureeBarriereHoraire ?? raw?.duree_barriere_horaire ?? raw?.barrier_time,
    nomSequence: raw?.nomSequence ?? raw?.nom_sequence,
    bibStart: numOrUndef(raw?.bibStart ?? raw?.bib_start),
    bibEnd: numOrUndef(raw?.bibEnd ?? raw?.bib_end),
    typeCourseId: numOrUndef(raw?.typeCourseId ?? raw?.type_course_id),
  };
}

export function buildPodiumGroups(rows: Row[]): PodiumGroup[] {
  const finishers = rows.filter(r =>
    (r.status ?? "").toLowerCase().includes("finish")
  );

  const groups: PodiumGroup[] = [];

  // Scratch Hommes / Femmes : top 3 finishers par genre
  const men = finishers.filter(r => r.categorie.endsWith("H")).slice(0, 3);
  const women = finishers.filter(r => r.categorie.endsWith("F")).slice(0, 3);

  if (men.length) groups.push({ title: "Scratch Hommes", rows: men });
  if (women.length) groups.push({ title: "Scratch Femmes", rows: women });

  // Participants déjà récompensés au scratch : on les exclut des podiums catégorie
  const scratchIds = new Set<number>([
    ...men.map(r => r.participantId),
    ...women.map(r => r.participantId),
  ]);

  // Regroupement par catégorie en sautant les scratch.
  // L'ordre des finishers est conservé (donc le premier non-scratch
  // de chaque catégorie devient le 1er/1ère catégorie).
  const byCategory = new Map<string, Row[]>();
  finishers.forEach(r => {
    if (scratchIds.has(r.participantId)) return;
    if (!byCategory.has(r.categorie)) byCategory.set(r.categorie, []);
    byCategory.get(r.categorie)!.push(r);
  });

  const orderedCats = Array.from(byCategory.keys()).sort((a, b) =>
    a.localeCompare(b, "fr", { numeric: true })
  );

  orderedCats.forEach(cat => {
    const winner = byCategory.get(cat)?.[0];
    if (winner) {
      groups.push({ title: `Catégorie ${cat}`, rows: [winner] });
    }
  });

  return groups;
}

export function toRow(apiRow: any, ctx: { raceId: number; raceLabel: string }): Row {
  const identity = normalizeParticipantIdentity({
    nom: apiRow.nom ?? apiRow.athleteLastName ?? apiRow.lastName,
    prenom: apiRow.prenom ?? apiRow.athleteFirstName ?? apiRow.firstName,
  });
  const fallback =
    !identity.nom && !identity.prenom
      ? parseParticipantName(String(apiRow.athleteName ?? ""))
      : identity;

  return {
    participantId: apiRow.participantId,
    rank: apiRow.rank, // ✅ rang officiel
    dossard: apiRow.bibNumber,
    nom: fallback.nom,
    prenom: fallback.prenom,
    categorie: apiRow.categoryName,
    raceTime: apiRow.raceTime,
    status: apiRow.status,

    // 🆕 nouveaux champs
    categoryRank: apiRow.categoryRank,
    genderRank: apiRow.genderRank,

    courseId: ctx.raceId,
    course: ctx.raceLabel,
    controlPoints: apiRow.controlPoints ?? [],
  };
}

export function coerceArrayList<T = unknown>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload?.data && Array.isArray(payload.data)) return payload.data;
  if (payload?.races && Array.isArray(payload.races)) return payload.races;
  if (payload?.items && Array.isArray(payload.items)) return payload.items;
  return [];
}

export function buildCumulatedPodiumGroups(rows: Row[]) {
  if (!rows.length) return [];

  // 1. Scratch podium (top 3 général)
  const scratch = rows.slice(0, 3);
  const scratchIds = new Set(scratch.map(r => r.participantId));

  // 2. Catégories sans les scratch
  const byCategory = new Map<string, Row[]>();

  rows.forEach(row => {
    if (scratchIds.has(row.participantId)) return;

    const key = row.categorie;
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(row);
  });

  const categoryGroups = Array.from(byCategory.entries()).map(
    ([category, catRows]) => ({
      title: `Catégorie ${category}`,
      rows: catRows.slice(0, 3),
    })
  );

  return [
    {
      title: "Scratch Général",
      rows: scratch,
    },
    ...categoryGroups,
  ];
}