import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Field } from "../components/form";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { PhoneField } from "../components/PhoneField";
import { useSession } from "../hooks/useSession";
import { formValues, MOCK_REQUEST_DELAY_MS, wait } from "../lib/utils";
import type { AuthTab } from "../types";

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
    const result = register({
      username: String(values.username),
      email: String(values.email),
      phone,
      password: String(values.password),
      passwordConfirmation: String(values.passwordConfirmation),
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLoading(true);
    await wait(MOCK_REQUEST_DELAY_MS);
    navigate("/espace/inscriptions");
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    const result = login({
      email: String(values.email),
      password: String(values.password),
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLoading(true);
    await wait(MOCK_REQUEST_DELAY_MS);
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
      <LoadingOverlay visible={loading} />
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
              ? "Les données restent uniquement dans ce prototype et disparaissent au rechargement."
              : "Connectez-vous avec le compte fictif créé pendant cette session."}
          </p>
          {tab === "register" ? (
            <form className="form-grid" onSubmit={submitRegister}>
              <Field label="Nom d’utilisateur">
                <input name="username" autoComplete="username" required />
              </Field>
              <Field label="Adresse e-mail"><input name="email" type="email" autoComplete="email" required /></Field>
              <PhoneField value={phone} onChange={setPhone} disabled={loading} />
              <Field label="Mot de passe"><input name="password" type="password" minLength={8} autoComplete="new-password" required /></Field>
              <Field label="Confirmer le mot de passe"><input name="passwordConfirmation" type="password" minLength={8} autoComplete="new-password" required /></Field>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="button button-dark button-full" disabled={loading}>Créer mon compte</button>
            </form>
          ) : (
            <form className="form-grid" onSubmit={submitLogin}>
              <Field label="Adresse e-mail"><input name="email" type="email" autoComplete="email" required /></Field>
              <Field label="Mot de passe"><input name="password" type="password" autoComplete="current-password" required /></Field>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="button button-dark button-full" disabled={loading}>Se connecter</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
