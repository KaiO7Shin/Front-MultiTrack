import { useState, type FormEvent } from "react";
import { Field } from "../../components/form";
import { useSession } from "../../hooks/useSession";
import { formValues } from "../../lib/utils";

export function ProfilePage() {
  const { user, updateProfile } = useSession();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  if (!user) return null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    const result = updateProfile({
      firstName: String(values.firstName),
      lastName: String(values.lastName),
      email: String(values.email),
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

  return (
    <div className="account-content profile">
      <div className="content-title-row">
        <div><p className="eyebrow">PROFIL</p><h2>Mes informations</h2></div>
        {!editing && <button className="button button-light" onClick={() => setEditing(true)}>Modifier</button>}
      </div>
      {editing ? (
        <form className="form-grid profile-form" onSubmit={submit}>
          <div className="two-columns">
            <Field label="Nom"><input name="lastName" defaultValue={user.lastName} required /></Field>
            <Field label="Prénom"><input name="firstName" defaultValue={user.firstName} required /></Field>
          </div>
          <Field label="Adresse e-mail"><input name="email" type="email" defaultValue={user.email} required /></Field>
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
          <div><dt>Nom</dt><dd>{user.lastName}</dd></div>
          <div><dt>Prénom</dt><dd>{user.firstName}</dd></div>
          <div><dt>Adresse e-mail</dt><dd>{user.email}</dd></div>
          <div><dt>Mot de passe</dt><dd>••••••••••••</dd></div>
        </dl>
      )}
      {!editing && message && <p className="form-message" role="status">{message}</p>}
    </div>
  );
}
