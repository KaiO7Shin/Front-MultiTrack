import { useState, type ChangeEvent } from "react";
import { Check, Field, WizardActions } from "../../components/form";
import { DownloadIcon } from "../../components/icons";
import { PhoneField } from "../../components/PhoneField";
import { RulesDocumentLinks } from "../../components/RulesDocumentLinks";
import { PARENTAL_AUTHORIZATION_TEMPLATE } from "../../config/site";
import { ACCEPTED_FILES, GENDERS, TSHIRT_SIZES, type RunnerDraft } from "../../types";
import {
  isMinor,
  validateIdentityFile,
  validateMedicalFile,
  validateParentalFile,
} from "../../lib/participant";
import { formatAmount } from "../../lib/utils";
import { useCourses } from "../../hooks/useCourses";
import type { MissingFileNames } from "../../hooks/useRegistrationDraft";
import { REGISTRATION_FILE_KEYS, type RegistrationFileKey } from "../../lib/registrationDraftStorage";
import { findRace, isDuoRace } from "../../services/catalogService";

export function RunnerStep({
  draft,
  error,
  busy = false,
  missingFileNames = {},
  onChange,
  onPrevious,
  onNext,
}: {
  draft: RunnerDraft;
  error?: string;
  busy?: boolean;
  missingFileNames?: MissingFileNames;
  onChange: (draft: RunnerDraft) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const minor = isMinor(draft.birthDate);
  const { courses, loading, error: coursesError } = useCourses();
  const selectedCourse = courses.find((course) => course.id === draft.courseId);
  const price = selectedCourse?.tarif ?? findRace(draft.race)?.price ?? 0;
  // Un fichier refusé bloque l’étape tant qu’il n’a pas été remplacé.
  // Le champ autorisation parentale disparaît pour un majeur : son erreur ne doit plus bloquer.
  const [fileErrors, setFileErrors] = useState<Partial<Record<RegistrationFileKey, string>>>({});
  const blockingFileError = REGISTRATION_FILE_KEYS
    .filter((key) => key !== "parentalFile" || minor)
    .map((key) => fileErrors[key])
    .find(Boolean) ?? "";
  const formError = blockingFileError || error || coursesError || "";

  function update<K extends keyof RunnerDraft>(key: K, value: RunnerDraft[K]) {
    onChange({ ...draft, [key]: value });
  }

  function applyFile(
    event: ChangeEvent<HTMLInputElement>,
    key: RegistrationFileKey,
    validate: (file: File) => string | null,
  ) {
    const file = event.target.files?.[0];
    // Sélecteur annulé : on garde le fichier déjà retenu dans le brouillon.
    if (!file) return;
    const chosenFileError = validate(file);
    if (chosenFileError) {
      event.target.value = "";
    }
    setFileErrors((current) => ({ ...current, [key]: chosenFileError ?? undefined }));
    update(key, chosenFileError ? null : file);
  }

  return (
    <section className="wizard-panel">
      <p className="eyebrow">02 — PARTICIPANT</p>
      <h3>Renseigner le participant</h3>
      <p className="required-note">Les champs marqués d’un * sont obligatoires.</p>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy) onNext();
        }}
      >
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <div className="wizard-subsection">
          <p className="eyebrow">COURSE</p>
          <h4>Informations pour la course</h4>
          <div className="form-grid">
            <div className="two-columns">
              <Field label="Nom *">
                <input
                  name="lastName"
                  value={draft.lastName}
                  onChange={(event) => update("lastName", event.target.value)}
                  placeholder="Rakoto"
                  required
                  disabled={busy}
                />
              </Field>
              <Field label="Prénom *">
                <input
                  name="firstName"
                  value={draft.firstName}
                  onChange={(event) => update("firstName", event.target.value)}
                  placeholder="Jean"
                  required
                  disabled={busy}
                />
              </Field>
            </div>
            <div className="two-columns">
              <Field label="Date de naissance *">
                <input
                  name="birthDate"
                  type="date"
                  value={draft.birthDate}
                  onChange={(event) => {
                    const birthDate = event.target.value;
                    onChange({
                      ...draft,
                      birthDate,
                      parentalFile: isMinor(birthDate) ? draft.parentalFile : null,
                    });
                  }}
                  required
                  disabled={busy}
                />
              </Field>
              <Field label="Genre *">
                <select
                  name="gender"
                  value={draft.gender}
                  onChange={(event) => update("gender", event.target.value)}
                  required
                  disabled={busy}
                >
                  <option value="" disabled>Choisir</option>
                  {GENDERS.map((gender) => (
                    <option key={gender.id} value={gender.label}>{gender.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="race-block">
              <Field label="Course choisie *">
                <select
                  name="race"
                  value={draft.courseId === "" ? "" : String(draft.courseId)}
                  onChange={(event) => {
                    const courseId = Number(event.target.value);
                    const course = courses.find((item) => item.id === courseId);
                    onChange({
                      ...draft,
                      courseId,
                      race: course?.libelle ?? "",
                    });
                  }}
                  required
                  disabled={busy || loading}
                >
                  <option value="" disabled>
                    {loading ? "Chargement des courses…" : "Choisir une course"}
                  </option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.libelle}</option>
                  ))}
                </select>
              </Field>
              {draft.race && (
                <small className="file-hint">
                  {formatAmount(price)}
                  {isDuoRace(draft.race)
                    ? " — tarif duo. Ce challenge se court à deux : chaque personne crée sa propre inscription."
                    : " — un seul participant pour cette inscription."}
                </small>
              )}
            </div>
            <div className="file-grid">
              <Field label="Pièce d’identité (CIN/Carte étudiant) *">
                <input
                  name="identityDocument"
                  type="file"
                  accept={ACCEPTED_FILES}
                  required={!draft.identityFile}
                  disabled={busy}
                  onChange={(event) => applyFile(event, "identityFile", validateIdentityFile)}
                />
                {draft.identityFile && <small className="file-hint">Fichier actuel : {draft.identityFile.name}</small>}
                <MissingFileNotice name={draft.identityFile ? undefined : missingFileNames.identityFile} />
                <small className="file-hint">Formats acceptés : PDF, PNG, JPG, JPEG. Taille max. 5 Mo.</small>
              </Field>
              <Field label="Certificat médical">
                <input
                  name="medicalCertificate"
                  type="file"
                  accept={ACCEPTED_FILES}
                  disabled={busy}
                  onChange={(event) => applyFile(event, "medicalFile", validateMedicalFile)}
                />
                {draft.medicalFile && <small className="file-hint">Fichier actuel : {draft.medicalFile.name}</small>}
                <MissingFileNotice name={draft.medicalFile ? undefined : missingFileNames.medicalFile} />
                <small className="file-hint">Formats acceptés : PDF, PNG, JPG, JPEG. Taille max. 10 Mo.</small>
              </Field>
              {minor && (
                <Field
                  label="Autorisation parentale"
                  action={
                    <a
                      className="field-label-action"
                      href={PARENTAL_AUTHORIZATION_TEMPLATE.downloadUrl}
                      download="modele-autorisation-parentale.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Télécharger <DownloadIcon />
                    </a>
                  }
                >
                  <input
                    name="parentalAuthorization"
                    type="file"
                    accept={ACCEPTED_FILES}
                    disabled={busy}
                    onChange={(event) => applyFile(event, "parentalFile", validateParentalFile)}
                  />
                  {draft.parentalFile && <small className="file-hint">Fichier actuel : {draft.parentalFile.name}</small>}
                  <MissingFileNotice name={draft.parentalFile ? undefined : missingFileNames.parentalFile} />
                  <small className="file-hint">
                    Formats acceptés : PDF, PNG, JPG, JPEG. Taille max. 5 Mo.
                  </small>
                </Field>
              )}
            </div>
            <div className="two-columns">
              <Field label="Taille de t-shirt finisher *">
                <select
                  name="tshirtSize"
                  value={draft.tshirtSize}
                  onChange={(event) => update("tshirtSize", event.target.value)}
                  required
                  disabled={busy}
                >
                  <option value="" disabled>Choisir une taille</option>
                  {TSHIRT_SIZES.map((size) => (
                    <option key={size.id} value={size.alias}>{size.alias}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </div>
        <div className="wizard-subsection">
          <p className="eyebrow">URGENCE</p>
          <h4>En cas d’urgence</h4>
          <div className="form-grid">
            <div className="two-columns">
              <Field label="Nom du contact d’urgence *">
                <input
                  name="emergencyContactName"
                  value={draft.emergencyContactName}
                  onChange={(event) => update("emergencyContactName", event.target.value)}
                  placeholder="Marie Rakoto"
                  required
                  disabled={busy}
                />
              </Field>
              <PhoneField
                label="Numéro de téléphone du contact d’urgence *"
                value={draft.emergencyContactPhone}
                onChange={(value) => update("emergencyContactPhone", value)}
                disabled={busy}
              />
            </div>
          </div>
        </div>
        <WizardActions
          onPrevious={busy ? undefined : onPrevious}
          nextDisabled={busy || loading || Boolean(blockingFileError)}
          onNext={onNext}
        />
      </form>
    </section>
  );
}

function MissingFileNotice({ name }: { name?: string }) {
  if (!name) return null;
  return (
    <small className="file-hint">
      « {name} » n’a pas pu être restauré après le rechargement de la page : merci de le re-sélectionner.
    </small>
  );
}

export function RulesStep({
  accepted,
  error,
  onAcceptedChange,
  onNext,
}: {
  accepted: boolean;
  error?: string;
  onAcceptedChange: (accepted: boolean) => void;
  onNext: () => void;
}) {
  return (
    <section className="wizard-panel">
      <p className="eyebrow">01 — RÈGLEMENT</p>
      <h3>Avant de commencer</h3>
      <p>
        Prenez connaissance du règlement de l’événement avant
        de renseigner le participant.
      </p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <RulesDocumentLinks />
      <Check checked={accepted} onChange={onAcceptedChange}>
        J’ai lu et j’accepte le règlement de l’événement.
      </Check>
      <WizardActions onNext={onNext} />
    </section>
  );
}
