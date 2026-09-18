import { Navigate, Route, Routes } from "react-router-dom";
import { SiteFooter, SiteHeader, ThemeSwitcher } from "./components/Layout";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { SessionProvider } from "./context/SessionProvider";
import { useSession } from "./hooks/useSession";
import { useTheme } from "./hooks/useTheme";
import { AuthPage } from "./pages/AuthPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { CoursesPage } from "./pages/CoursesPage";
import { HomePage } from "./pages/HomePage";
import { AboutPage, ContactPage } from "./pages/InfoPages";
import { UserArea } from "./pages/account/UserArea";

function AppRoutes() {
  const { authenticated, user, sessionReady } = useSession();

  if (!sessionReady) {
    return <LoadingOverlay visible />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/a-propos" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/inscription" element={<AuthPage initialTab="register" />} />
      <Route path="/connexion" element={<AuthPage initialTab="login" />} />
      <Route
        path="/espace/*"
        element={authenticated && user ? <UserArea /> : <Navigate to="/connexion" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function PublicShell() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="public-app">
      <SiteHeader />
      <main>
        <AppRoutes />
      </main>
      <SiteFooter />
      <ThemeSwitcher theme={theme} onToggle={toggleTheme} />
    </div>
  );
}

function App() {
  return (
    <SessionProvider>
      <PublicShell />
    </SessionProvider>
  );
}

export default App;
