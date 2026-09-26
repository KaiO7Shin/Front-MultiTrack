import { useState, type FormEvent } from "react";
import { Field } from "../components/form";
import {
  EMPTY_PARTICIPANT_FORM,
  loadParticipantIdentity,
  maxBirthDateIso,
  PARTICIPANT_FIELDS,
  participantFormSummary,
  participantIdentityToForm,
  saveParticipantIdentity,
  toParticipantIdentity,
  validateParticipantForm,
  type ParticipantField,
  type ParticipantFormValues,
} from "../lib/participantIdentity";
import { GENDERS, TSHIRT_SIZES } from "../types";

const FIELD_IDS: Record<ParticipantField, string> = {
  lastName: "participant-last-name",
  firstName: "participant-first-name",
  birthDate: "participant-birth-date",
  gender: "participant-gender",
  tshirtSize: "participant-tshirt-size",
};

const GENDER_OPTIONS = [
  ...GENDERS.filter((item) => item.label === "Homme"),
  ...GENDERS.filter((item) => item.label === "Femme"),
];

export function ParticipantPage() {
  const [storedIdentity] = useState(() => loadParticipantIdentity());
  const [values, setValues] = useState<ParticipantFormValues>(() =>
    storedIdentity ? participantIdentityToForm(storedIdentity) : EMPTY_PARTICIPANT_FORM,
  );
  const [errors, setErrors] = useState<Partial<Record<ParticipantField, string>>>({});
  const [attempted, setAttempted] = useState(Boolean(storedIdentity));
  const [saved, setSaved] = useState(Boolean(storedIdentity));

  function update(field: ParticipantField, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    setSaved(false);
    if (attempted) setErrors(validateParticipantForm(next));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateParticipantForm(values);
    setAttempted(true);
    setErrors(nextErrors);

    const firstInvalid = PARTICIPANT_FIELDS.find((field) => nextErrors[field]);
    if (firstInvalid) {
      setSaved(false);
      document.getElementById(FIELD_IDS[firstInvalid])?.focus();
      return;
    }

    const identity = toParticipantIdentity(values);
    if (!identity) return;
    saveParticipantIdentity(identity);
    setValues(participantIdentityToForm(identity));
    setSaved(true);
  }

  const summary = participantFormSummary(errors);

  return (
    <section className="participant-page">
      <div className="participant-accent" aria-hidden="true" />
      <div className="site-shell">
        <header className="participant-header">
          <p className="participant-kicker">TBB · Trail Bike Beer</p>
          <h1>Participant</h1>
          <p className="participant-lead">
            Renseignez vos informations personnelles pour poursuivre votre inscription.
          </p>
        </header>

        <form className="participant-card" noValidate onSubmit={handleSubmit} aria-labelledby="participant-form-title">
          <h2 id="participant-form-title">Informations personnelles</h2>
          <div className="participant-grid">
            {summary && (
              <p className="form-error participant-alert" role="alert">{summary}</p>
            )}
            {saved && !summary && (
              <p className="form-message participant-alert" role="status">
                Vos informations personnelles sont enregistrées.
              </p>
            )}
            <Field
              label="Nom"
              error={errors.lastName}
              errorId="participant-last-name-error"
              valid={attempted && !errors.lastName}
            >
              <input
                id={FIELD_IDS.lastName}
                name="lastName"
                type="text"
                autoComplete="family-name"
                value={values.lastName}
                aria-required="true"
                aria-invalid={Boolean(errors.lastName)}
                aria-describedby={errors.lastName ? "participant-last-name-error" : undefined}
                onChange={(event) => update("lastName", event.target.value)}
              />
            </Field>
            <Field
              label="Prénom"
              error={errors.firstName}
              errorId="participant-first-name-error"
              valid={attempted && !errors.firstName}
            >
              <input
                id={FIELD_IDS.firstName}
                name="firstName"
                type="text"
                autoComplete="given-name"
                value={values.firstName}
                aria-required="true"
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby={errors.firstName ? "participant-first-name-error" : undefined}
                onChange={(event) => update("firstName", event.target.value)}
              />
            </Field>
            <Field
              label="Date de naissance"
              error={errors.birthDate}
              errorId="participant-birth-date-error"
              valid={attempted && !errors.birthDate}
            >
              <input
                id={FIELD_IDS.birthDate}
                name="birthDate"
                type="date"
                autoComplete="bday"
                max={maxBirthDateIso()}
                value={values.birthDate}
                aria-required="true"
                aria-invalid={Boolean(errors.birthDate)}
                aria-describedby={errors.birthDate ? "participant-birth-date-error" : undefined}
                onChange={(event) => update("birthDate", event.target.value)}
              />
            </Field>
            <Field
              label="Genre"
              error={errors.gender}
              errorId="participant-gender-error"
              valid={attempted && !errors.gender}
            >
              <select
                id={FIELD_IDS.gender}
                name="gender"
                autoComplete="sex"
                value={values.gender}
                aria-required="true"
                aria-invalid={Boolean(errors.gender)}
                aria-describedby={errors.gender ? "participant-gender-error" : undefined}
                onChange={(event) => update("gender", event.target.value)}
              >
                <option value="" disabled>Choisir</option>
                {GENDER_OPTIONS.map((gender) => (
                  <option key={gender.id} value={gender.label}>{gender.label}</option>
                ))}
              </select>
            </Field>
            <Field
              label="Taille T-shirt"
              error={errors.tshirtSize}
              errorId="participant-tshirt-error"
              valid={attempted && !errors.tshirtSize}
            >
              <select
                id={FIELD_IDS.tshirtSize}
                name="tshirtSize"
                value={values.tshirtSize}
                aria-required="true"
                aria-invalid={Boolean(errors.tshirtSize)}
                aria-describedby={errors.tshirtSize ? "participant-tshirt-error" : undefined}
                onChange={(event) => update("tshirtSize", event.target.value)}
              >
                <option value="" disabled>Choisir une taille</option>
                {TSHIRT_SIZES.map((size) => (
                  <option key={size.id} value={size.alias}>{size.alias}</option>
                ))}
              </select>
            </Field>
            <div className="participant-actions">
              <button type="submit" className="button button-dark">Continuer</button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
