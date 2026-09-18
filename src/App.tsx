import { Outlet, NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CheckpointScan } from "./pages/Checkpoint/CheckpointScan";
import multitrackLogo from "./assets/multitrack.svg";
import { ROLE_ADMIN, ROLE_CHECKPOINT, useAuth } from "./lib/auth";

export default function App() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const role = user?.role;
  const isAdmin = role === ROLE_ADMIN;
  const isCollaborateur = role === ROLE_CHECKPOINT;
  const assignedManches = user?.assignedManches ?? [];
  const collaborateurLabel =
    user?.libelle?.trim() ||
    user?.assignedControlPoint?.label ||
    (assignedManches.length === 1
      ? `${assignedManches[0].courseLabel} / ${assignedManches[0].label}`
      : assignedManches.length > 1
        ? `${assignedManches.length} manches`
        : null);

  useEffect(() => {
    if (isCollaborateur && !location.pathname.startsWith("/checkpoint")) {
      navigate("/checkpoint/scan", { replace: true });
    }
  }, [isCollaborateur, location.pathname, navigate]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open || window.innerWidth >= 768) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function handleLogout() {
    signOut();
    navigate("/login", { replace: true });
  }

  const logo = (
    <Link to="/dashboard" className="inline-block" aria-label="Accueil MultiTrack">
      <img src={multitrackLogo} alt="MultiTrack Logo" className="h-9 w-auto" />
    </Link>
  );

  if (isCollaborateur) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-border">
          <div className="px-3 sm:px-4 min-h-14 py-2 flex flex-wrap items-center justify-between gap-2 max-w-2xl mx-auto">
            <div className="font-semibold shrink-0">{logo}</div>
            <div className="flex flex-wrap items-center justify-end gap-2 text-sm min-w-0">
              <span className="hidden sm:inline badge-live">Checkpoint</span>
              <span
                className="inline-flex max-w-[10rem] sm:max-w-none items-center gap-1 truncate rounded-full border border-border bg-white px-2.5 py-1 text-xs text-muted-foreground"
                title="Pointeur / point de contrôle assigné"
              >
                {collaborateurLabel ?? "—"}
              </span>
              <button onClick={handleLogout} className="btn-secondary px-3 py-1.5 text-xs shrink-0">
                Déconnexion
              </button>
            </div>
          </div>
        </header>

        <main className="px-3 sm:px-4 py-4 sm:py-6 max-w-2xl mx-auto min-w-0">
          <CheckpointScan />
        </main>

        <footer className="py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} <span className="text-brand font-medium">MultiTrack</span>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-border">
        <div className="mx-auto grid h-14 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-2 px-3 sm:px-4 md:flex md:justify-between">
          <button
            className="md:hidden btn-secondary px-3 py-1.5 justify-self-start"
            onClick={() => setOpen((v) => !v)}
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            aria-controls="sidebar"
          >
            ☰
          </button>

          <div className="justify-self-center font-semibold md:justify-self-start">{logo}</div>

          <div className="justify-self-end text-sm flex items-center gap-2 sm:gap-3">
            {isAdmin && (
              <span className="hidden sm:inline rounded-full border border-border bg-brand-muted px-2.5 py-1 text-xs font-medium text-brand">
                Admin
              </span>
            )}
            <button onClick={handleLogout} className="btn-secondary px-3 py-1.5 text-xs">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6 md:py-8 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 md:gap-8 relative min-w-0">
        {open && (
          <button
            type="button"
            aria-label="Fermer le menu"
            className="fixed inset-0 z-20 bg-navy/20 backdrop-blur-[1px] md:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        <aside
          id="sidebar"
          className={`${
            open ? "block" : "hidden"
          } md:block page-card p-2 h-max max-h-[calc(100dvh-5rem)] overflow-y-auto fixed md:static z-30 left-3 right-3 sm:left-4 sm:right-4 top-[4.5rem] md:left-auto md:right-auto md:top-auto md:max-h-none shadow-md md:shadow-sm`}
        >
          <nav className="flex flex-col gap-0.5">
            <Item to="/dashboard" label="Dashboard" end />
            <Item to="/courses" label="Courses" end />
            <Item to="/categories" label="Catégories" end />
            <Item to="/participants" label="Participants" />
            <Item to="/checkpoint/scan" label="Checkpoint" end />
            {isAdmin && <Item to="/pointeurs" label="Pointeurs" end />}
            <Item to="/leaderboard" label="Classement" end />
          </nav>
        </aside>

        <main className="min-h-[70vh] min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/60">
        © {new Date().getFullYear()} <span className="text-brand font-medium">MultiTrack</span>
      </footer>
    </div>
  );
}

function Item({
  to,
  label,
  end,
}: {
  to: string;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `px-3 py-2.5 rounded-xl text-sm font-medium transition block
         focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/20
         ${
           isActive
             ? "bg-brand text-white shadow-sm"
             : "text-muted-foreground hover:bg-brand-muted hover:text-brand"
         }`
      }
      onClick={() => {
        if (window.innerWidth < 768) (document.activeElement as HTMLElement)?.blur();
      }}
    >
      {label}
    </NavLink>
  );
}
