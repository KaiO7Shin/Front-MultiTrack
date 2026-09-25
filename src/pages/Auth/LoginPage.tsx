import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import multitrackLogo from "@/assets/multitrack.svg";
import { Alert, PageLoading } from "@/components/ui/feedback";
import {
  ROLE_CHECKPOINT,
  ROLE_ORGANIZER,
  homePathForRole,
  useAuth,
} from "../../lib/auth";

function isPathAllowedForRole(path: string, role: number) {
  if (role === ROLE_ORGANIZER) return path.startsWith("/organisateur");
  if (role === ROLE_CHECKPOINT) return path.startsWith("/checkpoint");
  return true;
}

export const LoginPage = () => {
  const [passcode, setPasscode] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: sessionLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from
    ?.pathname;

  if (sessionLoading) {
    return <PageLoading message="Vérification de la session…" />;
  }

  if (user) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const session = await signIn(passcode);
      const fallback = homePathForRole(session.role);
      const next =
        from &&
        from !== "/login" &&
        from !== "/" &&
        isPathAllowedForRole(from, session.role)
          ? from
          : fallback;
      navigate(next, { replace: true });
    } catch (err: unknown) {
      const axiosMessage =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data &&
        typeof err.response.data.message === "string"
          ? err.response.data.message
          : null;
      const message =
        axiosMessage ||
        (err instanceof Error ? err.message : null) ||
        "Passcode invalide";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-3 sm:px-4 py-6">
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,77,48,0.08), transparent 40%), radial-gradient(circle at 80% 0%, rgba(26,43,72,0.06), transparent 35%)",
        }}
        aria-hidden
      />

      <form
        onSubmit={onSubmit}
        className="relative z-10 w-full max-w-sm page-card p-6 sm:p-8 space-y-6"
      >
        <div className="text-center flex flex-col items-center justify-center space-y-3">
          <img src={multitrackLogo} alt="MultiTrack Logo" className="h-20 sm:h-24 w-auto mx-auto" />
          <div>
            <h1 className="text-xl font-semibold text-brand tracking-tight">
              Bienvenue sur MultiTrack
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez vos événements sportifs de A à Z
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="error" role="alert">
            {error}
          </Alert>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-brand" htmlFor="passcode">
            Passcode
          </label>
          <div className="relative">
            <input
              id="passcode"
              type={show ? "text" : "password"}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              autoFocus
              placeholder="••••••"
              className="w-full rounded-xl border border-border px-3 py-2.5 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-brand-cta/30"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700 flex items-center"
              aria-label={show ? "Masquer le passcode" : "Afficher le passcode"}
            >
              {show ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-10.5-7.5a10.05 10.05 0 012.11-3.36m3.39-2.83A9.98 9.98 0 0112 5c5 0 9.27 3.11 10.5 7.5a10.05 10.05 0 01-2.11 3.36m-3.39 2.83L4.22 4.22m0 0L19.78 19.78" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0c0 5-4.48 9-10 9S2 17 2 12s4.48-9 10-9 10 4 10 9z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Un même écran pour l’administrateur, l’organisateur et le pointeur.
            Le passcode détermine l’espace ouvert.
          </p>
        </div>

        <button
          className="btn-primary w-full py-2.5"
          disabled={!passcode || loading}
        >
          {loading && (
            <span className="inline-block h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
          )}
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        <div className="text-xs text-center text-muted-foreground space-y-1">
          <p>Comptes de démo (front) : <code>ADMIN</code>, <code>ORGA</code>, <code>CHECKPOINT</code></p>
        </div>
      </form>
    </div>
  );
};
