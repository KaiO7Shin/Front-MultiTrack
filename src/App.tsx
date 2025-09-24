import { Outlet, NavLink } from "react-router-dom";
import { useState } from "react";

export default function App() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Topbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
          <button
            className="md:hidden rounded-lg border px-3 py-1.5"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <div className="font-semibold">MultiTrack</div>
          <div className="text-sm text-slate-500">MVP</div>
        </div>
      </header>

      {/* Wrapper */}
      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <aside
          className={`${
            open ? "block" : "hidden"
          } md:block bg-white border border-slate-200 rounded-2xl p-3 h-max`}
        >
          <nav className="flex flex-col gap-1">
            <Item to="/dashboard" label="Dashboard" />
            <Item to="/courses" label="Courses" />
            <Item to="/participants" label="Participants" />
            <Item to="/checkpoint/scan" label="Checkpoint" />
            <Item to="/leaderboard" label="Classement" />
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-h-[70vh]">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} MultiTrack
      </footer>
    </div>
  );
}

function Item({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-2 rounded-xl text-sm ${
          isActive
            ? "bg-slate-900 text-white"
            : "hover:bg-slate-100 text-slate-700"
        }`
      }
      onClick={() => window.innerWidth < 768 && (document.activeElement as HTMLElement)?.blur()}
    >
      {label}
    </NavLink>
  );
}
