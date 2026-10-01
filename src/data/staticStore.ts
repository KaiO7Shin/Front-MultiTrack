import {
  canCheckParticipantOnManche,
  formatMs,
  type CheckpointMancheMode,
} from "@/lib/raceRanking";
import type {
  ApiRow,
  AssignedManche,
  Category,
  CategoryCreateDTO,
  CategoryGenre,
  CategoryUpdateDTO,
  ControlPointConfig,
  ControlPointCreateDTO,
  ControlPointUpdateDTO,
  Course,
  CourseCreateDTO,
  CourseStatus,
  CourseUpdateDTO,
  Manche,
  MancheAssignment,
  MancheCreateDTO,
  MancheUpdateDTO,
  ParticipantCreateDTO,
  ParticipantDisqualification,
  ParticipantProjection,
  ParticipantResponse,
  ParticipantStatus,
  ParticipantUpdateDTO,
  Phase,
  PhaseCreateDTO,
  PhaseUpdateDTO,
  Pointeur,
  PointeurCreateDTO,
  PointeurUpdateDTO,
  RenderResponse,
  ResultatManche,
  ResultatMancheView,
  TypeCourse,
  TypeVelo,
} from "@/lib/type";
import { normalizeCourseType } from "@/lib/utils";

/**
 * Jeu de données du back-office, tenu en mémoire pour la session.
 * Aucun appel réseau : les services commentent l'API et passent par ce module.
 */

