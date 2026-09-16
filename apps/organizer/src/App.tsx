import { useAuth } from "./hooks/useAuth";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";

function App() {
  const { authenticated, markAuthenticated, logout } = useAuth();
  return authenticated ? (
    <DashboardPage onLogout={logout} />
  ) : (
    <LoginPage onAuthenticated={markAuthenticated} />
  );
}

export default App;
