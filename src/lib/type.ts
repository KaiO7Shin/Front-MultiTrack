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
export const COURSE_TYPES = ["TRAIL", "DH", "XC", "ENDURO"] as const;
export type CourseType = (typeof COURSE_TYPES)[number];

export type CourseStatus = "A venir" | "En cours" | "Terminee";

export type Course = {
  id: number;
  name: string;
  type: CourseType;
  typeCourseId?: number;
  distanceKm?: number;
  elevation?: number;
  startAt?: string;
  status: CourseStatus;
  checkpoints: number;
  dureeBarriereHoraire?: string;
  nomSequence?: string;
};

export type CourseCreateDTO = {
  libelle: string;
  typeCourseId: number;
  distance: number;
  totalDenivele: number;
  dureeBarriereHoraire: string;
  nomSequence?: string;
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
  typeVelo?: string;
};

export type TypeVelo = {
  id: number;
  libelle: string;
};

export type TypeCourse = {
  id: number;
  libelle: string;
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
  | "Finisher"
  | "DNS"
  | "DNF"
  | "DSQ";

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

/** Point de contrôle d'une course TRAIL */
export type ControlPointConfig = {
  id: number;
  courseId: number;
  label: string;
  numero: number;
  utilisateurId?: number;
  /** Présent uniquement à la création ou régénération */
  passcode?: string;
};

export type ControlPointCreateDTO = {
  courseId: number;
  label: string;
  numero: number;
  passcode?: string;
};

export type ControlPointUpdateDTO = Partial<
  Pick<ControlPointCreateDTO, "label" | "numero" | "passcode">
>;

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

/** @deprecated La disqualification est gérée via le statut participant « DSQ » */
export type ParticipantDisqualification = {
  id: number;
  participantId: number;
  courseId: number;
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

/** Ligne classement Enduro — cumul des temps sur les spéciales de la phase */
export type EnduroRankingRow = {
  participantId: number;
  dossard: string;
  prenom: string;
  nom: string;
  categorie: string;
  genre: CategoryGenre;
  typeVelo?: BikeType;
  /** Somme des temps réalisés sur les spéciales chronométrées */
  totalTimeMs: number | null;
  totalTimeFormatted: string | null;
  /** Arrivée sur la dernière spéciale − départ sur la première (liaisons incluses) */
  elapsedTimeMs: number | null;
  elapsedTimeFormatted: string | null;
  completedManches: number;
  totalManches: number;
  /** Vrai lorsque toutes les spéciales de la phase sont chronométrées */
  complete: boolean;
  rankScratch: number | null;
  rankCategory: number | null;
  disqualified: boolean;
  mancheTimes: MancheTimeDetail[];
};

export type EnduroPhaseRanking = {
  phaseId: number;
  phaseLabel: string;
  totalManches: number;
  scratch: EnduroRankingRow[];
  byCategory: { categorie: string; rows: EnduroRankingRow[] }[];
};