function fail(message: string): never {
  const error = new Error(message) as Error & {
    response?: { data?: { message?: string } };
  };
  error.response = { data: { message } };
  throw error;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

let seq = 1000;
function nextId(): number {
  seq += 1;
  return seq;
}

function isoShift(base: number, deltaMs: number): string {
  return new Date(base + deltaMs).toISOString();
}

const now = Date.now();
const liveStart = isoShift(now, -2 * 60 * 60 * 1000);
const finishedStart = isoShift(now, -26 * 60 * 60 * 1000);

/** Sentier / Vélo : mêmes formats que l'événement, libellés renommés. Tous en trail (pas de phase). */
const typesCourse: TypeCourse[] = [
  { id: 1, libelle: "SENTIER", bibStart: 1, bibEnd: 499 },
  { id: 2, libelle: "VELO", bibStart: 500, bibEnd: 999 },
];

const typesVelo: TypeVelo[] = [
  { id: 1, libelle: "TOUT SUSPENDU" },
  { id: 2, libelle: "SEMI-RIGIDE" },
];

const categories: Category[] = [
  { id: 1, alias: "Eveil H", genre: "Homme", ageMin: 6, ageMax: 9 },
  { id: 2, alias: "Eveil F", genre: "Femme", ageMin: 6, ageMax: 9 },
  { id: 3, alias: "Espoir H", genre: "Homme", ageMin: 10, ageMax: 12 },
  { id: 4, alias: "Espoir F", genre: "Femme", ageMin: 10, ageMax: 12 },
  { id: 5, alias: "Cadet H", genre: "Homme", ageMin: 13, ageMax: 15 },
  { id: 6, alias: "Cadet F", genre: "Femme", ageMin: 13, ageMax: 15 },
  { id: 7, alias: "Junior H", genre: "Homme", ageMin: 16, ageMax: 19 },
  { id: 8, alias: "Junior F", genre: "Femme", ageMin: 16, ageMax: 19 },
  { id: 9, alias: "Senior H", genre: "Homme", ageMin: 20, ageMax: 39 },
  { id: 10, alias: "Senior F", genre: "Femme", ageMin: 20, ageMax: 39 },
  { id: 11, alias: "Confirme H", genre: "Homme", ageMin: 40, ageMax: 45 },
  { id: 12, alias: "Confirme F", genre: "Femme", ageMin: 40, ageMax: 45 },
  { id: 13, alias: "Veteran H", genre: "Homme", ageMin: 46, ageMax: null },
  { id: 14, alias: "Veteran F", genre: "Femme", ageMin: 46, ageMax: null },
  { id: 15, alias: "Libre H", genre: "Homme", ageMin: 0, ageMax: null },
  { id: 16, alias: "Libre F", genre: "Femme", ageMin: 0, ageMax: null },
];

function trailCourse(
  id: number,
  name: string,
  typeCourseId: number,
  distanceKm: number,
  elevation: number,
  bibStart: number,
  extra: Partial<Course> = {}
): Course {
  return {
    id,
    name,
    type: "TRAIL",
    typeCourseId,
    distanceKm,
    elevation,
    status: "A venir",
    checkpoints: 0,
    nomSequence: `seq_course_${id}`,
    bibStart,
    bibEnd: bibStart + 79,
    ...extra,
  };
}

const courses: Course[] = [
  // Trail (SENTIER)
  trailCourse(3, "Challenge Parent-Enfant — Trail 10 km", 1, 10, 210, 161),
  trailCourse(1, "Challenge Initiation — Trail 12 km", 1, 12, 310, 1, {
    status: "En cours",
    startAt: liveStart,
    checkpoints: 2,
  }),
  trailCourse(2, "Challenge Explorateur — Trail 16 km", 1, 16, 470, 81),
  trailCourse(4, "Challenge Suprême — Trail 25 km", 1, 25, 570, 241),
  trailCourse(5, "Challenge des Amoureux — Trail 25 km", 1, 25, 570, 321),
  // VTT (VELO)
  trailCourse(6, "Challenge Parent-Enfant — VTT 10 km", 2, 10, 210, 500),
  trailCourse(7, "Challenge Suprême — VTT 25 km", 2, 25, 570, 581, {
    status: "Terminee",
    startAt: finishedStart,
    checkpoints: 2,
  }),
  trailCourse(8, "Challenge des Amoureux — VTT 25 km", 2, 25, 570, 661),
];

const phases: Phase[] = [];
const manches: Manche[] = [];

const controlPoints: ControlPointConfig[] = [
  { id: 11, courseId: 1, label: "Belvedere", numero: 1, utilisateurId: 10 },
  { id: 12, courseId: 1, label: "Source", numero: 2, utilisateurId: 11 },
  { id: 71, courseId: 7, label: "Plateau", numero: 1 },
  { id: 72, courseId: 7, label: "Gue", numero: 2 },
];

function participant(partial: ParticipantProjection): ParticipantProjection {
  return partial;
}

const COURSE_INITIATION = "Challenge Initiation — Trail 12 km";
const COURSE_SUPREME_VTT = "Challenge Suprême — VTT 25 km";

const participants: ParticipantProjection[] = [
  participant({
    id: 11,
    nom: "Morel",
    prenom: "Lina",
    numDossard: "18",
    genre: "Femme",
    aliasCategorie: "Senior F",
    courseId: 1,
    courseLibelle: COURSE_INITIATION,
    nomCourse: COURSE_INITIATION,
    statut: "En course",
    dateNaissance: "1996-11-03",
    tailleTShirt: "M",
    email: "lina.morel@email.com",
    contact: "+261 34 00 11 018",
  }),
  participant({
    id: 12,
    nom: "Elori",
    prenom: "Marc",
    numDossard: "7",
    genre: "Homme",
    aliasCategorie: "Confirme H",
    courseId: 1,
    courseLibelle: COURSE_INITIATION,
    nomCourse: COURSE_INITIATION,
    statut: "Finisher",
    dateNaissance: "1984-02-20",
    tailleTShirt: "L",
    email: "marc.elori@email.com",
    contact: "+261 32 00 11 007",
  }),
  participant({
    id: 13,
    nom: "Ravel",
    prenom: "Aina",
    numDossard: "21",
    genre: "Homme",
    aliasCategorie: "Senior H",
    courseId: 1,
    courseLibelle: COURSE_INITIATION,
    nomCourse: COURSE_INITIATION,
    statut: "Present",
    dateNaissance: "1992-04-12",
    tailleTShirt: "XL",
    email: "aina.ravel@email.com",
    contact: "+261 33 00 11 021",
  }),
  participant({
    id: 14,
    nom: "Noro",
    prenom: "Keza",
    numDossard: "4",
    genre: "Femme",
    aliasCategorie: "Eveil F",
    courseId: 1,
    courseLibelle: COURSE_INITIATION,
    nomCourse: COURSE_INITIATION,
    statut: "Inscrit",
    dateNaissance: "2018-06-15",
    tailleTShirt: "XS",
    email: "parent.noro@email.com",
    contact: "+261 34 00 11 004",
  }),
  participant({
    id: 15,
    nom: "Rakoto",
    prenom: "Hery",
    numDossard: "33",
    genre: "Homme",
    aliasCategorie: "Senior H",
    courseId: 1,
    courseLibelle: COURSE_INITIATION,
    nomCourse: COURSE_INITIATION,
    statut: "Attente validation",
    dateNaissance: "1995-08-22",
    tailleTShirt: "L",
    email: "hery.rakoto@email.com",
    contact: "+261 32 11 22 033",
  }),
  participant({
    id: 16,
    nom: "Razafy",
    prenom: "Soa",
    numDossard: "34",
    genre: "Femme",
    aliasCategorie: "Senior F",
    courseId: 1,
    courseLibelle: COURSE_INITIATION,
    nomCourse: COURSE_INITIATION,
    statut: "Attente validation",
    dateNaissance: "1998-01-09",
    tailleTShirt: "M",
    email: "soa.razafy@email.com",
    contact: "+261 33 44 55 034",
  }),
  participant({
    id: 71,
    nom: "Ando",
    prenom: "Joel",
    numDossard: "590",
    genre: "Homme",
    aliasCategorie: "Senior H",
    courseId: 7,
    courseLibelle: COURSE_SUPREME_VTT,
    nomCourse: COURSE_SUPREME_VTT,
    statut: "Finisher",
    dateNaissance: "1990-09-14",
    tailleTShirt: "L",
    email: "joel.ando@email.com",
    contact: "+261 34 00 71 590",
  }),
  participant({
    id: 72,
    nom: "Solon",
    prenom: "Mira",
    numDossard: "604",
    genre: "Femme",
    aliasCategorie: "Confirme F",
    courseId: 7,
    courseLibelle: COURSE_SUPREME_VTT,
    nomCourse: COURSE_SUPREME_VTT,
    statut: "Finisher",
    dateNaissance: "1982-04-04",
    tailleTShirt: "S",
    email: "mira.solon@email.com",
    contact: "+261 32 00 71 604",
  }),
];

const resultats: ResultatManche[] = [];
const assignments: MancheAssignment[] = [];

const disqualifications: ParticipantDisqualification[] = [];

type TrailPassage = {
  participantId: number;
  controlPointId: number | null;
  at: string;
};

const trailPassages: TrailPassage[] = [
  { participantId: 11, controlPointId: 11, at: isoShift(now, -70 * 60 * 1000) },
  { participantId: 12, controlPointId: 11, at: isoShift(now, -100 * 60 * 1000) },
  { participantId: 12, controlPointId: 12, at: isoShift(now, -55 * 60 * 1000) },
  { participantId: 12, controlPointId: null, at: isoShift(now, -20 * 60 * 1000) },
  { participantId: 71, controlPointId: 71, at: isoShift(now, -20 * 60 * 60 * 1000) },
  { participantId: 71, controlPointId: 72, at: isoShift(now, -16 * 60 * 60 * 1000) },
  { participantId: 71, controlPointId: null, at: isoShift(now, -12 * 60 * 60 * 1000) },
  { participantId: 72, controlPointId: 71, at: isoShift(now, -19 * 60 * 60 * 1000) },
  { participantId: 72, controlPointId: 72, at: isoShift(now, -15 * 60 * 60 * 1000) },
  { participantId: 72, controlPointId: null, at: isoShift(now, -11 * 60 * 60 * 1000) },
];

function mancheAssignmentView(mancheId: number): AssignedManche | null {
  const manche = manches.find((m) => m.id === mancheId);
  if (!manche) return null;
  const phase = phases.find((p) => p.id === manche.phaseId);
  if (!phase) return null;
  const course = courses.find((c) => c.id === phase.courseId);
  if (!course) return null;
  return {
    id: manche.id,
    label: manche.label,
    phaseId: phase.id,
    phaseLabel: phase.label,
    courseId: course.id,
    courseLabel: course.name,
    courseType: course.type,
  };
}

const pointeurs: Pointeur[] = [
  {
    id: 10,
    libelle: "Pointeur belvedere",
    role: 1,
    hasTrailControlPoint: true,
    trailControlPointId: 11,
    assignedManches: [],
    passcode: "BELVEDERE",
  },
  {
    id: 11,
    libelle: "Pointeur source",
    role: 1,
    hasTrailControlPoint: true,
    trailControlPointId: 12,
    assignedManches: [],
    passcode: "SOURCE",
  },
];

function requireCourse(id: number): Course {
  const course = courses.find((c) => c.id === id);
  if (!course) fail("Course introuvable");
  return course;
}

function syncCheckpointCount(courseId: number) {
  const course = courses.find((c) => c.id === courseId);
  if (!course) return;
  course.checkpoints = controlPoints.filter((cp) => cp.courseId === courseId).length;
}

function ageAt(birthDate: string): number {
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) fail("Date de naissance invalide");
  const on = new Date();
  let age = on.getFullYear() - birth.getFullYear();
  const month = on.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && on.getDate() < birth.getDate())) age -= 1;
  return age;
}

