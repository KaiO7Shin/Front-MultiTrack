import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useSession } from "../hooks/useSession";
import type { Theme } from "../types";
import { MoonIcon, SunIcon } from "./icons";

export function ThemeSwitcher({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-switcher"
      onClick={onToggle}
      aria-label={isDark ? "Activer le thème clair" : "Activer le thème sombre"}
      title={isDark ? "Thème clair" : "Thème sombre"}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

export function SiteHeader() {
  const { authenticated, logout } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-shell header-inner">
        <Link className="brand-link" to="/" aria-label="Accueil TBB" onClick={() => setMenuOpen(false)}>
          <img className="brand-logo" src="/multitrack.svg" alt="MultiTrack" />
          <span className="brand-event">TBB · Trail Bike Beer</span>
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <div className="header-right">
          <nav id="main-navigation" className={`main-nav${menuOpen ? " open" : ""}`} aria-label="Navigation principale">
            <NavLink to="/" end onClick={() => setMenuOpen(false)}>Accueil</NavLink>
            <NavLink to="/courses" onClick={() => setMenuOpen(false)}>Courses</NavLink>
            <NavLink to="/a-propos" onClick={() => setMenuOpen(false)}>À propos</NavLink>
            <NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink>
          </nav>
          {authenticated ? (
            <div className="header-actions">
              <Link className="text-link" to="/espace/inscriptions" onClick={() => setMenuOpen(false)}>Mon espace</Link>
              <button className="button button-ghost button-small" onClick={() => { setMenuOpen(false); logout(); }}>
                Déconnexion
              </button>
            </div>
          ) : (
            <Link className="button button-dark button-small" to="/inscription" onClick={() => setMenuOpen(false)}>
              S’inscrire
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell footer-inner">
        <div className="footer-brand">
          <img className="footer-logo" src="/multitrack.svg" alt="MultiTrack" />
          <span className="footer-tagline">Plus loin ensemble</span>
        </div>
        <p>© 2026 MultiTrack</p>
        <span>Powered by Vahira</span>
      </div>
    </footer>
  );
}

export function Page({
  title,
  intro,
  meta,
  compact,
  action,
  children,
}: {
  title: string;
  intro: string;
  meta?: ReactNode;
  compact?: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="page-section">
      <div className="site-shell">
        <header className={compact ? "page-heading page-heading-open" : "page-heading"}>
          <p className="eyebrow">TBB · TRAIL BIKE BEER</p>
          <div className="page-heading-title">
            <h1>{title}</h1>
            {action}
          </div>
          <p>{intro}</p>
          {meta}
        </header>
        {children}
      </div>
    </section>
  );
}
