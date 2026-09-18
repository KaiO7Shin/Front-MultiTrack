import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Field } from "../components/form";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { PhoneField } from "../components/PhoneField";
import { useSession } from "../hooks/useSession";
import { formValues, wait } from "../lib/utils";
import type { AuthTab } from "../types";

const LOGIN_MIN_OVERLAY_MS = 3_000;

export function AuthPage({ initialTab }: { initialTab: AuthTab }) {
  const [tab, setTab] = useState(initialTab);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();
  const { register, login } = useSession();

  async function submitRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    setError("");
    setLoading(true);
    const result = await register({
      username: String(values.username),
      email: String(values.email),
      phone,
      password: String(values.password),
      passwordConfirmation: String(values.passwordConfirmation),
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate("/espace/inscriptions");
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    setError("");
    setLoading(true);
    const minOverlay = wait(LOGIN_MIN_OVERLAY_MS);
    const result = await login({
      email: String(values.email),
      password: String(values.password),
    });
    if (!result.ok) {
      setLoading(false);
      setError(result.error);
      return;
    }
    await minOverlay;
    navigate("/espace/inscriptions");
  }

  function changeTab(nextTab: AuthTab) {
    if (loading) return;
    setTab(nextTab);
    setError("");
    setPhone("");
  }

  return (
    <section className="auth-page">
      <LoadingOverlay visible={loading} delayMs={tab === "login" ? 0 : undefined} />
      <div className="auth-box">
        <div className="auth-tabs" role="tablist" aria-label="Accès au compte">
          <button className={tab === "register" ? "active" : ""} onClick={() => changeTab("register")} disabled={loading}>
            S’inscrire
          </button>
          <button className={tab === "login" ? "active" : ""} onClick={() => changeTab("login")} disabled={loading}>
            Se connecter
          </button>
        </div>
        <div className="auth-content">
          <p className="eyebrow">{tab === "register" ? "NOUVEAU COMPTE" : "BON RETOUR"}</p>
          <h1>{tab === "register" ? "Créer mon espace" : "Accéder à mon espace"}</h1>
          <p className="form-intro">
            {tab === "register"
              ? "Créez votre compte pour gérer vos inscriptions à l’événement."
              : "Connectez-vous pour retrouver vos inscriptions."}
          </p>
          {tab === "register" ? (
            <form className="form-grid" onSubmit={submitRegister}>
              {error && <p className="form-error" role="alert">{error}</p>}
              <Field label="Nom d’utilisateur">
                <input name="username" autoComplete="username" placeholder="jean.rakoto" required />
              </Field>
              <Field label="Adresse e-mail"><input name="email" type="email" autoComplete="email" placeholder="jean.rakoto@email.com" required /></Field>
              <PhoneField value={phone} onChange={setPhone} disabled={loading} />
              <Field label="Mot de passe"><input name="password" type="password" minLength={8} autoComplete="new-password" required /></Field>
              <Field label="Confirmer le mot de passe"><input name="passwordConfirmation" type="password" minLength={8} autoComplete="new-password" required /></Field>
              <button className="button button-dark button-full" disabled={loading}>Créer mon compte</button>
            </form>
          ) : (
            <form className="form-grid" onSubmit={submitLogin}>
              {error && <p className="form-error" role="alert">{error}</p>}
              <Field label="Adresse e-mail"><input name="email" type="email" autoComplete="email" placeholder="jean.rakoto@email.com" required /></Field>
              <Field label="Mot de passe"><input name="password" type="password" autoComplete="current-password" required /></Field>
              <button className="button button-dark button-full" disabled={loading}>Se connecter</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
