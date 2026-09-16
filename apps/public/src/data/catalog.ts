import type { Category, CourseGroup, Race } from "../types";

/** 07/11/2026 00:00 — date et heure de l’événement TBB, immuable. */
export const EVENT_START_AT = "2026-11-07T00:00:00+03:00" as const;

export const EVENT_INFO = {
  name: "TBB · Trail Bike Beer",
  dateLabel: "Samedi 07 novembre 2026",
  date: "2026-11-07",
  startAt: EVENT_START_AT,
  location: "Ambatomanga",
} as const;

export const RACES: Race[] = [
  { name: "Challenge Initiation", discipline: "Trail", distance: "12 km", price: 45_000, duo: false, description: "Le format idéal pour découvrir le trail et relever un premier défi." },
  { name: "Challenge Explorateur", discipline: "", distance: "16 km", price: 50_000, duo: false, description: "Un parcours d’aventure pour celles et ceux qui veulent aller plus loin." },
  { name: "Challenge Parent-Enfant", discipline: "VTT ou Trail", distance: "10 km", price: 70_000, duo: true, description: "Une aventure complice à vivre et à partager en famille." },
  { name: "Challenge Suprême", discipline: "VTT ou Trail", distance: "25 km", price: 55_000, duo: false, description: "Le défi majeur de TBB pour les sportifs en quête de dépassement." },
  { name: "Challenge des amoureux", discipline: "Trail ou VTT", distance: "25 km", price: 75_000, duo: true, description: "Un challenge en duo pour conjuguer effort, aventure et complicité." },
];

export const COURSE_GROUPS: readonly CourseGroup[] = [
  {
    title: "Challenge Trail",
    kind: "Trail",
    races: ["Challenge Initiation", "Challenge Explorateur", "Challenge Parent-Enfant", "Challenge Suprême", "Challenge des amoureux"],
  },
  {
    title: "Challenge VTT",
    kind: "VTT",
    races: ["Challenge Parent-Enfant", "Challenge Suprême", "Challenge des amoureux"],
  },
];

export const CATEGORIES: readonly Category[] = [
  { name: "Cadet", codeHomme: "CAH", codeFemme: "CAF", ageMin: "–", ageMax: "15" },
  { name: "Junior", codeHomme: "JUH", codeFemme: "JUF", ageMin: "16", ageMax: "17" },
  { name: "Senior", codeHomme: "SEH", codeFemme: "SEF", ageMin: "18", ageMax: "39" },
  { name: "Master", codeHomme: "MTH", codeFemme: "MTF", ageMin: "40", ageMax: "+" },
];

export const CATEGORY_ELIGIBILITY: Record<string, readonly string[]> = {
  "Challenge Initiation": ["Cadet", "Junior", "Senior", "Master"],
  "Challenge Explorateur": ["Junior", "Senior", "Master"],
  "Challenge Parent-Enfant": ["Cadet", "Junior", "Senior", "Master"],
  "Challenge Suprême": ["Senior", "Master"],
  "Challenge des amoureux": ["Senior", "Master"],
};

export const HIGHLIGHTS = [
  { title: "Trail Run", text: "Défiez les sommets.", icon: "trail" },
  { title: "VTT", text: "Parcourez les sentiers.", icon: "bike" },
  { title: "Beer Event", text: "Festif et convivial.", icon: "beer" },
] as const;

export const PAYMENT_NUMBER = "034 00 000 00";

export const WIZARD_STEPS = ["Règlement", "Participant", "Résumé"] as const;