function categoryFor(genre: CategoryGenre, birthDate: string): Category {
  const age = ageAt(birthDate);
  const match = categories.find(
    (c) =>
      c.genre === genre &&
      age >= c.ageMin &&
      (c.ageMax == null || age <= c.ageMax)
  );
  if (!match) fail("Aucune catégorie ne correspond à cet âge et ce genre.");
  return match;
}

/** Dossard CHAR(4) : 1er chiffre = id course, 3 suivants = séquence. */
function nextBib(course: Course): string {
  if (course.id < 1 || course.id > 9) {
    fail("L'identifiant de course doit être entre 1 et 9 pour un dossard à 4 chiffres.");
  }
  const usedSuffixes = new Set(
    participants
      .filter((p) => p.courseId === course.id)
      .map((p) => {
        const bib = String(p.numDossard).padStart(4, "0");
        return Number(bib.slice(1));
      })
      .filter((n) => Number.isFinite(n) && n >= 1)
  );
  for (let seq = 1; seq <= 999; seq += 1) {
    if (!usedSuffixes.has(seq)) {
      return `${course.id}${String(seq).padStart(3, "0")}`;
    }
  }
  fail("Plus aucun dossard disponible pour cette course.");
}

function findParticipantByBib(bib: string, courseId?: number): ParticipantProjection {
  const matches = participants.filter(
    (p) =>
      p.numDossard === String(bib) &&
      (courseId == null || p.courseId === courseId)
  );
  if (matches.length === 0) fail("Dossard introuvable");
  if (matches.length > 1) fail("Plusieurs participants portent ce dossard.");
  return matches[0];
}

function renameCourseOnParticipants(course: Course) {
  for (const p of participants) {
    if (p.courseId !== course.id) continue;
    p.courseLibelle = course.name;
    p.nomCourse = course.name;
  }
}

function coursePhases(courseId: number): Phase[] {
  return phases.filter((p) => p.courseId === courseId);
}

function courseManches(courseId: number): Manche[] {
  const phaseIds = new Set(coursePhases(courseId).map((p) => p.id));
  return manches.filter((m) => phaseIds.has(m.phaseId));
}

function dropManche(mancheId: number) {
  const index = manches.findIndex((m) => m.id === mancheId);
  if (index >= 0) manches.splice(index, 1);
  for (let i = resultats.length - 1; i >= 0; i -= 1) {
    if (resultats[i].mancheId === mancheId) resultats.splice(i, 1);
  }
  for (let i = assignments.length - 1; i >= 0; i -= 1) {
    if (assignments[i].mancheId === mancheId) assignments.splice(i, 1);
  }
  for (const pointeur of pointeurs) {
    pointeur.assignedManches = pointeur.assignedManches.filter((m) => m.id !== mancheId);
  }
}

export type PhaseRankingInput = {
  phase: Phase;
  phases: Phase[];
  manches: Manche[];
  participants: ParticipantProjection[];
  resultats: ResultatManche[];
  disqualifications: ParticipantDisqualification[];
  assignments: MancheAssignment[];
};

