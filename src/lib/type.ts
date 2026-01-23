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
  categorie: string;
  courseId: number;
  course: string;
  raceTime: string | null;
  status: string | null;
  controlPoints: ControlPoint[];
};

export type UICategory = { id: number; alias: string };

export type PodiumGroup = {
  title: string;
  rows: Row[];
};

// src/types/participant.types.ts
export type ParticipantCreateDTO = {
  nom: string;
  dateNaissance: string;     // yyyy-MM-dd
  genre: "Homme" | "Femme";
  courseChoisieId: number;
};

export type ParticipantResponse = {
  numDossard: string;
  nom: string;
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

export type ParticipantProjection = {
  id: number;
  nom: string;
  numDossard: string;
  genre: "Homme" | "Femme";
  aliasCategorie: string;
  courseId: number;
  courseLibelle: string;
  statut: "Inscrit" | "Present" | "En course" | "DNS" | "DNF";
};