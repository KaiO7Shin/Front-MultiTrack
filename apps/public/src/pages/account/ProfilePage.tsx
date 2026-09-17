import { useState, type FormEvent } from "react";
import { Field } from "../../components/form";
import { PhoneField } from "../../components/PhoneField";
import { useSession } from "../../hooks/useSession";
import { formValues } from "../../lib/utils";

export function ProfilePage() {
  const { user, updateProfile } = useSession();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState(user?.phone ?? "");

  if (!user) return null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const values = formValues(event.currentTarget);
    const result = updateProfile({
      username: String(values.username),
      email: user.email,
      phone,
      password: String(values.password),
      passwordConfirmation: String(values.passwordConfirmation),
    });
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage("Informations fictives mises à jour.");
    setEditing(false);
  }

  function startEditing() {
    if (!user) return;
    setPhone(user.phone);
    setEditing(true);
  }

  return (
    <div className="account-content profile">
      <div className="content-title-row">
        <div><p className="eyebrow">PROFIL</p><h2>Mes informations</h2></div>
        {!editing && <button className="button button-light" onClick={startEditing}>Modifier</button>}
      </div>
      {editing ? (
        <form className="form-grid profile-form" onSubmit={submit}>
          <Field label="Nom d’utilisateur">
            <input name="username" defaultValue={user.username} autoComplete="username" required />
          </Field>
          <Field label="Adresse e-mail">
            <span className="readonly-value">{user.email}</span>
          </Field>
          <PhoneField value={phone} onChange={setPhone} />
          <Field label="Nouveau mot de passe"><input name="password" type="password" minLength={8} placeholder="Laisser vide pour conserver" /></Field>
          <Field label="Confirmer le nouveau mot de passe"><input name="passwordConfirmation" type="password" minLength={8} /></Field>
          {message && <p className="form-message" role="status">{message}</p>}
          <div className="inline-actions">
            <button className="button button-dark">Enregistrer</button>
            <button type="button" className="button button-light" onClick={() => setEditing(false)}>Annuler</button>
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
