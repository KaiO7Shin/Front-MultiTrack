export type ControlPoint = {
  pointId: number;
  numero: number;
  libelle: string;
  heurePassage: string | null;
};

export type ApiRow = {
  rank: number | null;
  participantId: number;
  bibNumber: string;
  athleteName: string;
  /** Si fournis par l'API, prioritaires sur athleteName */
  nom?: string;
  prenom?: string;
  categoryName: string;
  raceTime: string | null;
  status: string | null;
  controlPoints?: ControlPoint[];
};

export type Row = {
  rank: number | null;
  participantId: number;
  dossard: string;
  nom: string;
  prenom: string;
  categorie: string;
  courseId: number;
  course: string;
  raceTime: string | null;
  status: string | null;
  controlPoints: ControlPoint[];
  // 🆕 nouveaux champ
  categoryRank: number | null;
  genderRank: number | null;
};

export type CategoryGenre = "Homme" | "Femme";

export type Category = {
  id: number;
  alias: string;
  genre: CategoryGenre;
  ageMin: number;
  /** `null` = pas de limite supérieure (ex. 50 ans et +) */
  ageMax: number | null;
};

/** Rétrocompat filtres / selects */
export type UICategory = { id: number; alias: string };

export type CategoryCreateDTO = {
  alias: string;
  genre: CategoryGenre;
  ageMin: number;
  ageMax: number | null;
};

export type CategoryUpdateDTO = Partial<CategoryCreateDTO>;

/** Types de course supportés */
export const COURSE_TYPES = ["TRAIL", "DH", "XC"] as const;
export type CourseType = (typeof COURSE_TYPES)[number];

export type CourseStatus = "A venir" | "En cours" | "Terminee";

export type Course = {
  id: number;
  name: string;
  type: CourseType;
  distanceKm?: number;
  elevation?: number;
  startAt?: string;
  status: CourseStatus;
  checkpoints: number;
  cutoffMinutes?: number;
  description?: string;
};

export type CourseCreateDTO = {
  name: string;
  type: CourseType;
  distanceKm?: number;
  elevation?: number;
  description?: string;
};

export type CourseUpdateDTO = Partial<CourseCreateDTO>;

export type PodiumGroup = {
  title: string;
  rows: Row[];
};

// src/types/participant.types.ts
export const BIKE_TYPES = ["TOUT SUSPENDU", "SEMI-RIGIDE"] as const;
export type BikeType = (typeof BIKE_TYPES)[number];

export const BIKE_TYPE_LABELS: Record<BikeType, string> = {
  "TOUT SUSPENDU": "Tout suspendu",
  "SEMI-RIGIDE": "Semi-rigide",
};

export type ParticipantCreateDTO = {
  nom: string;
  prenom: string;
  dateNaissance: string;     // yyyy-MM-dd
  genre: "Homme" | "Femme";
  courseChoisieId: number;
  /** Requis pour les courses DH uniquement */
  typeVelo?: BikeType;
};

export type ParticipantResponse = {
  numDossard: string;
  nom: string;
  prenom: string;
  genre: string;
  categorie: string;
  statut: string;
};

export type RenderResponse<T> = {
  code: number;
  message: string;
  data?: T;
  error?: string;
};

export type ParticipantStatus =
  | "Inscrit"
  | "Present"
  | "En course"
  | "DNS"
  | "DNF";

export type ParticipantProjection = {
  id: number;
  nom: string;
  prenom: string;
  numDossard: string;
  genre: "Homme" | "Femme";
  aliasCategorie: string;
  courseId: number;
  courseLibelle: string;
  statut: ParticipantStatus;
  dateNaissance: string; // yyyy-MM-dd
  nomCourse?: string;
  typeVelo?: BikeType;
};

export type ParticipantUpdateDTO = {
  /** Dossard actuel (identifiant pour l'API) */
  bibNumber: string;
  numDossard: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  genre: CategoryGenre;
  courseChoisieId: number;
  statut: ParticipantStatus;
  /** Requis pour les courses DH uniquement */
  typeVelo?: BikeType;
};

export interface ParticipantUpdateInfoResponse {
  bibNumber: string;
  genre: string;
  dateNaissance: string;
  ageActuelle: number;
  categorie: string;
}

/** Phase d'une course (qualifs, finale, etc.) */
export type Phase = {
  id: number;
  courseId: number;
  label: string;
};

export type PhaseCreateDTO = {
  courseId: number;
  label: string;
};

export type PhaseUpdateDTO = Partial<Pick<PhaseCreateDTO, "label">>;

/** Manche rattachée à une phase */
export type Manche = {
  id: number;
  phaseId: number;
  label: string;
};

export type MancheCreateDTO = {
  phaseId: number;
  label: string;
};

export type MancheUpdateDTO = Partial<Pick<MancheCreateDTO, "label">>;

/** Phase avec ses manches (relation 1 → N) */
export type PhaseWithManches = Phase & {
  manches: Manche[];
};

/** Résultat chronométré par participant et manche */
export type ResultatManche = {
  id: number;
  participantId: number;
  mancheId: number;
  tempsDepart: string | null;
  tempsArrive: string | null;
};

export type ResultatMancheView = ResultatManche & {
  numDossard: string;
  prenom: string;
  nom: string;
};

/** Disqualification : exclu des phases suivantes sans résultat préalable */
export type ParticipantDisqualification = {
  id: number;
  participantId: number;
  courseId: number;
  /** Première phase où le coureur n'apparaît plus (s'il n'y a pas encore de résultat) */
  fromPhaseId: number;
  mancheId?: number;
  reason?: string;
  at: string;
};

export type MancheTimeDetail = {
  mancheId: number;
  mancheLabel: string;
  timeMs: number | null;
  timeFormatted: string | null;
  finished: boolean;
};

/** Ligne classement DH — meilleur temps sur la phase */
export type DHRankingRow = {
  participantId: number;
  dossard: string;
  prenom: string;
  nom: string;
  categorie: string;
  genre: CategoryGenre;
  typeVelo?: BikeType;
  bestTimeMs: number | null;
  bestTimeFormatted: string | null;
  rankScratch: number | null;
  rankCategory: number | null;
  disqualified: boolean;
  mancheTimes: MancheTimeDetail[];
};

/** Ligne classement XC par manche */
export type XCRankingRow = {
  participantId: number;
  dossard: string;
  prenom: string;
  nom: string;
  categorie: string;
  genre: CategoryGenre;
  timeMs: number | null;
  timeFormatted: string | null;
  rankScratch: number | null;
  rankCategory: number | null;
  disqualified: boolean;
};

export type XCMancheRankingGroup = {
  mancheId: number;
  mancheLabel: string;
  /** Nombre de participants affectés à la poule */
  rosterCount: number;
  /** Nombre ayant une arrivée enregistrée */
  finishedCount: number;
  rows: XCRankingRow[];
};

/** Affectation participant → poule (manche) pour les phases éliminatoires XC */
export type MancheAssignment = {
  mancheId: number;
  participantId: number;
};

export type XCPhaseRanking = {
  phaseId: number;
  phaseLabel: string;
  mancheGroups: XCMancheRankingGroup[];
  scratchGeneral: XCRankingRow[];
  byCategory: { categorie: string; rows: XCRankingRow[] }[];
};

export type DHPhaseRanking = {
  phaseId: number;
  phaseLabel: string;
  scratch: DHRankingRow[];
  byCategory: { categorie: string; rows: DHRankingRow[] }[];
};