import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { CheckpointScan } from "./pages/Checkpoint/CheckpointScan";
import multitrackLogo from "./assets/multitrack.svg";

type SessionUser = {
  id: number;
  role: "admin" | "collaborateur" | string;
  point_de_controle_course_id?: number | null;
  name?: string | null;
};

export default function App() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Récupère l'utilisateur du localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    }
  }, []);

  const role = useMemo(() => (user?.role || "").toLowerCase(), [user]);
  const isAdmin = role === "admin";
  const isCollaborateur = role === "collaborateur"; // pointer/checkpoint
  const pcId = user?.point_de_controle_course_id ?? null;

  // Si collaborateur, forcer la nav vers l'interface checkpoint (scan) uniquement
  useEffect(() => {
    if (isCollaborateur && !location.pathname.startsWith("/checkpoint")) {
      navigate("/checkpoint/scan", { replace: true });
    }
  }, [isCollaborateur, location.pathname, navigate]);

  // Fermer le drawer mobile à chaque changement de route
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.replace("/login");
  }

  // ---- LAYOUT COLLABORATEUR (mobile-first, sans sidebar) ----
  if (isCollaborateur) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="font-semibold">
              <img
                src={multitrackLogo}
                alt="MultiTrack Logo"
                className="h-25 w-auto"
              />
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-1
                           border-[#8c9962]/50 text-[#8c9962]"
                title="Point de contrôle assigné"
              >
                PC {pcId ?? "—"}
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

  // ---- LAYOUT ADMIN (sidebar + routes complètes) ----
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Topbar */}
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

          <div className="font-semibold">
            <img
              src={multitrackLogo}
              alt="MultiTrack Logo"
              className="h-25 w-auto"
            />
          </div>

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

      {/* Wrapper */}
      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <aside
          id="sidebar"
          className={`${open ? "block" : "hidden"} md:block bg-white border border-slate-200 rounded-2xl p-3 h-max`}
        >
          <nav className="flex flex-col gap-1">
            <Item to="/dashboard" label="Dashboard" />
            <Item to="/courses" label="Courses" />
            <Item to="/participants" label="Participants" />
            <Item to="/checkpoint/scan" label="Checkpoint" />
            <Item to="/leaderboard" label="Classement" />
            {/* {isAdmin && <Item to="/users" label="Utilisateurs" />} */}
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-h-[70vh]">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} <span className="text-[#8c9962]">MultiTrack</span>
      </footer>
    </div>
  );
}

function Item({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-2 rounded-xl text-sm relative transition
         focus:outline-none focus:ring-2 focus:ring-[#8c9962]/30
         ${
           isActive
             ? "bg-slate-900 text-white"
             : "hover:bg-[#8c9962]/10 text-slate-700"
         }`
      }
      onClick={() => {
        // sur mobile, retire le focus pour fermer le clavier/annuler la highlight
        if (window.innerWidth < 768) (document.activeElement as HTMLElement)?.blur();
      }}
      aria-current={location.pathname === to ? "page" : undefined}
    >
      {/* Indicateur latéral accent (visible quand actif) */}
      <span
        className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full
                   bg-[#8c9962] opacity-0 data-[active=true]:opacity-100"
        data-active={(location.pathname === to).toString()}
        aria-hidden="true"
      />
      {label}
    </NavLink>
  );
}
