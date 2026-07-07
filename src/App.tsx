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
  const pcName = user?.assignedControlPoint?.label ?? null;

  // Collaborateur : accès checkpoint uniquement
  useEffect(() => {
    if (isCollaborateur && !location.pathname.startsWith("/checkpoint")) {
      navigate("/checkpoint/scan", { replace: true });
    }
  }, [isCollaborateur, location.pathname, navigate]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    signOut();
    navigate("/login", { replace: true });
  }

  const logo = (
    <Link to="/dashboard" className="inline-block" aria-label="Accueil MultiTrack">
      <img
        src={multitrackLogo}
        alt="MultiTrack Logo"
        className="h-10 w-auto"
      />
    </Link>
  );

  // ---- LAYOUT COLLABORATEUR ----
  if (isCollaborateur) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="font-semibold">{logo}</div>

            <div className="flex items-center gap-2 text-sm">
              <span className="hidden sm:inline rounded-full border px-2 py-1 border-[#8c9962]/50 text-[#8c9962]">
                CHECKPOINT
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-1
                           border-[#8c9962]/50 text-[#8c9962]"
                title="Point de contrôle assigné"
              >
                {pcName ?? "—"}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg border px-3 py-1.5 hover:bg-[#8c9962]/10 transition"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-4 max-w-2xl mx-auto">
          <CheckpointScan />
        </main>

        <footer className="py-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} <span className="text-[#8c9962]">MultiTrack</span>
        </footer>
      </div>
    );
  }

  // ---- LAYOUT ADMIN ----
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
          <button
            className="md:hidden rounded-lg border px-3 py-1.5 hover:bg-[#8c9962]/10"
            onClick={() => setOpen((v) => !v)}
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            aria-controls="sidebar"
          >
            ☰
          </button>

          <div className="font-semibold">{logo}</div>

          <div className="text-sm text-slate-600 flex items-center gap-3">
            {isAdmin && (
              <span className="hidden sm:inline rounded-full border px-2 py-1 border-[#8c9962]/50 text-[#8c9962]">
                ADMIN
              </span>
            )}
            <button
              onClick={handleLogout}
              className="rounded-lg border px-3 py-1.5 hover:bg-[#8c9962]/10 transition"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        <aside
          id="sidebar"
          className={`${open ? "block" : "hidden"} md:block bg-white border border-slate-200 rounded-2xl p-3 h-max`}
        >
          <nav className="flex flex-col gap-1">
            <Item to="/dashboard" label="Action rapide" end />
            <Item to="/courses" label="Courses" end />
            <Item to="/participants" label="Participants" />
            <Item to="/checkpoint/scan" label="Checkpoint" end />
            <Item to="/leaderboard" label="Classement" end />
          </nav>
        </aside>

        <main className="min-h-[70vh]">
          <Outlet />
        </main>
      </div>

      <footer className="py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} <span className="text-[#8c9962]">MultiTrack</span>
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
        `px-3 py-2 rounded-xl text-sm relative transition block
         focus:outline-none focus:ring-2 focus:ring-[#8c9962]/30
         ${
           isActive
             ? "bg-slate-900 text-white"
             : "hover:bg-[#8c9962]/10 text-slate-700"
         }`
      }
      onClick={() => {
        if (window.innerWidth < 768) (document.activeElement as HTMLElement)?.blur();
      }}
    >
      {({ isActive }) => (
        <>
          <span
            className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-[#8c9962] transition-opacity ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden="true"
          />
          {label}
        </>
      )}
    </NavLink>
  );
}
