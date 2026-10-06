import { ROLE_ADMIN, ROLE_CHECKPOINT, ROLE_ORGANIZER } from "@/lib/auth";

export type BackOfficeNavLink = {
  kind: "link";
  to: string;
  label: string;
  end?: boolean;
};

export type BackOfficeNavGroup = {
  kind: "group";
  id: string;
  label: string;
  children: BackOfficeNavLink[];
};

export type BackOfficeNavEntry = BackOfficeNavLink | BackOfficeNavGroup;

/** @deprecated Prefer BackOfficeNavLink — kept for gradual migration */
export type BackOfficeNavItem = {
  to: string;
  label: string;
  end?: boolean;
};

const ADMIN_NAV: BackOfficeNavEntry[] = [
  { kind: "link", to: "/dashboard", label: "Tableau de bord", end: true },
  { kind: "link", to: "/participants", label: "Participants" },
  { kind: "link", to: "/comptes", label: "Comptes utilisateurs", end: true },
  {
    kind: "group",
    id: "referentiels",
    label: "Référentiels",
    children: [
      { kind: "link", to: "/categories", label: "Catégories", end: true },
      { kind: "link", to: "/statuts", label: "Statuts", end: true },
    ],
  },
  {
    kind: "group",
    id: "courses",
    label: "Courses",
    children: [
      { kind: "link", to: "/courses", label: "Courses" },
      { kind: "link", to: "/eligibilites", label: "Éligibilités", end: true },
    ],
  },
  { kind: "link", to: "/leaderboard", label: "Résultats", end: true },
  { kind: "link", to: "/journaux", label: "Journaux d’erreurs" },
];

const ORGANIZER_NAV: BackOfficeNavEntry[] = [
  { kind: "link", to: "/participants", label: "Gestion participant" },
  { kind: "link", to: "/tshirts", label: "T-shirts", end: true },
  { kind: "link", to: "/leaderboard", label: "Résultats", end: true },
];

export function navItemsForRole(role: number | undefined): BackOfficeNavEntry[] {
  if (role === ROLE_ADMIN) return ADMIN_NAV;
  if (role === ROLE_ORGANIZER) return ORGANIZER_NAV;
  return [];
}

/** Groupe dont un enfant correspond au chemin courant (pour ouvrir l’accordion). */
export function groupIdForPath(
  path: string,
  entries: BackOfficeNavEntry[]
): string | null {
  for (const entry of entries) {
    if (entry.kind !== "group") continue;

    const match = entry.children.some((child) => {
      if (path === child.to) return true;
      if (path.startsWith(`${child.to}/`)) return true;
      return false;
    });
    if (match) return entry.id;
  }
  return null;
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
      if (path === "/participants/import" || path === "/participants/identity") {
        return false;
      }
      return true;
    }
    if (path.startsWith("/leaderboard")) return true;
    if (path.startsWith("/inscriptions/")) return true;
    return false;
  }
  return false;
}
