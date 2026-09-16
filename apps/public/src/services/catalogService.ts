import { CATEGORIES, CATEGORY_ELIGIBILITY, COURSE_GROUPS, RACES } from "../data/catalog";
import type { Race } from "../types";

/**
 * Catalogue public actuel : données TBB locales.
 * Brancher ici `apiRequest(API.publicRaces)` et `apiRequest(API.publicEvent)`
 * dès que l’API alimentera l’accueil et les courses.
 */
export function getRaces(): Race[] {
  return RACES;
}

export function getCourseGroups() {
  return COURSE_GROUPS;
}

export function getCategories() {
  return CATEGORIES;
}

export function isCategoryEligible(raceName: string, categoryName: string) {
  return Boolean(CATEGORY_ELIGIBILITY[raceName]?.includes(categoryName));
}

export function formatRaceLabel(race: Race) {
  return [race.name, race.discipline, race.distance].filter(Boolean).join(" — ");
}

export function findRace(raceLabel: string) {
  return RACES.find((race) => raceLabel.startsWith(race.name));
}

export function findRaceByName(name: string) {
  return RACES.find((race) => race.name === name);
}

export function getRacePrice(raceLabel: string) {
  return findRace(raceLabel)?.price ?? 0;
}

export function isDuoRace(raceLabel: string) {
  return Boolean(findRace(raceLabel)?.duo);
}
