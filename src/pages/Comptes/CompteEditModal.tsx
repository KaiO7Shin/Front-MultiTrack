import { useEffect, useState } from "react";
import type { CompteUtilisateurRow } from "@/lib/type";
import { Alert } from "@/components/ui/feedback";
import { FormField, inputClassName } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";

type CompteEditModalProps = {
  open: boolean;
  compte: CompteUtilisateurRow | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    username: string;
    email: string;
    phone: string;
    password?: string;
  }) => void;
};

export function CompteEditModal({
  open,
  compte,
  saving,
  error,
  onClose,
  onSubmit,
}: CompteEditModalProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !compte) return;
    setUsername(compte.username);
    setEmail(compte.email);
    setPhone(compte.phone);
    setPassword("");
    setPasswordConfirm("");
    setClientError(null);
  }, [open, compte]);

  const displayError = clientError || error;

  return (
    <Modal
      open={open}
      title="Modifier le compte"
      onClose={onClose}
      disabled={saving}
      size="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setClientError(null);
          const trimmedUsername = username.trim();
          const trimmedPhone = phone.trim();
          if (!trimmedUsername) {
            setClientError("Le nom d'utilisateur est obligatoire.");
            return;
          }
          if (!trimmedPhone) {
            setClientError("Le numéro de téléphone est obligatoire.");
            return;
          }
          const pwd = password.trim();
          const pwdConfirm = passwordConfirm.trim();
          if (pwd !== pwdConfirm) {
            setClientError("Les mots de passe ne correspondent pas.");
            return;
          }
          if (pwd.length > 0 && pwd.length < 8) {
            setClientError("Le mot de passe doit contenir au moins 8 caractères.");
            return;
          }
          onSubmit({
            username: trimmedUsername,
            email: email.trim(),
            phone: trimmedPhone,
            password: pwd.length > 0 ? pwd : undefined,
          });
        }}
        className="space-y-4 px-5 py-4"
      >
        {displayError && (
          <Alert variant="error" role="alert">
            {displayError}
          </Alert>
        )}

        <FormField label="Id" htmlFor="compte-id">
          <input
            id="compte-id"
            className={inputClassName}
            value={compte?.id ?? ""}
            readOnly
            disabled
          />
        </FormField>

        <FormField label="Nom d'utilisateur" htmlFor="compte-username" required>
          <input
            id="compte-username"
            className={inputClassName}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={175}
            required
            disabled={saving}
          />
        </FormField>

        <FormField
          label="Adresse e-mail"
          htmlFor="compte-email"
          hint="Non modifiable (identifiant de connexion)."
        >
          <input
            id="compte-email"
            type="email"
            className={inputClassName}
            value={email}
            readOnly
            disabled
          />
        </FormField>

        <FormField label="Téléphone" htmlFor="compte-phone" required>
          <input
            id="compte-phone"
            className={inputClassName}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={20}
            required
            disabled={saving}
          />
        </FormField>

        <FormField
          label="Nouveau mot de passe"
          htmlFor="compte-password"
          hint="Laisser vide pour conserver le mot de passe actuel."
        >
          <input
            id="compte-password"
            type="password"
            className={inputClassName}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={saving}
          />
        </FormField>

        <FormField label="Confirmer le mot de passe" htmlFor="compte-password-confirm">
          <input
            id="compte-password-confirm"
            type="password"
            className={inputClassName}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
            disabled={saving}
          />
        </FormField>

        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
          <button
            type="button"
            className="btn-secondary px-4 py-2 text-sm"
            onClick={onClose}
            disabled={saving}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
