import type {
  BikeType,
  Category,
  CategoryCreateDTO,
  CategoryGenre,
  CategoryUpdateDTO,
  Course,
  CourseCreateDTO,
  CourseStatus,
  CourseUpdateDTO,
  ParticipantCreateDTO,
  ParticipantProjection,
  ParticipantUpdateDTO,
  ParticipantDisqualification,
  UICategory,
  Manche,
  MancheCreateDTO,
  MancheUpdateDTO,
  Phase,
  PhaseCreateDTO,
  PhaseUpdateDTO,
  ResultatManche,
  ResultatMancheView,
  MancheAssignment,
} from "./type";
import { findCategoryAliasForAge, normalizeParticipantIdentity } from "./utils";
import {
  canCheckParticipantOnManche,
  type CheckpointMancheMode,
} from "./raceRanking";
import {
  MOCK_META_IDS,
  buildMockParticipants,
  mockCourses,
  mockManches,
  mockPhases,
  mockDisqualifications,
  mockMancheAssignments,
  mockResultatsManche,
} from "./mockData";

export {
  FORCE_LOCAL_DATA,
  API_STRICT_MODE,
  HYBRID_MODE,
  USE_LOCAL_DATA,
} from "./apiMode";

const KEYS = {
  courses: "mt_courses",
  participants: "mt_participants",
  categories: "mt_categories",
  phases: "mt_phases",
  manches: "mt_manches",
  resultatsManche: "mt_resultats_manche",
  disqualifications: "mt_disqualifications",
  mancheAssignments: "mt_manche_assignments",
  meta: "mt_meta",
} as const;

type StoredParticipant = ParticipantProjection & { typeVelo?: BikeType };

