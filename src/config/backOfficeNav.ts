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
  { to: "/checkpoint/scan", label: "Checkpoint", end: true },
  { to: "/pointeurs", label: "Pointeurs", end: true },
  { to: "/leaderboard", label: "Résultats", end: true },
];

const ORGANIZER_NAV: BackOfficeNavItem[] = [
  { to: "/participants/add", label: "Nouveau participant", end: true },
  { to: "/participants/identity", label: "Informations participant", end: true },
  { to: "/participants", label: "Participants", end: true },
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
    return path === "/participants" || path.startsWith("/participants/") || path.startsWith("/leaderboard");
  }
  return false;
}
