/** Chemins API attendus par le frontend (base : VITE_API_URL) */
export const API = {
  login: "/login/user",

  races: "/races",
  race: "/race",
  raceById: (id: number) => `/race/${id}`,
  raceChangeStatus: "/race/change/status",
  raceRanking: (raceId: number) => `/races/${raceId}/ranking`,
  raceRankingDh: (raceId: number) => `/races/${raceId}/ranking/dh`,
  raceRankingXc: (raceId: number) => `/races/${raceId}/ranking/xc`,
  raceRankingEnduro: (raceId: number) => `/races/${raceId}/ranking/enduro`,

  categories: "/categories",
  category: "/category",
  categoryById: (id: number) => `/category/${id}`,

  typesVelo: "/types-velo",
  typesCourse: "/types-course",

  participants: "/participants",
  participant: "/participant",
  participantByBib: (bibNumber: string) => `/participant/${bibNumber}`,
  participantChangeStatus: "/participant/change/status",
  participantDisqualify: "/participant/disqualify",
  participantRevokeDisqualify: (participantId: number) =>
    `/participant/disqualify/${participantId}`,
  importParticipants: "/import/participants",

  phases: "/phases",
  phase: "/phase",
  phaseById: (id: number) => `/phase/${id}`,

  manches: "/manches",
  manche: "/manche",
  mancheById: (id: number) => `/manche/${id}`,

  resultatsManche: "/resultats-manche",
  resultatMancheDepart: "/resultat-manche/depart",
  resultatMancheArrivee: "/resultat-manche/arrivee",
  resultatMancheAnnuler: "/resultat-manche/annuler",

  checkpointEligible: "/checkpoint/eligible-participants",

  controlPoints: "/control-points",
  controlPoint: "/control-point",
  controlPointById: (id: number) => `/control-point/${id}`,

  mancheAssignments: "/manche-assignments",

  checkingPc: "/checking/pc",
  checkingFinishline: "/checking/finishline",
} as const;
