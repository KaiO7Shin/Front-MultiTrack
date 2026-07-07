import type {
  BikeType,
  Course,
  Manche,
  MancheAssignment,
  ParticipantDisqualification,
  ParticipantProjection,
  Phase,
  ResultatManche,
} from "./type";

type SeedParticipant = {
  id: number;
  nom: string;
  prenom: string;
  numDossard: string;
  genre: "Homme" | "Femme";
  dateNaissance: string;
  courseId: number;
  statut: ParticipantProjection["statut"];
  typeVelo?: BikeType;
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Jeu de démo VIERGE — prêt à démarrer
 *
 * ✓ 3 courses (TRAIL / DH / XC) — statut « A venir », pas de départ lancé
 * ✓ 20 participants inscrits — aucun « En course », DNF ou DNS
 * ✓ Phases & manches configurées (DH / XC) — structure prête
 * ✗ Aucun résultat manche, disqualification ni affectation poule
 *
 * Réinitialiser : localResetDemoData() dans la console navigateur
 * ───────────────────────────────────────────────────────────────────────────── */

export function mockCourses(): Course[] {
  return [
    {
      id: 1,
      name: "Trail Légende 21 km",
      type: "TRAIL",
      distanceKm: 21,
      elevation: 850,
      status: "A venir",
      checkpoints: 4,
      cutoffMinutes: 240,
      description: "Parcours trail — 4 points de contrôle",
    },
    {
      id: 2,
      name: "Descente Bike Park",
      type: "DH",
      distanceKm: 3,
      elevation: 600,
      status: "A venir",
      checkpoints: 2,
      description: "Descente — qualifications (2 manches) puis finale",
    },
    {
      id: 3,
      name: "XC Open",
      type: "XC",
      distanceKm: 12,
      elevation: 400,
      status: "A venir",
      checkpoints: 3,
      description: "Cross-country — éliminatoires par poules puis finale",
    },
  ];
}

export function mockPhases(): Phase[] {
  return [
    { id: 1, courseId: 2, label: "Qualifications" },
    { id: 2, courseId: 2, label: "Finale" },
    { id: 3, courseId: 3, label: "Éliminatoires" },
    { id: 4, courseId: 3, label: "Finale" },
  ];
}

export function mockManches(): Manche[] {
  return [
    { id: 1, phaseId: 1, label: "Manche 1" },
    { id: 2, phaseId: 1, label: "Manche 2" },
    { id: 3, phaseId: 2, label: "Finale" },
    { id: 4, phaseId: 3, label: "Poule A" },
    { id: 5, phaseId: 3, label: "Poule B" },
    { id: 6, phaseId: 4, label: "Finale" },
  ];
}

export function mockParticipantDefs(): SeedParticipant[] {
  return [
    // ── TRAIL (course 1) — dossards 100x ──
    { id: 1, prenom: "Miora", nom: "Rasoa", numDossard: "1001", genre: "Homme", dateNaissance: "1988-03-12", courseId: 1, statut: "Inscrit" },
    { id: 2, prenom: "Jean", nom: "Rakoto", numDossard: "1002", genre: "Homme", dateNaissance: "1995-07-22", courseId: 1, statut: "Inscrit" },
    { id: 3, prenom: "Aina", nom: "Hanitra", numDossard: "1003", genre: "Femme", dateNaissance: "1992-11-05", courseId: 1, statut: "Inscrit" },
    { id: 4, prenom: "Koto", nom: "Tovo", numDossard: "1004", genre: "Homme", dateNaissance: "2001-01-18", courseId: 1, statut: "Present" },
    { id: 5, prenom: "Fara", nom: "Landy", numDossard: "1005", genre: "Femme", dateNaissance: "1985-09-30", courseId: 1, statut: "Inscrit" },
    { id: 6, prenom: "Paul", nom: "Jean", numDossard: "1006", genre: "Homme", dateNaissance: "1978-06-14", courseId: 1, statut: "Inscrit" },
    { id: 7, prenom: "Léa", nom: "Marie", numDossard: "1007", genre: "Femme", dateNaissance: "1999-04-08", courseId: 1, statut: "Present" },
    { id: 8, prenom: "David", nom: "Paul", numDossard: "1008", genre: "Homme", dateNaissance: "1990-12-25", courseId: 1, statut: "Inscrit" },

    // ── DH (course 2) — dossards 200x ──
    { id: 9, prenom: "Andry", nom: "Randria", numDossard: "2001", genre: "Homme", dateNaissance: "1996-02-10", courseId: 2, statut: "Inscrit", typeVelo: "TOUT SUSPENDU" },
    { id: 10, prenom: "Nirina", nom: "Solo", numDossard: "2002", genre: "Femme", dateNaissance: "2000-08-03", courseId: 2, statut: "Inscrit", typeVelo: "SEMI-RIGIDE" },
    { id: 11, prenom: "Hery", nom: "Rabe", numDossard: "2003", genre: "Homme", dateNaissance: "1989-05-17", courseId: 2, statut: "Inscrit", typeVelo: "TOUT SUSPENDU" },
    { id: 12, prenom: "Zoé", nom: "Martin", numDossard: "2004", genre: "Femme", dateNaissance: "1994-10-21", courseId: 2, statut: "Present", typeVelo: "SEMI-RIGIDE" },
    { id: 13, prenom: "Lionel", nom: "Bernard", numDossard: "2005", genre: "Homme", dateNaissance: "2003-03-09", courseId: 2, statut: "Inscrit", typeVelo: "TOUT SUSPENDU" },
    { id: 14, prenom: "Sarah", nom: "Keita", numDossard: "2006", genre: "Femme", dateNaissance: "1991-07-28", courseId: 2, statut: "Inscrit", typeVelo: "SEMI-RIGIDE" },

    // ── XC (course 3) — dossards 300x ──
    { id: 15, prenom: "Eric", nom: "Vallois", numDossard: "3001", genre: "Homme", dateNaissance: "1993-01-15", courseId: 3, statut: "Inscrit" },
    { id: 16, prenom: "Aina", nom: "Rakotondrazaka", numDossard: "3002", genre: "Femme", dateNaissance: "1997-06-20", courseId: 3, statut: "Inscrit" },
    { id: 17, prenom: "Marc", nom: "Fontaine", numDossard: "3003", genre: "Homme", dateNaissance: "1986-11-11", courseId: 3, statut: "Present" },
    { id: 18, prenom: "Julie", nom: "Thomas", numDossard: "3004", genre: "Femme", dateNaissance: "2002-09-02", courseId: 3, statut: "Inscrit" },
    { id: 19, prenom: "Thomas", nom: "Garcia", numDossard: "3005", genre: "Homme", dateNaissance: "1990-04-27", courseId: 3, statut: "Inscrit" },
    { id: 20, prenom: "Emma", nom: "Petit", numDossard: "3006", genre: "Femme", dateNaissance: "1988-12-01", courseId: 3, statut: "Inscrit" },
  ];
}

/** Aucun chronométrage — course pas encore démarrée */
export function mockResultatsManche(): ResultatManche[] {
  return [];
}

/** Aucune affectation poule — à configurer avant les éliminatoires XC */
export function mockMancheAssignments(): MancheAssignment[] {
  return [];
}

/** Aucune disqualification */
export function mockDisqualifications(): ParticipantDisqualification[] {
  return [];
}

/** Compteurs d'IDs après chargement du jeu de démo vierge */
export const MOCK_META_IDS = {
  nextCourseId: 4,
  nextParticipantId: 21,
  nextCategoryId: 13,
  nextPhaseId: 5,
  nextMancheId: 7,
  nextResultatMancheId: 1,
  nextDisqualificationId: 1,
  nextBibByCourse: { "1": 1008, "2": 2006, "3": 3006 } as Record<string, number>,
};

export type BuildParticipantOptions = {
  resolveCategory: (genre: "Homme" | "Femme", dateNaissance: string) => string;
  courseLabel: (courseId: number) => string;
};

export function buildMockParticipants(
  opts: BuildParticipantOptions
): (SeedParticipant & {
  aliasCategorie: string;
  courseLibelle: string;
  nomCourse: string;
})[] {
  return mockParticipantDefs().map((p) => {
    const courseLibelle = opts.courseLabel(p.courseId);
    return {
      ...p,
      aliasCategorie: opts.resolveCategory(p.genre, p.dateNaissance),
      courseLibelle,
      nomCourse: courseLibelle,
    };
  });
}
