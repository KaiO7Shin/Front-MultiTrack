import type { ChangeEvent } from "react";
import { Field } from "../../components/form";
import { DownloadIcon } from "../../components/icons";
import { PARENTAL_AUTHORIZATION_TEMPLATE } from "../../config/site";
import { ACCEPTED_FILES } from "../../types";

export function RegistrationEditDocuments({
  minor,
  saving,
  identityFile,
  medicalFile,
  parentalFile,
  identityUrl,
  medicalUrl,
  parentalUrl,
  identityState,
  medicalState,
  parentalState,
  onIdentity,
  onMedical,
  onParental,
}: {
  minor: boolean;
  saving: boolean;
  identityFile: File | null;
  medicalFile: File | null;
  parentalFile: File | null;
  identityUrl?: string;
  medicalUrl?: string;
  parentalUrl?: string;
  identityState?: string;
  medicalState?: string;
  parentalState?: string;
  onIdentity: (event: ChangeEvent<HTMLInputElement>) => void;
  onMedical: (event: ChangeEvent<HTMLInputElement>) => void;
  onParental: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="file-grid">
      <Field label="Pièce d’identité">
        <input name="identityDocument" type="file" accept={ACCEPTED_FILES} disabled={saving} onChange={onIdentity} />
        <small className="file-hint">{identityFile ? `Nouveau fichier : ${identityFile.name}` : documentHint(identityUrl, identityState)}</small>
      </Field>
      <Field label="Certificat médical">
        <input name="medicalCertificate" type="file" accept={ACCEPTED_FILES} disabled={saving} onChange={onMedical} />
        <small className="file-hint">{medicalFile ? `Nouveau fichier : ${medicalFile.name}` : documentHint(medicalUrl, medicalState)}</small>
      </Field>
      {minor && (
        <Field
          label="Autorisation parentale"
          action={
            <a className="field-label-action" href={PARENTAL_AUTHORIZATION_TEMPLATE.downloadUrl} download="modele-autorisation-parentale.pdf" target="_blank" rel="noopener noreferrer">
              Télécharger <DownloadIcon />
            </a>
          }
        >
          <input name="parentalAuthorization" type="file" accept={ACCEPTED_FILES} disabled={saving} onChange={onParental} />
          <small className="file-hint">{parentalFile ? `Nouveau fichier : ${parentalFile.name}` : documentHint(parentalUrl, parentalState)}</small>
        </Field>
      )}
    </div>
  );
}

function documentHint(url: string | undefined, state: string | undefined) {
  if (state === "EN_COURS") return "Document en cours d’envoi. Un nouveau fichier le remplacera.";
  if (state === "ECHEC") return "L’envoi précédent a échoué. Vous pouvez choisir un nouveau fichier.";
  if (url && /\/api\/me\/registrations\/[^/]+\/documents\//.test(url)) {
    return "Un document est déjà enregistré. Choisissez un fichier seulement pour le remplacer.";
  }
  return "Aucun document pour le moment.";
}
