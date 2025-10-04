import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import multitrackLogo from "@/assets/multitrack.svg";
import { useAuth } from "../../lib/auth";

export const LoginPage = () => {
  const [passcode, setPasscode] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/dashboard";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await signIn(passcode);                // met à jour le contexte -> re-render
      navigate(from, { replace: true });     // va où l’utilisateur voulait aller
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Passcode invalide");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-900">
      {/* Fond image trail + vélo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/assets/bg-trail.png')`, // ⚠️ place ton image ici (dans /public/assets/)
        }}
      />
      {/* Overlay sombre pour lisibilité */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Box login */}
      <form
        onSubmit={onSubmit}
        className="relative z-10 w-full max-w-sm bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-lg space-y-5"
      >
        {/* header */}
        <div className="text-center flex flex-col items-center justify-center space-y-2">
          <img
            src={multitrackLogo}
            alt="MultiTrack Logo"
            className="h-28 w-auto mx-auto"
          />
          <h1 className="text-xl font-semibold text-slate-800">
            Bienvenue sur MultiTrack
          </h1>
          <p className="text-xs text-slate-500">Trail & Bike race management</p>
        </div>

        {/* input */}
        <div className="space-y-2">
          <label className="text-sm text-slate-600" htmlFor="passcode">
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
              className="w-full rounded-xl border px-3 py-2 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-[#8c9962]/50"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700 flex items-center"
              aria-label={show ? "Masquer le passcode" : "Afficher le passcode"}
            >
              {show ? (
                // Eye-off
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-10.5-7.5a10.05 10.05 0 012.11-3.36m3.39-2.83A9.98 9.98 0 0112 5c5 0 9.27 3.11 10.5 7.5a10.05 10.05 0 01-2.11 3.36m-3.39 2.83L4.22 4.22m0 0L19.78 19.78" />
                </svg>
              ) : (
                // Eye
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0c0 5-4.48 9-10 9S2 17 2 12s4.48-9 10-9 10 4 10 9z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Chaque contrôleur possède un passcode lié à un point de contrôle.
          </p>
        </div>

        {/* error */}
        {error && (
          <div className="text-sm rounded-lg bg-red-50 text-red-700 px-3 py-2 border border-red-200">
            {error}
          </div>
        )}

        {/* submit */}
        <button
          className="w-full rounded-xl bg-[#8c9962] text-white py-2 text-sm disabled:opacity-60 flex items-center justify-center gap-2 shadow hover:opacity-90"
          disabled={!passcode || loading}
        >
          {loading && (
            <span className="inline-block h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
          )}
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        {/* footer tips */}
        <div className="text-xs text-center text-slate-500">
          Besoin d’aide ? Demande à l’admin de te (ré)générer un passcode.
        </div>
      </form>
    </div>
  );
};
