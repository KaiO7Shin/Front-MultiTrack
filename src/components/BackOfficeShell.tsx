import { useEffect, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanLine,
  Tags,
  Trophy,
  UserCog,
  Users,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import multitrackLogo from "@/assets/multitrack.svg";
import type { BackOfficeNavItem } from "@/config/backOfficeNav";

const NAV_ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/courses": Flag,
  "/categories": Tags,
  "/participants": Users,
  "/participants/add": UserPlus,
  "/checkpoint/scan": ScanLine,
  "/pointeurs": UserCog,
  "/leaderboard": Trophy,
};

type BackOfficeShellProps = {
  homeTo: string;
  navItems: BackOfficeNavItem[];
  roleLabel: string;
  userName?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => void;
  children: ReactNode;
};

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
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const sidebar = (
    <aside id="sidebar" className="bo-sidebar" aria-label="Navigation principale">
      <div className="flex h-16 items-center justify-between gap-3 border-b border-border px-5">
        <Link to={homeTo} className="inline-flex min-w-0 items-center" aria-label="Accueil MultiTrack">
          <img src={multitrackLogo} alt="" className="h-11 w-auto" />
        </Link>
        <button
          type="button"
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
          onClick={() => onOpenChange(false)}
          aria-label="Fermer le menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = NAV_ICONS[item.to] ?? Flag;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => onOpenChange(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-muted text-brand"
                    : "text-muted-foreground hover:bg-muted hover:text-brand"
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </NavLink>
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
          onClick={() => onOpenChange(false)}
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
