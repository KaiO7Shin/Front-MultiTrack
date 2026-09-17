import {
  findRace,
  findRaceByName,
  formatRaceLabel,
  getCategories,
  getCourseGroups,
  getRacePrice,
  getRaces,
  isCategoryEligible,
  isDuoRace,
} from "../services/catalogService";

export function useCatalog() {
  return {
    races: getRaces(),
    courseGroups: getCourseGroups(),
    categories: getCategories(),
    findRace,
    findRaceByName,
    formatRaceLabel,
    getRacePrice,
    isDuoRace,
    isCategoryEligible,
  };
}
