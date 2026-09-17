import { useState, type FormEvent } from "react";
import { Field } from "../../components/form";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { PhoneField } from "../../components/PhoneField";
import { useSession } from "../../hooks/useSession";
import { formValues } from "../../lib/utils";

export function ProfilePage() {
  const { user, updateProfile } = useSession();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState(user?.phone ?? "");

  if (!user) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const values = formValues(event.currentTarget);
    setError("");
    setLoading(true);
    const result = await updateProfile({
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
    setMessage("Informations mises à jour.");
    setEditing(false);
  }

  function startEditing() {
    if (!user) return;
    setPhone(user.phone);
    setError("");
    setEditing(true);
  }

  function cancelEditing() {
    setError("");
    setEditing(false);
  }

  return (
    <div className="account-content profile">
      <LoadingOverlay visible={loading} />
      <div className="content-title-row">
        <div><p className="eyebrow">PROFIL</p><h2>Mes informations</h2></div>
        {!editing && <button className="button button-light" onClick={startEditing}>Modifier</button>}
      </div>
      {editing ? (
        <form className="form-grid profile-form" onSubmit={submit}>
          {error && <p className="form-error" role="alert">{error}</p>}
          <Field label="Nom d’utilisateur">
            <input name="username" defaultValue={user.username} autoComplete="username" required disabled={loading} />
          </Field>
          <Field label="Adresse e-mail">
            <input name="email" type="email" defaultValue={user.email} autoComplete="email" required disabled={loading} />
          </Field>
          <PhoneField value={phone} onChange={setPhone} disabled={loading} />
          <Field label="Nouveau mot de passe">
            <input name="password" type="password" minLength={8} autoComplete="new-password" placeholder="Laisser vide pour conserver" disabled={loading} />
          </Field>
          <Field label="Confirmer le nouveau mot de passe">
            <input name="passwordConfirmation" type="password" minLength={8} autoComplete="new-password" disabled={loading} />
          </Field>
          <div className="inline-actions">
            <button className="button button-dark" disabled={loading}>Enregistrer</button>
            <button type="button" className="button button-light" onClick={cancelEditing} disabled={loading}>Annuler</button>
          </div>
        </form>
      ) : (
        <dl className="profile-details">
          <div><dt>Nom d’utilisateur</dt><dd>{user.username}</dd></div>
          <div><dt>Adresse e-mail</dt><dd>{user.email}</dd></div>
          <div><dt>Numéro de téléphone</dt><dd>{user.phone}</dd></div>
          <div><dt>Mot de passe</dt><dd>••••••••••••</dd></div>
        </dl>
      )}
      {!editing && message && <p className="form-message" role="status">{message}</p>}
    </div>
  );
}
