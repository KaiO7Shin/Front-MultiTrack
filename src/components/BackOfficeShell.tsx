import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Barcode,
  ChevronDown,
  Flag,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  ScanLine,
  Shirt,
  Tags,
  Trophy,
  UserCog,
  Users,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import multitrackLogo from "@/assets/multitrack.svg";
import {
  groupIdForPath,
  type BackOfficeNavEntry,
  type BackOfficeNavLink,
} from "@/config/backOfficeNav";

const NAV_ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/courses": Flag,
  "/dossards": Barcode,
  "/categories": Tags,
  "/statuts": ListChecks,
  "/eligibilites": Tags,
  "/participants": Users,
  "/participants/add": UserPlus,
  "/tshirts": Shirt,
  "/checkpoint/scan": ScanLine,
  "/pointeurs": UserCog,
  "/leaderboard": Trophy,
};

type BackOfficeShellProps = {
  homeTo: string;
  navItems: BackOfficeNavEntry[];
  roleLabel: string;
  userName?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => void;
  children: ReactNode;
};

function navLinkClass(isActive: boolean, nested = false) {
  return `flex items-center gap-3 rounded-lg text-sm font-medium transition ${
    nested ? "px-3 py-2" : "px-3 py-2.5"
  } ${
    isActive
      ? "bg-brand-muted text-brand"
      : "text-muted-foreground hover:bg-muted hover:text-brand"
  }`;
}

function NavEntryLink({
  item,
  nested,
  onNavigate,
}: {
  item: BackOfficeNavLink;
  nested?: boolean;
  onNavigate: () => void;
}) {
  const Icon = NAV_ICONS[item.to] ?? Flag;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) => navLinkClass(isActive, nested)}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {item.label}
    </NavLink>
  );
}

export function BackOfficeShell({
  homeTo,
  navItems,
  roleLabel,
  userName,
  open,
  onOpenChange,
  onLogout,
  children,
}: BackOfficeShellProps) {
  const location = useLocation();
  const [openGroupId, setOpenGroupId] = useState<string | null>(() =>
    groupIdForPath(location.pathname, navItems)
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    setOpenGroupId(groupIdForPath(location.pathname, navItems));
  }, [location.pathname, navItems]);

  const closeMobile = () => onOpenChange(false);

  const toggleGroup = (id: string) => {
    setOpenGroupId((prev) => (prev === id ? null : id));
  };

  const sidebar = (
    <aside id="sidebar" className="bo-sidebar" aria-label="Navigation principale">
      <div className="flex h-16 items-center justify-between gap-3 border-b border-border px-5">
        <Link to={homeTo} className="inline-flex min-w-0 items-center" aria-label="Accueil MultiTrack">
          <img src={multitrackLogo} alt="" className="h-11 w-auto" />
        </Link>
        <button
          type="button"
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
          onClick={closeMobile}
          aria-label="Fermer le menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems.map((entry) => {
          if (entry.kind === "link") {
            return (
              <NavEntryLink
                key={entry.to}
                item={entry}
                onNavigate={closeMobile}
              />
            );
          }

          const isOpen = openGroupId === entry.id;
          const groupActive = groupIdForPath(location.pathname, [entry]) === entry.id;

          return (
            <div key={entry.id} className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => toggleGroup(entry.id)}
                aria-expanded={isOpen}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                  groupActive
                    ? "text-brand"
                    : "text-muted-foreground hover:bg-muted hover:text-brand"
                }`}
              >
                <span className="flex-1">{entry.label}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {isOpen && (
                <div className="ml-2 flex flex-col gap-0.5 border-l border-border pl-2">
                  {entry.children.map((child) => (
                    <NavEntryLink
                      key={child.to}
                      item={child}
                      nested
                      onNavigate={closeMobile}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-cta">
          {roleLabel}
        </p>
        <p className="mt-1 truncate text-sm text-brand">{userName || "Session"}</p>
      </div>
    </aside>
  );

  return (
    <div className="bo-app min-h-screen bg-background text-foreground">
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-navy/40 lg:hidden"
          aria-label="Fermer le menu"
          onClick={closeMobile}
        />
      )}
      <div className={`${open ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 w-[270px] transition-transform lg:translate-x-0`}>
        {sidebar}
      </div>

      <div className="lg:pl-[270px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-white/95 px-4 backdrop-blur-md lg:px-8">
          <button
            type="button"
            className="rounded-lg border border-border p-2 text-brand lg:hidden"
            onClick={() => onOpenChange(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            aria-controls="sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-full bg-brand-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-brand">
              {roleLabel}
            </span>
            <button type="button" onClick={onLogout} className="btn-secondary px-3 py-1.5 text-xs">
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>
        <main className="min-w-0 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

type CheckpointShellProps = {
  homeTo: string;
  label: string | null;
  onLogout: () => void;
  children: ReactNode;
};

export function CheckpointShell({ homeTo, label, onLogout, children }: CheckpointShellProps) {
  return (
    <div className="bo-app min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-2xl items-center justify-between gap-3 px-4">
          <Link to={homeTo} aria-label="Accueil MultiTrack">
            <img src={multitrackLogo} alt="" className="h-8 w-auto" />
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden truncate text-xs text-muted-foreground sm:inline">{label ?? "Checkpoint"}</span>
            <button type="button" onClick={onLogout} className="btn-secondary px-3 py-1.5 text-xs">
              Déconnexion
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto min-w-0 max-w-2xl px-4 py-6">{children}</main>
    </div>
  );
}
