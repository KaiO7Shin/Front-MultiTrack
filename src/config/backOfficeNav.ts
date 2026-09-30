import { ROLE_ADMIN, ROLE_CHECKPOINT, ROLE_ORGANIZER } from "@/lib/auth";

export type BackOfficeNavItem = {
  to: string;
  label: string;
  end?: boolean;
};

const ADMIN_NAV: BackOfficeNavItem[] = [
  { to: "/dashboard", label: "Dashboard", end: true },
  { to: "/courses", label: "Courses", end: true },
  { to: "/categories", label: "Catégories", end: true },
  { to: "/participants", label: "Participants" },
  { to: "/participants/identity", label: "Informations participant", end: true },
  { to: "/tshirts", label: "T-shirts", end: true },
  { to: "/checkpoint/scan", label: "Checkpoint", end: true },
  { to: "/pointeurs", label: "Pointeurs", end: true },
  { to: "/leaderboard", label: "Résultats", end: true },
];

const ORGANIZER_NAV: BackOfficeNavItem[] = [
  { to: "/participants", label: "Gestion participant" },
  { to: "/tshirts", label: "T-shirts", end: true },
  { to: "/leaderboard", label: "Résultats", end: true },
];

export function navItemsForRole(role: number | undefined): BackOfficeNavItem[] {
  if (role === ROLE_ADMIN) return ADMIN_NAV;
  if (role === ROLE_ORGANIZER) return ORGANIZER_NAV;
  return [];
}

export function isPathAllowedForRole(path: string, role: number | undefined): boolean {
  if (role === ROLE_ADMIN) return true;
  if (role === ROLE_CHECKPOINT) return path.startsWith("/checkpoint");
  if (role === ROLE_ORGANIZER) {
    const allowedExact = new Set([
      "/participants",
      "/tshirts",
      "/leaderboard",
      "/organisateur",
    ]);
    if (allowedExact.has(path)) return true;
    if (path.startsWith("/participants/")) {
      // Orga : suivi / détail / ajout embarqué — pas import CSV ni identity admin
      if (path === "/participants/import" || path === "/participants/identity") {
        return false;
      }
      return true;
    }
    if (path.startsWith("/leaderboard")) return true;
    return false;
  }
  return false;
}