function toResponse(p: ParticipantProjection): ParticipantResponse {
  return {
    numDossard: p.numDossard,
    nom: p.nom,
    prenom: p.prenom,
    genre: p.genre,
    categorie: p.aliasCategorie,
    statut: p.statut,
  };
}

function parseBirth(raw: string): string {
  const value = raw.trim();
  const fr = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  if (fr) {
    const day = fr[1].padStart(2, "0");
    const month = fr[2].padStart(2, "0");
    return `${fr[3]}-${month}-${day}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  fail(`Date de naissance invalide : ${raw}`);
}

function parseGenre(raw: string): CategoryGenre {
  const value = raw.trim().toLowerCase();
  if (value === "homme" || value === "h" || value === "m" || value === "masculin") {
    return "Homme";
  }
  if (value === "femme" || value === "f" || value === "feminin" || value === "féminin") {
    return "Femme";
  }
  fail(`Genre invalide : ${raw}`);
}

export const staticStore = {
  listTypesCourse(): TypeCourse[] {
    return clone(typesCourse);
  },

  listTypesVelo(): TypeVelo[] {
    return clone(typesVelo);
  },

  listCourses(): Course[] {
    return clone(courses);
  },

  createCourse(dto: CourseCreateDTO): Course {
    const typeCourse = typesCourse.find((t) => t.id === dto.typeCourseId);
    if (!typeCourse) fail("Type de course inconnu.");
    if (!dto.libelle.trim()) fail("Le libellé de la course est requis.");
    const id = nextId();
    const course: Course = {
      id,
      name: dto.libelle.trim(),
      type: normalizeCourseType(typeCourse.libelle),
      typeCourseId: typeCourse.id,
      distanceKm: dto.distance,
      elevation: dto.totalDenivele,
      status: "A venir",
      checkpoints: 0,
      dureeBarriereHoraire: dto.dureeBarriereHoraire,
      nomSequence: `seq_course_${id}`,
      bibStart: dto.bibStart ?? typeCourse.bibStart,
      bibEnd: dto.bibEnd ?? typeCourse.bibEnd,
    };
    courses.push(course);
    return clone(course);
  },

  updateCourse(id: number, dto: CourseUpdateDTO): Course {
    const course = requireCourse(id);
    if (dto.libelle != null) course.name = dto.libelle.trim();
    if (dto.typeCourseId != null) {
      const typeCourse = typesCourse.find((t) => t.id === dto.typeCourseId);
      if (!typeCourse) fail("Type de course inconnu.");
      course.type = normalizeCourseType(typeCourse.libelle);
      course.typeCourseId = typeCourse.id;
    }
    if (dto.distance != null) course.distanceKm = dto.distance;
    if (dto.totalDenivele != null) course.elevation = dto.totalDenivele;
    if (dto.dureeBarriereHoraire != null) {
      course.dureeBarriereHoraire = dto.dureeBarriereHoraire;
    }
    if (dto.bibStart != null) course.bibStart = dto.bibStart;
    if (dto.bibEnd != null) course.bibEnd = dto.bibEnd;
    renameCourseOnParticipants(course);
    return clone(course);
  },

  deleteCourse(id: number): void {
    const index = courses.findIndex((c) => c.id === id);
    if (index < 0) fail("Course introuvable");
    courses.splice(index, 1);
    for (const manche of [...courseManches(id)]) dropManche(manche.id);
    for (let i = phases.length - 1; i >= 0; i -= 1) {
      if (phases[i].courseId === id) phases.splice(i, 1);
    }
    for (let i = controlPoints.length - 1; i >= 0; i -= 1) {
      if (controlPoints[i].courseId === id) controlPoints.splice(i, 1);
    }
    const removed = new Set(
      participants.filter((p) => p.courseId === id).map((p) => p.id)
    );
    for (let i = participants.length - 1; i >= 0; i -= 1) {
      if (removed.has(participants[i].id)) participants.splice(i, 1);
    }
    for (let i = disqualifications.length - 1; i >= 0; i -= 1) {
      if (disqualifications[i].courseId === id) disqualifications.splice(i, 1);
    }
    for (let i = trailPassages.length - 1; i >= 0; i -= 1) {
      if (removed.has(trailPassages[i].participantId)) trailPassages.splice(i, 1);
    }
  },

  changeRaceStatus(
    raceId: number,
    newStatus: CourseStatus
  ): { raceId: number; startAt?: string; status: CourseStatus } {
    const course = requireCourse(raceId);
    course.status = newStatus;
    if (newStatus === "En cours" && !course.startAt) {
      course.startAt = new Date().toISOString();
    }
    return { raceId, startAt: course.startAt, status: course.status };
  },

  listCategories(): Category[] {
    return clone(categories);
  },

  createCategory(dto: CategoryCreateDTO): Category {
    const alias = dto.alias.trim();
    if (!alias) fail("L'alias est requis.");
    if (
      categories.some((c) => c.alias.toUpperCase() === alias.toUpperCase())
    ) {
      fail(`Une catégorie avec l'alias « ${alias} » existe déjà.`);
    }
    const created: Category = {
      id: nextId(),
      alias,
      genre: dto.genre,
      ageMin: dto.ageMin,
      ageMax: dto.ageMax,
    };
    categories.push(created);
    return clone(created);
  },

  updateCategory(id: number, dto: CategoryUpdateDTO): Category {
    const category = categories.find((c) => c.id === id);
    if (!category) fail("Catégorie introuvable");
    if (dto.alias != null) {
      const alias = dto.alias.trim();
      if (
        categories.some(
          (c) => c.id !== id && c.alias.toUpperCase() === alias.toUpperCase()
        )
      ) {
        fail(`Une catégorie avec l'alias « ${alias} » existe déjà.`);
      }
      const previous = category.alias;
      category.alias = alias;
      for (const p of participants) {
        if (p.aliasCategorie === previous) p.aliasCategorie = alias;
      }
    }
    if (dto.genre != null) category.genre = dto.genre;
    if (dto.ageMin != null) category.ageMin = dto.ageMin;
    if (dto.ageMax !== undefined) category.ageMax = dto.ageMax;
    return clone(category);
  },

  deleteCategory(id: number): void {
    const category = categories.find((c) => c.id === id);
    if (!category) fail("Catégorie introuvable");
    if (participants.some((p) => p.aliasCategorie === category.alias)) {
      fail("Des participants sont encore rattachés à cette catégorie.");
    }
    const index = categories.findIndex((c) => c.id === id);
    categories.splice(index, 1);
  },

  listParticipants(raceId: number): ParticipantProjection[] {
    return clone(participants.filter((p) => p.courseId === raceId));
  },

  listAllParticipants(): ParticipantProjection[] {
    return clone(participants);
  },

  getParticipantById(id: number): ParticipantProjection | null {
    const found = participants.find((p) => p.id === id);
    return found ? clone(found) : null;
  },

  createParticipant(
    dto: ParticipantCreateDTO
  ): RenderResponse<ParticipantResponse> {
    const course = requireCourse(dto.courseChoisieId);
    const taille = dto.tailleTShirt?.trim().toUpperCase();
    if (!taille) fail("La taille de t-shirt est requise.");
    const category = categoryFor(dto.genre, dto.dateNaissance);
    const created = participant({
      id: nextId(),
      nom: dto.nom.trim(),
      prenom: (dto.prenom ?? "").trim(),
      numDossard: nextBib(course),
      genre: dto.genre,
      aliasCategorie: category.alias,
      courseId: course.id,
      courseLibelle: course.name,
      nomCourse: course.name,
      statut: "Inscrit",
      dateNaissance: dto.dateNaissance,
      tailleTShirt: taille,
    });
    participants.push(created);
    return {
      code: 200,
      message: `Participant enregistré avec le dossard ${created.numDossard}.`,
      data: toResponse(created),
    };
    },

    updateParticipant(dto: ParticipantUpdateDTO): RenderResponse<ParticipantResponse> {
    const current = findParticipantByBib(dto.bibNumber);
    const course = requireCourse(dto.courseChoisieId);
    const bibTaken = participants.some(
      (p) =>
        p.id !== current.id &&
        p.courseId === course.id &&
        p.numDossard === dto.numDossard
    );
    if (bibTaken) fail("Ce dossard est déjà utilisé sur cette course.");
    const category = categoryFor(dto.genre, dto.dateNaissance);
    current.nom = dto.nom.trim();
    current.prenom = dto.prenom.trim();
    current.numDossard = dto.numDossard;
    current.dateNaissance = dto.dateNaissance;
    current.genre = dto.genre;
    current.courseId = course.id;
    current.courseLibelle = course.name;
    current.nomCourse = course.name;
    current.aliasCategorie = category.alias;
    current.statut = dto.statut;
    if (dto.tailleTShirt !== undefined) {
      const taille = dto.tailleTShirt.trim().toUpperCase();
      if (!taille) fail("La taille de t-shirt est requise.");
      current.tailleTShirt = taille;
    }
    if (dto.statut === "DSQ") {
      this.disqualify({
        participantId: current.id,
        courseId: course.id,
        reason: "Disqualification",
      });
    } else {
      this.revokeDisqualification(current.id, false);
    }
    return {
      code: 200,
      message: "Participant mis à jour.",
      data: toResponse(current),
    };
  },

  changeParticipantStatus(bibNumber: string, newStatus: ParticipantStatus): void {
    const current = findParticipantByBib(bibNumber);
    current.statut = newStatus;
    if (newStatus === "DSQ") {
      this.disqualify({
        participantId: current.id,
        courseId: current.courseId,
      });
    } else {
      this.revokeDisqualification(current.id, false);
    }
  },

  deleteParticipant(id: number): RenderResponse<null> {
    const index = participants.findIndex((p) => p.id === id);
    if (index < 0) fail("Participant introuvable.");
    const [removed] = participants.splice(index, 1);
    this.revokeDisqualification(removed.id, false);
    return {
      code: 200,
      message: "Participant supprimé avec succès.",
      data: null,
    };
  },

  disqualify(input: {
    participantId: number;
    courseId: number;
    currentPhaseId?: number;
    mancheId?: number;
    reason?: string;
  }): void {
    const current = participants.find((p) => p.id === input.participantId);
    if (!current) fail("Participant introuvable");
    current.statut = "DSQ";
    const existing = disqualifications.find(
      (d) => d.participantId === input.participantId
    );
    const fromPhaseId =
      input.currentPhaseId ?? coursePhases(input.courseId)[0]?.id ?? 0;
    if (existing) {
      existing.courseId = input.courseId;
      existing.fromPhaseId = fromPhaseId;
      existing.mancheId = input.mancheId;
      existing.reason = input.reason;
      existing.at = new Date().toISOString();
      return;
    }
    disqualifications.push({
      id: nextId(),
      participantId: input.participantId,
      courseId: input.courseId,
      fromPhaseId,
      mancheId: input.mancheId,
      reason: input.reason,
      at: new Date().toISOString(),
    });
  },

  revokeDisqualification(participantId: number, restoreStatus = true): void {
    const index = disqualifications.findIndex(
      (d) => d.participantId === participantId
    );
    if (index >= 0) disqualifications.splice(index, 1);
    if (!restoreStatus) return;
    const current = participants.find((p) => p.id === participantId);
    if (!current || current.statut !== "DSQ") return;
    const hasResult = resultats.some((r) => r.participantId === participantId);
    current.statut = hasResult ? "En course" : "Present";
  },

  listPhases(courseId: number): Phase[] {
    return clone(coursePhases(courseId));
  },

  createPhase(dto: PhaseCreateDTO): Phase {
    requireCourse(dto.courseId);
    if (!dto.label.trim()) fail("Le libellé de la phase est requis.");
    const created: Phase = {
      id: nextId(),
      courseId: dto.courseId,
      label: dto.label.trim(),
    };
    phases.push(created);
    return clone(created);
  },

  updatePhase(id: number, dto: PhaseUpdateDTO): Phase {
    const phase = phases.find((p) => p.id === id);
    if (!phase) fail("Phase introuvable");
    if (dto.label != null) phase.label = dto.label.trim();
    for (const pointeur of pointeurs) {
      pointeur.assignedManches = pointeur.assignedManches.map((m) =>
        m.phaseId === id ? { ...m, phaseLabel: phase.label } : m
      );
    }
    return clone(phase);
  },

  deletePhase(id: number): void {
    const index = phases.findIndex((p) => p.id === id);
    if (index < 0) fail("Phase introuvable");
    for (const manche of manches.filter((m) => m.phaseId === id)) {
      dropManche(manche.id);
    }
    phases.splice(index, 1);
  },

  listManches(phaseId: number): Manche[] {
    return clone(manches.filter((m) => m.phaseId === phaseId));
  },

  createManche(dto: MancheCreateDTO): Manche {
    if (!phases.some((p) => p.id === dto.phaseId)) fail("Phase introuvable");
    if (!dto.label.trim()) fail("Le libellé de la manche est requis.");
    const created: Manche = {
      id: nextId(),
      phaseId: dto.phaseId,
      label: dto.label.trim(),
    };
    manches.push(created);
    return clone(created);
  },

  updateManche(id: number, dto: MancheUpdateDTO): Manche {
    const manche = manches.find((m) => m.id === id);
    if (!manche) fail("Manche introuvable");
    if (dto.label != null) manche.label = dto.label.trim();
    for (const pointeur of pointeurs) {
      pointeur.assignedManches = pointeur.assignedManches.map((m) =>
        m.id === id ? { ...m, label: manche.label } : m
      );
    }
    return clone(manche);
  },

  deleteManche(id: number): void {
    if (!manches.some((m) => m.id === id)) fail("Manche introuvable");
    dropManche(id);
  },

  listResultats(mancheId: number): ResultatMancheView[] {
    return resultats
      .filter((r) => r.mancheId === mancheId)
      .map((r) => {
        const p = participants.find((item) => item.id === r.participantId);
        return {
          ...r,
          numDossard: p?.numDossard ?? "",
          prenom: p?.prenom ?? "",
          nom: p?.nom ?? "",
        };
      });
  },

  eligibleParticipants(
    courseId: number,
    phaseId: number,
    mancheId: number,
    mode: CheckpointMancheMode
  ): ParticipantProjection[] {
    const coursePhaseList = coursePhases(courseId);
    const courseMancheList = courseManches(courseId);
    return clone(
      participants.filter(
        (p) =>
          p.courseId === courseId &&
          p.statut !== "DNS" &&
          canCheckParticipantOnManche(
            p.id,
            mancheId,
            phaseId,
            coursePhaseList,
            disqualifications,
            courseMancheList,
            resultats,
            mode,
            assignments
          )
      )
    );
  },

  recordDepart(
    participantId: number,
    mancheId: number,
    recordedAt: string
  ): ResultatManche {
    const existing = resultats.find(
      (r) => r.participantId === participantId && r.mancheId === mancheId
    );
    if (existing?.tempsDepart) fail("Le départ est déjà enregistré.");
    const row: ResultatManche = existing ?? {
      id: nextId(),
      participantId,
      mancheId,
      tempsDepart: recordedAt,
      tempsArrive: null,
    };
    row.tempsDepart = recordedAt;
    if (!existing) resultats.push(row);
    const current = participants.find((p) => p.id === participantId);
    if (current && (current.statut === "Inscrit" || current.statut === "Present")) {
      current.statut = "En course";
    }
    return clone(row);
  },

  recordArrive(
    participantId: number,
    mancheId: number,
    recordedAt: string,
    mode: "DH" | "XC"
  ): ResultatManche {
    let row = resultats.find(
      (r) => r.participantId === participantId && r.mancheId === mancheId
    );
    if (mode === "DH" && !row?.tempsDepart) fail("Le départ n'est pas enregistré.");
    if (row?.tempsArrive) fail("L'arrivée est déjà enregistrée.");
    if (!row) {
      row = {
        id: nextId(),
        participantId,
        mancheId,
        tempsDepart: null,
        tempsArrive: recordedAt,
      };
      resultats.push(row);
    } else {
      row.tempsArrive = recordedAt;
    }
    if (mode === "XC" && !assignments.some(
      (a) => a.participantId === participantId && a.mancheId === mancheId
    )) {
      assignments.push({ participantId, mancheId });
    }
    const current = participants.find((p) => p.id === participantId);
    if (current && current.statut !== "DSQ" && current.statut !== "DNF") {
      current.statut = "En course";
    }
    return clone(row);
  },

  cancelResultat(participantId: number, mancheId: number): void {
    const index = resultats.findIndex(
      (r) => r.participantId === participantId && r.mancheId === mancheId
    );
    if (index >= 0) resultats.splice(index, 1);
  },

  phaseRankingInput(courseId: number, phaseId: number): PhaseRankingInput {
    const phase = phases.find((p) => p.id === phaseId && p.courseId === courseId);
    if (!phase) fail("Phase introuvable");
    const phaseList = coursePhases(courseId);
    const mancheList = courseManches(courseId);
    const mancheIds = new Set(mancheList.map((m) => m.id));
    return {
      phase: clone(phase),
      phases: clone(phaseList),
      manches: clone(mancheList),
      participants: clone(participants.filter((p) => p.courseId === courseId)),
      resultats: clone(resultats.filter((r) => mancheIds.has(r.mancheId))),
      disqualifications: clone(
        disqualifications.filter((d) => d.courseId === courseId)
      ),
      assignments: clone(assignments.filter((a) => mancheIds.has(a.mancheId))),
    };
  },

  listControlPoints(courseId: number): ControlPointConfig[] {
    return clone(
      controlPoints
        .filter((cp) => cp.courseId === courseId)
        .sort((a, b) => a.numero - b.numero)
    );
  },

  createControlPoint(dto: ControlPointCreateDTO): ControlPointConfig {
    requireCourse(dto.courseId);
    const created: ControlPointConfig = {
      id: nextId(),
      courseId: dto.courseId,
      label: dto.label.trim(),
      numero: dto.numero,
      passcode: dto.passcode?.trim() || `CP${dto.numero}`,
    };
    controlPoints.push(created);
    syncCheckpointCount(dto.courseId);
    return clone(created);
  },

  updateControlPoint(id: number, dto: ControlPointUpdateDTO): ControlPointConfig {
    const point = controlPoints.find((cp) => cp.id === id);
    if (!point) fail("Point de contrôle introuvable");
    if (dto.label != null) point.label = dto.label.trim();
    if (dto.numero != null) point.numero = dto.numero;
    if (dto.passcode != null) point.passcode = dto.passcode;
    return clone(point);
  },

  deleteControlPoint(id: number): void {
    const point = controlPoints.find((cp) => cp.id === id);
    if (!point) fail("Point de contrôle introuvable");
    const index = controlPoints.findIndex((cp) => cp.id === id);
    controlPoints.splice(index, 1);
    for (let i = trailPassages.length - 1; i >= 0; i -= 1) {
      if (trailPassages[i].controlPointId === id) trailPassages.splice(i, 1);
    }
    syncCheckpointCount(point.courseId);
  },

  recordTrailCheckpoint(
    bibNumber: string,
    controlPointId: number | null
  ): { where: "PC" | "FINISHER"; ts: number; cpLabel?: string } {
    const at = new Date().toISOString();
    if (controlPointId) {
      const point = controlPoints.find((cp) => cp.id === controlPointId);
      if (!point) fail("Point de contrôle introuvable");
      const current = findParticipantByBib(bibNumber, point.courseId);
      trailPassages.push({
        participantId: current.id,
        controlPointId: point.id,
        at,
      });
      if (current.statut === "Inscrit" || current.statut === "Present") {
        current.statut = "En course";
      }
      return { where: "PC", ts: Date.parse(at), cpLabel: point.label };
    }

    const current = findParticipantByBib(bibNumber);
    const course = requireCourse(current.courseId);
    if (course.type !== "TRAIL") {
      fail("L'arrivée ligne n'est disponible que pour un trail.");
    }
    trailPassages.push({
      participantId: current.id,
      controlPointId: null,
      at,
    });
    current.statut = "Finisher";
    return { where: "FINISHER", ts: Date.parse(at) };
  },

  trailRanking(
    raceId: number,
    params: { gender?: "Homme" | "Femme"; categoryId?: number }
  ): ApiRow[] {
    const course = requireCourse(raceId);
    const categoryAlias =
      params.categoryId != null
        ? categories.find((c) => c.id === params.categoryId)?.alias
        : undefined;
    const points = controlPoints
      .filter((cp) => cp.courseId === raceId)
      .sort((a, b) => a.numero - b.numero);
    const startMs = course.startAt ? Date.parse(course.startAt) : now;

    const rows = participants
      .filter((p) => p.courseId === raceId)
      .filter((p) => (params.gender ? p.genre === params.gender : true))
      .filter((p) => (categoryAlias ? p.aliasCategorie === categoryAlias : true))
      .map((p) => {
        const passages = trailPassages.filter((item) => item.participantId === p.id);
        const finish = passages.find((item) => item.controlPointId == null);
        const raceMs = finish ? Date.parse(finish.at) - startMs : null;
        return {
          participantId: p.id,
          bibNumber: p.numDossard,
          athleteName: `${p.prenom} ${p.nom}`.trim(),
          nom: p.nom,
          prenom: p.prenom,
          genre: p.genre,
          categoryName: p.aliasCategorie,
          raceTime: raceMs != null && raceMs >= 0 ? formatMs(raceMs) : null,
          raceMs,
          status: p.statut,
          controlPoints: points.map((cp) => ({
            pointId: cp.id,
            numero: cp.numero,
            libelle: cp.label,
            heurePassage:
              passages.find((item) => item.controlPointId === cp.id)?.at ?? null,
          })),
        };
      });

    const ranked = [...rows].sort((a, b) => {
      if (a.raceMs == null && b.raceMs == null) return 0;
      if (a.raceMs == null) return 1;
      if (b.raceMs == null) return -1;
      return a.raceMs - b.raceMs;
    });

    const genderCounters: Record<string, number> = {};
    const categoryCounters: Record<string, number> = {};

    let rank = 0;
    return ranked.map((row) => {
      const place = row.raceMs == null ? null : (rank += 1);
      let genderRank: number | null = null;
      let categoryRank: number | null = null;
      if (row.raceMs != null) {
        genderRank = (genderCounters[row.genre] = (genderCounters[row.genre] ?? 0) + 1);
        categoryRank = (categoryCounters[row.categoryName] =
          (categoryCounters[row.categoryName] ?? 0) + 1);
      }
      return {
        rank: place,
        participantId: row.participantId,
        bibNumber: row.bibNumber,
        athleteName: row.athleteName,
        nom: row.nom,
        prenom: row.prenom,
        genre: row.genre,
        categoryName: row.categoryName,
        raceTime: row.raceTime,
        status: row.status,
        controlPoints: row.controlPoints,
        categoryRank,
        genderRank,
      };
    });
  },

  listPointeurs(): Pointeur[] {
    return clone(pointeurs);
  },

  createPointeur(dto: PointeurCreateDTO): Pointeur {
    const libelle = dto.libelle.trim();
    if (!libelle) fail("Le libellé du pointeur est requis.");
    const created: Pointeur = {
      id: nextId(),
      libelle,
      role: 1,
      hasTrailControlPoint: false,
      assignedManches: [],
      passcode: dto.passcode?.trim() || `PT${seq}`,
    };
    pointeurs.push(created);
    return clone(created);
  },

  updatePointeur(id: number, dto: PointeurUpdateDTO): Pointeur {
    const pointeur = pointeurs.find((p) => p.id === id);
    if (!pointeur) fail("Pointeur introuvable");
    if (dto.libelle != null) pointeur.libelle = dto.libelle.trim();
    if (dto.passcode != null) pointeur.passcode = dto.passcode.trim();
    return clone(pointeur);
  },

  deletePointeur(id: number): void {
    const index = pointeurs.findIndex((p) => p.id === id);
    if (index < 0) fail("Pointeur introuvable");
    pointeurs.splice(index, 1);
  },

  assignPointeurManches(id: number, mancheIds: number[]): Pointeur {
    const pointeur = pointeurs.find((p) => p.id === id);
    if (!pointeur) fail("Pointeur introuvable");
    const assigned: AssignedManche[] = [];
    for (const mancheId of mancheIds) {
      const view = mancheAssignmentView(mancheId);
      if (!view) fail("Manche introuvable");
      assigned.push(view);
    }
    pointeur.assignedManches = assigned;
    pointeur.hasTrailControlPoint = false;
    pointeur.trailControlPointId = undefined;
    return clone(pointeur);
  },

  importParticipantsCsv(text: string, separator: string): { message: string } {
    const lines = text
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) fail("Le fichier CSV est vide.");

    const split = (line: string) =>
      line.split(separator).map((cell) => cell.trim());
    const headerCells = split(lines[0]).map((cell) => cell.toLowerCase());
    const hasHeader = headerCells.includes("nom") && headerCells.includes("course");
    const rows = hasHeader ? lines.slice(1) : lines;
    if (rows.length === 0) fail("Le fichier ne contient aucune ligne de participant.");

    let imported = 0;
    rows.forEach((line, index) => {
      const cells = split(line);
      const read = (name: string, position: number) => {
        if (!hasHeader) return cells[position] ?? "";
        const at = headerCells.indexOf(name);
        return at >= 0 ? cells[at] ?? "" : "";
      };
      const lineNo = hasHeader ? index + 2 : index + 1;
      try {
        const nom = read("nom", 0);
        const dtn = read("dtn", 1);
        const genre = read("genre", 2);
        const courseLabel = read("course", 3);
        const prenom = hasHeader
          ? read("prenom", -1)
          : cells[4] ?? "";
        if (!nom || !dtn || !genre || !courseLabel) {
          fail("Colonnes nom, dtn, genre et course requises.");
        }
        const course = courses.find(
          (c) => c.name.trim().toLowerCase() === courseLabel.trim().toLowerCase()
        );
        if (!course) fail(`Course introuvable : ${courseLabel}`);
        this.createParticipant({
          nom,
          prenom,
          dateNaissance: parseBirth(dtn),
          genre: parseGenre(genre),
          courseChoisieId: course.id,
          tailleTShirt: "M",
        });
        imported += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Ligne invalide";
        fail(`Ligne ${lineNo} : ${message}`);
      }
    });

    return {
      message: `${imported} participant${imported > 1 ? "s" : ""} importé${imported > 1 ? "s" : ""}.`,
    };
  },
};

/** Session du compte démo CHECKPOINT : pointeur du belvédère, Challenge Initiation. */
export function demoCheckpointSession(): {
  libelle: string;
  assignedControlPoint: {
    id: number;
    courseId: number;
    label: string;
    controlPointNumber: number;
  };
  assignedManches: AssignedManche[];
} {
  const point = controlPoints.find((cp) => cp.id === 11);
  const course = courses.find((item) => item.id === point?.courseId);
  return {
    libelle: point && course ? `${course.name} / ${point.label}` : "Pointeur",
    assignedControlPoint: {
      id: point?.id ?? 11,
      courseId: point?.courseId ?? 1,
      label: point?.label ?? "Belvedere",
      controlPointNumber: point?.numero ?? 1,
    },
    assignedManches: [],
  };
}
