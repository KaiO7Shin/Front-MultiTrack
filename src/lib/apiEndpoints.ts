/** Chemins API attendus par le frontend (base : VITE_API_URL) */
export const API = {
  login: "/login/user",

  races: "/races",
  race: "/race",
  raceById: (id: number) => `/race/${id}`,
  raceFinish: (id: number) => `/race/${id}/finish`,
  raceChangeStatus: "/race/change/status",
  raceRanking: (raceId: number) => `/races/${raceId}/ranking`,
  raceRankingDh: (raceId: number) => `/races/${raceId}/ranking/dh`,
  raceRankingXc: (raceId: number) => `/races/${raceId}/ranking/xc`,
  raceRankingEnduro: (raceId: number) => `/races/${raceId}/ranking/enduro`,

  categories: "/categories",
  category: "/category",
  categoryById: (id: number) => `/category/${id}`,

  courseEligibleCategories: "/course/categories_eligibles",
  eligibility: "/eligibility",
  eligibilityByIds: (courseId: number, categorieId: number) =>
    `/eligibility/${courseId}/${categorieId}`,

  typesVelo: "/types-velo",
  typesCourse: "/types-course",

  genres: "/genres",
  taillesTShirt: "/tailles-t-shirt",
  statuts: "/statuts",

  participants: "/participants",
  participant: "/participant",
  participantById: (id: number) => `/participants/${id}`,
  participantByBib: (bibNumber: string) => `/participant/${bibNumber}`,
  participantChangeStatus: "/participant/change/status",
  participantDisqualify: "/participant/disqualify",
  participantRevokeDisqualify: (participantId: number) =>
    `/participant/disqualify/${participantId}`,
  importParticipants: "/import/participants",

  inscriptions: "/inscriptions",
  inscriptionById: (id: number) => `/inscriptions/${id}`,
  inscriptionReview: (id: number) => `/inscriptions/${id}/review`,
  inscriptionValidationMail: (id: number) => `/inscriptions/${id}/mail-validation`,
  inscriptionStatutLogs: (id: number) => `/inscriptions/${id}/statut-logs`,
  inscriptionDocument: (
    id: number,
    type: "identite" | "certificat" | "autorisation"
  ) => `/inscriptions/${id}/documents/${type}`,

  participantStatutLogs: (id: number) => `/participants/${id}/statut-logs`,
  // Phases / manches : désactivés pour cette version TBB
  // phases: "/phases",
  // phase: "/phase",
  // phaseById: (id: number) => `/phase/${id}`,
  // manches: "/manches",
  // manche: "/manche",
  // mancheById: (id: number) => `/manche/${id}`,
  // resultatsManche: "/resultats-manche",
  // resultatMancheDepart: "/resultat-manche/depart",
  // resultatMancheArrivee: "/resultat-manche/arrivee",
  // resultatMancheAnnuler: "/resultat-manche/annuler",
  // checkpointEligible: "/checkpoint/eligible-participants",

  controlPoints: "/control-points",
  controlPoint: "/control-point",
  controlPointById: (id: number) => `/control-point/${id}`,

  // mancheAssignments: "/manche-assignments",

  checkingPc: "/checking/pc",
  checkingFinishline: "/checking/finishline",

  pointeurs: "/pointeurs",
  pointeur: "/pointeur",
  pointeurById: (id: number) => `/pointeur/${id}`,

  errorLogs: "/error-logs",
  errorLogById: (id: number) => `/error-logs/${id}`,

  comptesUtilisateur: "/comptes",
  compteUtilisateurById: (id: number) => `/comptes/${id}`,
  // pointeurManches: (id: number) => `/pointeur/${id}/manches`,
} as const;
