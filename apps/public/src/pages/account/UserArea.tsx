import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { useSession } from "../../hooks/useSession";
import { ProfilePage } from "./ProfilePage";
import { RegistrationDetailPage, RegistrationsPage } from "./RegistrationsPage";

export function UserArea() {
  const { user } = useSession();
  if (!user) return <Navigate to="/connexion" replace />;

  return (
    <section className="account-page">
      <div className="site-shell">
        <header className="account-heading">
          <p className="eyebrow">ESPACE PARTICIPANT</p>
          <h1>Bonjour, {user.username}</h1>
        </header>
        <nav className="account-nav" aria-label="Navigation de l’espace participant">
          <NavLink to="/espace/inscriptions">Mes inscriptions</NavLink>
          <NavLink to="/espace/informations">Mes informations</NavLink>
          <NavLink to="/espace/resultats">Mes résultats</NavLink>
        </nav>
        <Routes>
          <Route index element={<Navigate to="inscriptions" replace />} />
          <Route path="inscriptions" element={<RegistrationsPage />} />
          <Route path="inscriptions/:registrationId" element={<RegistrationDetailPage />} />
          <Route path="informations" element={<ProfilePage />} />
          <Route path="resultats" element={<ResultsPage />} />
          <Route path="*" element={<Navigate to="inscriptions" replace />} />
        </Routes>
      </div>
    </section>
  );
}

function ResultsPage() {
  return (
    <div className="account-content empty-results">
      <p className="eyebrow">RÉSULTATS</p>
      <span className="empty-number">—</span>
      <h2>Les résultats ne sont pas encore disponibles.</h2>
      <p>L’événement n’a pas encore commencé. Revenez ici après les premières courses.</p>
    </div>
  );
}