type Meta = {
  nextCourseId: number;
  nextParticipantId: number;
  nextCategoryId: number;
  nextPhaseId: number;
  nextMancheId: number;
  nextResultatMancheId: number;
  nextDisqualificationId: number;
  nextBibByCourse: Record<string, number>;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function getMeta(): Meta {
  return readJson<Meta>(KEYS.meta, { ...MOCK_META_IDS });
}

function saveMeta(meta: Meta): void {
  writeJson(KEYS.meta, meta);
}

function seedCourses(): Course[] {
  return mockCourses();
}

function seedCategoriesDetailed(): Category[] {
  return [
    { id: 1, alias: "SEH", genre: "Homme", ageMin: 0, ageMax: 17 },
    { id: 2, alias: "SEF", genre: "Femme", ageMin: 0, ageMax: 17 },
    { id: 3, alias: "M0H", genre: "Homme", ageMin: 18, ageMax: 22 },
    { id: 4, alias: "M0F", genre: "Femme", ageMin: 18, ageMax: 22 },
    { id: 5, alias: "M1H", genre: "Homme", ageMin: 23, ageMax: 29 },
    { id: 6, alias: "M1F", genre: "Femme", ageMin: 23, ageMax: 29 },
    { id: 7, alias: "M2H", genre: "Homme", ageMin: 30, ageMax: 39 },
    { id: 8, alias: "M2F", genre: "Femme", ageMin: 30, ageMax: 39 },
    { id: 9, alias: "M3H", genre: "Homme", ageMin: 40, ageMax: 49 },
    { id: 10, alias: "M3F", genre: "Femme", ageMin: 40, ageMax: 49 },
    { id: 11, alias: "M4H", genre: "Homme", ageMin: 50, ageMax: null },
    { id: 12, alias: "M4F", genre: "Femme", ageMin: 50, ageMax: null },
  ];
}

function isLegacyCategory(raw: unknown): raw is UICategory {
  return (
    typeof raw === "object" &&
    raw !== null &&
    "alias" in raw &&
    !("ageMin" in raw)
  );
}

function computeAge(dateNaissance: string): number {
  const birth = new Date(dateNaissance);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

function resolveCategoryAlias(genre: CategoryGenre, dateNaissance: string): string {
  const age = computeAge(dateNaissance);
  const categories = localGetCategoriesDetailed();
  const found = findCategoryAliasForAge(genre, age, categories);
  if (found) return found;
  const suffix = genre === "Homme" ? "H" : "F";
  return `SE${suffix}`;
}

function nextBibForCourse(courseId: number): string {
  const meta = getMeta();
  const key = String(courseId);
  const base = courseId * 1000;
  const current = meta.nextBibByCourse[key] ?? base;
  const next = current + 1;
  meta.nextBibByCourse[key] = next;
  saveMeta(meta);
  return String(next);
}

/* ---------- Courses ---------- */

export function localGetCourses(): Course[] {
  let courses = readJson<Course[]>(KEYS.courses, []);
  if (courses.length === 0) {
    courses = seedCourses();
    writeJson(KEYS.courses, courses);
  }
  return courses;
}

export function localSaveCourses(courses: Course[]): void {
  writeJson(KEYS.courses, courses);
}

export function localCreateCourse(dto: CourseCreateDTO): Course {
  const meta = getMeta();
  const course: Course = {
    id: meta.nextCourseId++,
    name: dto.name.trim(),
    type: dto.type,
    distanceKm: dto.distanceKm,
    elevation: dto.elevation,
    description: dto.description?.trim() || undefined,
    status: "A venir",
    checkpoints: 0,
  };
  saveMeta(meta);
  const courses = localGetCourses();
  courses.push(course);
  localSaveCourses(courses);
  return course;
}

export function localUpdateCourse(
  id: number,
  dto: CourseUpdateDTO,
  existing: Course
): Course {
  const updated: Course = {
    ...existing,
    name: dto.name?.trim() ?? existing.name,
    type: dto.type ?? existing.type,
    distanceKm: dto.distanceKm ?? existing.distanceKm,
    elevation: dto.elevation ?? existing.elevation,
    description:
      dto.description !== undefined
        ? dto.description.trim() || undefined
        : existing.description,
  };
  const courses = localGetCourses().map((c) => (c.id === id ? updated : c));
  localSaveCourses(courses);
  return updated;
}

export function localDeleteCourse(id: number): void {
  const phaseIds = localGetPhasesRaw()
    .filter((p) => p.courseId === id)
    .map((p) => p.id);
  phaseIds.forEach((phaseId) => {
    const mancheIds = localGetManchesRaw()
      .filter((m) => m.phaseId === phaseId)
      .map((m) => m.id);
    mancheIds.forEach((mancheId) => {
      localSaveResultatsManche(
        localGetResultatsMancheRaw().filter((r) => r.mancheId !== mancheId)
      );
    });
    localSaveManches(
      localGetManchesRaw().filter((m) => m.phaseId !== phaseId)
    );
  });
  localSavePhases(localGetPhasesRaw().filter((p) => p.courseId !== id));
  localSaveCourses(localGetCourses().filter((c) => c.id !== id));
}

export function localChangeRaceStatus(
  raceId: number,
  newStatus: CourseStatus
): { raceId: number; startAt?: string; status: CourseStatus } {
  const courses = localGetCourses().map((c) => {
    if (c.id !== raceId) return c;
    return {
      ...c,
      status: newStatus,
      startAt: newStatus === "En cours" ? new Date().toISOString() : c.startAt,
    };
  });
  localSaveCourses(courses);
  const course = courses.find((c) => c.id === raceId);
  return { raceId, startAt: course?.startAt, status: newStatus };
}

/* ---------- Participants ---------- */

function normalizeStoredParticipant(p: StoredParticipant): StoredParticipant {
  const { nom, prenom } = normalizeParticipantIdentity(p);
  return { ...p, nom, prenom };
}

function seedParticipants(): StoredParticipant[] {
  localGetCourses();
  localGetCategoriesDetailed();
  const courses = localGetCourses();
  return buildMockParticipants({
    resolveCategory: resolveCategoryAlias,
    courseLabel: (courseId) =>
      courses.find((c) => c.id === courseId)?.name ?? `Course #${courseId}`,
  });
}

function ensureParticipantsSeeded(): void {
  if (readJson<StoredParticipant[]>(KEYS.participants, []).length > 0) return;
  const seeded = seedParticipants();
  localSaveParticipants(seeded);
  const meta = getMeta();
  Object.assign(meta, {
    nextParticipantId: MOCK_META_IDS.nextParticipantId,
    nextBibByCourse: { ...MOCK_META_IDS.nextBibByCourse },
  });
  saveMeta(meta);
}

function localGetParticipantsRaw(): StoredParticipant[] {
  ensureParticipantsSeeded();
  return readJson<StoredParticipant[]>(KEYS.participants, []).map(
    normalizeStoredParticipant
  );
}

function localSaveParticipants(participants: StoredParticipant[]): void {
  writeJson(KEYS.participants, participants);
}

export function localGetParticipantsByCourse(raceId: number): ParticipantProjection[] {
  return localGetParticipantsRaw().filter((p) => p.courseId === raceId);
}

export function localCreateParticipant(dto: ParticipantCreateDTO): StoredParticipant {
  const meta = getMeta();
  const courses = localGetCourses();
  const course = courses.find((c) => c.id === dto.courseChoisieId);
  const courseLibelle = course?.name ?? `Course #${dto.courseChoisieId}`;

  const participant: StoredParticipant = {
    id: meta.nextParticipantId++,
    nom: dto.nom.trim(),
    prenom: dto.prenom.trim(),
    numDossard: nextBibForCourse(dto.courseChoisieId),
    genre: dto.genre,
    aliasCategorie: resolveCategoryAlias(dto.genre, dto.dateNaissance),
    courseId: dto.courseChoisieId,
    courseLibelle,
    nomCourse: courseLibelle,
    statut: "Inscrit",
    dateNaissance: dto.dateNaissance,
    typeVelo: dto.typeVelo,
  };

  saveMeta(meta);
  const all = localGetParticipantsRaw();
  all.push(participant);
  localSaveParticipants(all);
  return participant;
}

export function localUpdateParticipant(dto: ParticipantUpdateDTO) {
  const all = localGetParticipantsRaw();
  const idx = all.findIndex((p) => p.numDossard === dto.bibNumber);
  if (idx === -1) throw new Error("Participant introuvable");

  const newBib = dto.numDossard.trim();
  const courseId = dto.courseChoisieId;
  const courses = localGetCourses();
  const course = courses.find((c) => c.id === courseId);

  const duplicate = all.some(
    (p, i) =>
      i !== idx && p.courseId === courseId && p.numDossard === newBib
  );
  if (duplicate) {
    throw new Error("Ce numéro de dossard existe déjà sur cette course");
  }

  const courseLibelle = course?.name ?? `Course #${courseId}`;

  const updated: StoredParticipant = {
    ...all[idx],
    nom: dto.nom.trim(),
    prenom: dto.prenom.trim(),
    numDossard: newBib,
    genre: dto.genre,
    dateNaissance: dto.dateNaissance,
    aliasCategorie: resolveCategoryAlias(dto.genre, dto.dateNaissance),
    courseId,
    courseLibelle,
    nomCourse: courseLibelle,
    statut: dto.statut,
    typeVelo: course?.type === "DH" ? dto.typeVelo : undefined,
  };

  all[idx] = updated;
  localSaveParticipants(all);

  return {
    bibNumber: newBib,
    genre: dto.genre,
    dateNaissance: dto.dateNaissance,
    ageActuelle: computeAge(dto.dateNaissance),
    categorie: updated.aliasCategorie,
  };
}

/** @deprecated Utiliser localUpdateParticipant */
export function localUpdateParticipantCategory(dto: {
  bibNumber: string;
  genre: "Homme" | "Femme";
  dateNaissance: string;
}) {
  const all = localGetParticipantsRaw();
  const existing = all.find((p) => p.numDossard === dto.bibNumber);
  if (!existing) throw new Error("Participant introuvable");

  return localUpdateParticipant({
    bibNumber: dto.bibNumber,
    numDossard: existing.numDossard,
    nom: existing.nom,
    prenom: existing.prenom,
    dateNaissance: dto.dateNaissance,
    genre: dto.genre,
    courseChoisieId: existing.courseId,
    statut: existing.statut,
    typeVelo: existing.typeVelo,
  });
}

export function localChangeParticipantStatus(
  bibNumber: string,
  newStatus: ParticipantProjection["statut"]
): void {
  const all = localGetParticipantsRaw();
  const idx = all.findIndex((p) => p.numDossard === bibNumber);
  if (idx === -1) throw new Error("Participant introuvable");
  all[idx] = { ...all[idx], statut: newStatus };
  localSaveParticipants(all);
}

/* ---------- Categories ---------- */

export function localGetCategoriesDetailed(): Category[] {
  const raw = readJson<unknown[]>(KEYS.categories, []);
  if (raw.length === 0 || raw.some(isLegacyCategory)) {
    const cats = seedCategoriesDetailed();
    writeJson(KEYS.categories, cats);
    return cats;
  }
  return raw as Category[];
}

export function localGetCategories(): UICategory[] {
  return localGetCategoriesDetailed().map((c) => ({
    id: c.id,
    alias: c.alias,
  }));
}

function localSaveCategories(categories: Category[]): void {
  writeJson(KEYS.categories, categories);
}

export function localCreateCategory(dto: CategoryCreateDTO): Category {
  const meta = getMeta();
  const category: Category = {
    id: meta.nextCategoryId++,
    alias: dto.alias.trim().toUpperCase(),
    genre: dto.genre,
    ageMin: dto.ageMin,
    ageMax: dto.ageMax,
  };
  saveMeta(meta);
  const all = localGetCategoriesDetailed();
  all.push(category);
  localSaveCategories(all);
  return category;
}

export function localUpdateCategory(
  id: number,
  dto: CategoryUpdateDTO,
  existing: Category
): Category {
  const updated: Category = {
    ...existing,
    alias: dto.alias?.trim().toUpperCase() ?? existing.alias,
    genre: dto.genre ?? existing.genre,
    ageMin: dto.ageMin ?? existing.ageMin,
    ageMax: dto.ageMax !== undefined ? dto.ageMax : existing.ageMax,
  };
  const all = localGetCategoriesDetailed().map((c) =>
    c.id === id ? updated : c
  );
  localSaveCategories(all);
  return updated;
}

export function localDeleteCategory(id: number): void {
  localSaveCategories(localGetCategoriesDetailed().filter((c) => c.id !== id));
}

/* ---------- Phases ---------- */

function localGetPhasesRaw(): Phase[] {
  return readJson<Phase[]>(KEYS.phases, []);
}

function localSavePhases(phases: Phase[]): void {
  writeJson(KEYS.phases, phases);
}

function seedPhases(): Phase[] {
  return mockPhases();
}

export function localGetPhases(): Phase[] {
  const raw = localGetPhasesRaw();
  if (raw.length === 0) {
    const seeded = seedPhases();
    const meta = getMeta();
    meta.nextPhaseId = MOCK_META_IDS.nextPhaseId;
    saveMeta(meta);
    localSavePhases(seeded);
    return seeded;
  }
  return raw;
}

export function localGetPhasesByCourse(courseId: number): Phase[] {
  return localGetPhases().filter((p) => p.courseId === courseId);
}

export function localCreatePhase(dto: PhaseCreateDTO): Phase {
  const meta = getMeta();
  const phase: Phase = {
    id: meta.nextPhaseId++,
    courseId: dto.courseId,
    label: dto.label.trim(),
  };
  saveMeta(meta);
  const all = localGetPhasesRaw();
  all.push(phase);
  localSavePhases(all);
  return phase;
}

export function localUpdatePhase(
  id: number,
  dto: PhaseUpdateDTO,
  existing: Phase
): Phase {
  const updated: Phase = {
    ...existing,
    label: dto.label?.trim() ?? existing.label,
  };
  const all = localGetPhasesRaw().map((p) => (p.id === id ? updated : p));
  localSavePhases(all);
  return updated;
}

export function localDeletePhase(id: number): void {
  const mancheIds = localGetManchesRaw()
    .filter((m) => m.phaseId === id)
    .map((m) => m.id);
  mancheIds.forEach((mancheId) => localDeleteManche(mancheId));
  localSavePhases(localGetPhasesRaw().filter((p) => p.id !== id));
}

/* ---------- Manches ---------- */

function localGetManchesRaw(): Manche[] {
  return readJson<Manche[]>(KEYS.manches, []);
}

function localSaveManches(manches: Manche[]): void {
  writeJson(KEYS.manches, manches);
}

function seedManches(): Manche[] {
  return mockManches();
}

export function localGetManches(): Manche[] {
  const raw = localGetManchesRaw();
  if (raw.length === 0) {
    localGetPhases();
    const seeded = seedManches();
    const meta = getMeta();
    meta.nextMancheId = MOCK_META_IDS.nextMancheId;
    saveMeta(meta);
    localSaveManches(seeded);
    return seeded;
  }
  return raw;
}

export function localGetManchesByPhase(phaseId: number): Manche[] {
  return localGetManches().filter((m) => m.phaseId === phaseId);
}

export function localCreateManche(dto: MancheCreateDTO): Manche {
  const phase = localGetPhasesRaw().find((p) => p.id === dto.phaseId);
  if (!phase) {
    throw new Error("Phase introuvable — une manche doit appartenir à une phase existante.");
  }
  const meta = getMeta();
  const manche: Manche = {
    id: meta.nextMancheId++,
    phaseId: dto.phaseId,
    label: dto.label.trim(),
  };
  saveMeta(meta);
  const all = localGetManchesRaw();
  all.push(manche);
  localSaveManches(all);
  return manche;
}

export function localUpdateManche(
  id: number,
  dto: MancheUpdateDTO,
  existing: Manche
): Manche {
  const updated: Manche = {
    ...existing,
    label: dto.label?.trim() ?? existing.label,
  };
  const all = localGetManchesRaw().map((m) => (m.id === id ? updated : m));
  localSaveManches(all);
  return updated;
}

export function localDeleteManche(id: number): void {
  localSaveResultatsManche(
    localGetResultatsMancheRaw().filter((r) => r.mancheId !== id)
  );
  writeJson(
    KEYS.mancheAssignments,
    localGetMancheAssignmentsRaw().filter((a) => a.mancheId !== id)
  );
  localSaveManches(localGetManchesRaw().filter((m) => m.id !== id));
}

/* ---------- Résultats manche ---------- */

function localGetResultatsMancheRaw(): ResultatManche[] {
  const raw = readJson<ResultatManche[]>(KEYS.resultatsManche, []);
  if (raw.length === 0) {
    localGetParticipantsRaw();
    localGetManches();
    const seeded = mockResultatsManche();
    localSaveResultatsManche(seeded);
    const meta = getMeta();
    meta.nextResultatMancheId = MOCK_META_IDS.nextResultatMancheId;
    saveMeta(meta);
    return seeded;
  }
  return raw;
}

function localSaveResultatsManche(resultats: ResultatManche[]): void {
  writeJson(KEYS.resultatsManche, resultats);
}

export function localGetResultatsByManche(mancheId: number): ResultatMancheView[] {
  const participants = localGetParticipantsRaw();
  return localGetResultatsMancheRaw()
    .filter((r) => r.mancheId === mancheId)
    .map((r) => {
      const p = participants.find((x) => x.id === r.participantId);
      return {
        ...r,
        numDossard: p?.numDossard ?? "—",
        prenom: p?.prenom ?? "",
        nom: p?.nom ?? "—",
      };
    });
}

export function localRecordDepart(
  participantId: number,
  mancheId: number
): ResultatManche {
  assertCheckpointEligible(participantId, mancheId, "dh-depart");
  const all = localGetResultatsMancheRaw();
  const now = new Date().toISOString();
  const idx = all.findIndex(
    (r) => r.participantId === participantId && r.mancheId === mancheId
  );

  if (idx >= 0) {
    if (all[idx].tempsDepart) {
      throw new Error("Départ déjà enregistré pour ce participant sur cette manche.");
    }
    all[idx] = { ...all[idx], tempsDepart: now };
    localSaveResultatsManche(all);
    return all[idx];
  }

  const meta = getMeta();
  const created: ResultatManche = {
    id: meta.nextResultatMancheId++,
    participantId,
    mancheId,
    tempsDepart: now,
    tempsArrive: null,
  };
  saveMeta(meta);
  all.push(created);
  localSaveResultatsManche(all);
  return created;
}

export function localRecordArriveDH(
  participantId: number,
  mancheId: number
): ResultatManche {
  const all = localGetResultatsMancheRaw();
  const idx = all.findIndex(
    (r) => r.participantId === participantId && r.mancheId === mancheId
  );
  if (idx === -1 || !all[idx].tempsDepart) {
    throw new Error("Aucun départ enregistré pour ce participant sur cette manche.");
  }
  if (all[idx].tempsArrive) {
    throw new Error("Arrivée déjà enregistrée pour ce participant sur cette manche.");
  }
  const now = new Date().toISOString();
  all[idx] = { ...all[idx], tempsArrive: now };
  localSaveResultatsManche(all);
  return all[idx];
}

export function localRecordArriveXC(
  participantId: number,
  mancheId: number
): ResultatManche {
  assertCheckpointEligible(participantId, mancheId, "xc-arrivee");
  const all = localGetResultatsMancheRaw();
  const now = new Date().toISOString();
  const idx = all.findIndex(
    (r) => r.participantId === participantId && r.mancheId === mancheId
  );

  if (idx >= 0) {
    if (all[idx].tempsArrive) {
      throw new Error("Arrivée déjà enregistrée pour ce participant sur cette manche.");
    }
    all[idx] = { ...all[idx], tempsArrive: now };
    localSaveResultatsManche(all);
    return all[idx];
  }

  const meta = getMeta();
  const created: ResultatManche = {
    id: meta.nextResultatMancheId++,
    participantId,
    mancheId,
    tempsDepart: null,
    tempsArrive: now,
  };
  saveMeta(meta);
  all.push(created);
  localSaveResultatsManche(all);
  return created;
}

/* ---------- Disqualifications ---------- */

function localGetDisqualificationsRaw(): ParticipantDisqualification[] {
  const raw = readJson<ParticipantDisqualification[]>(KEYS.disqualifications, []);
  if (raw.length === 0) {
    const seeded = mockDisqualifications();
    writeJson(KEYS.disqualifications, seeded);
    const meta = getMeta();
    meta.nextDisqualificationId = MOCK_META_IDS.nextDisqualificationId;
    saveMeta(meta);
    return seeded;
  }
  return raw;
}

export function localGetDisqualificationsByCourse(
  courseId: number
): ParticipantDisqualification[] {
  return localGetDisqualificationsRaw().filter((d) => d.courseId === courseId);
}

export function localGetAllResultatsManche(): ResultatManche[] {
  return localGetResultatsMancheRaw();
}

function assertCheckpointEligible(
  participantId: number,
  mancheId: number,
  mode: CheckpointMancheMode
): void {
  const manche = localGetManchesRaw().find((m) => m.id === mancheId);
  if (!manche) throw new Error("Manche introuvable.");
  const phase = localGetPhasesRaw().find((p) => p.id === manche.phaseId);
  if (!phase) throw new Error("Phase introuvable.");
  const phases = localGetPhasesRaw().filter((p) => p.courseId === phase.courseId);
  const manches = localGetManchesRaw();
  const resultats = localGetResultatsMancheRaw();
  const disqualifications = localGetDisqualificationsByCourse(phase.courseId);
  const assignments = localGetAssignmentsForPhase(manche.phaseId, manches);

  if (
    !canCheckParticipantOnManche(
      participantId,
      mancheId,
      manche.phaseId,
      phases,
      disqualifications,
      manches,
      resultats,
      mode,
      assignments
    )
  ) {
    throw new Error(
      "Participant non éligible pour cette manche (disqualifié ou manche déjà traitée)."
    );
  }
}

export function localDisqualifyParticipant(input: {
  participantId: number;
  courseId: number;
  fromPhaseId: number;
  mancheId?: number;
  reason?: string;
}): ParticipantDisqualification {
  const all = localGetDisqualificationsRaw();
  const existing = all.find((d) => d.participantId === input.participantId);
  if (existing) {
    throw new Error("Ce participant est déjà disqualifié.");
  }
  const meta = getMeta();
  const dq: ParticipantDisqualification = {
    id: meta.nextDisqualificationId++,
    participantId: input.participantId,
    courseId: input.courseId,
    fromPhaseId: input.fromPhaseId,
    mancheId: input.mancheId,
    reason: input.reason?.trim() || undefined,
    at: new Date().toISOString(),
  };
  saveMeta(meta);
  all.push(dq);
  writeJson(KEYS.disqualifications, all);
  return dq;
}

export function localRevokeDisqualification(participantId: number): void {
  writeJson(
    KEYS.disqualifications,
    localGetDisqualificationsRaw().filter((d) => d.participantId !== participantId)
  );
}

/* ---------- Affectations poules (XC) ---------- */

function localGetMancheAssignmentsRaw(): MancheAssignment[] {
  const raw = readJson<MancheAssignment[]>(KEYS.mancheAssignments, []);
  if (raw.length === 0) {
    const seeded = mockMancheAssignments();
    writeJson(KEYS.mancheAssignments, seeded);
    return seeded;
  }
  return raw;
}

export function localGetMancheAssignments(): MancheAssignment[] {
  return localGetMancheAssignmentsRaw();
}

export function localGetAssignmentsForPhase(
  phaseId: number,
  manches: Manche[]
): MancheAssignment[] {
  const mancheIds = new Set(
    manches.filter((m) => m.phaseId === phaseId).map((m) => m.id)
  );
  return localGetMancheAssignmentsRaw().filter((a) => mancheIds.has(a.mancheId));
}

/** Réinitialise les données de démo (console : `localResetDemoData()`) */
export function localResetDemoData(): void {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  saveMeta({ ...MOCK_META_IDS });
  localGetCourses();
  localGetCategoriesDetailed();
  localGetPhases();
  localGetManches();
  localGetParticipantsRaw();
  localGetResultatsMancheRaw();
  localGetDisqualificationsRaw();
  localGetMancheAssignmentsRaw();
}
