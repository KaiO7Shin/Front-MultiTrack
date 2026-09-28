import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/feedback";
import { FormField, inputClassName, selectClassName } from "@/components/ui/form-field";
import {
  EMPTY_PARTICIPANT_FORM,
  GENDERS,
  loadParticipantIdentity,
  maxBirthDateIso,
  PARTICIPANT_FIELDS,
  participantFormSummary,
  participantIdentityToForm,
  saveParticipantIdentity,
  toParticipantIdentity,
  TSHIRT_SIZES,
  validateParticipantForm,
  type ParticipantField,
  type ParticipantFormValues,
} from "@/lib/participantIdentity";

const FIELD_IDS: Record<ParticipantField, string> = {
  lastName: "participant-last-name",
  firstName: "participant-first-name",
  birthDate: "participant-birth-date",
  gender: "participant-gender",
  tshirtSize: "participant-tshirt-size",
};

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
    <section className="page-section">
      <div>
        <h1 className="page-title">Informations participant</h1>
        <p className="page-subtitle">
          Renseignez les informations personnelles du participant.
        </p>
      </div>

      <form
        className="bg-white border rounded-2xl p-4 sm:p-6 grid gap-4 sm:grid-cols-2"
        noValidate
        onSubmit={handleSubmit}
        aria-labelledby="participant-form-title"
      >
        <h2 id="participant-form-title" className="sm:col-span-2 text-base font-semibold text-slate-800">
          Informations personnelles
        </h2>

        {summary && (
          <div className="sm:col-span-2">
            <Alert variant="error" role="alert">{summary}</Alert>
          </div>
        )}
        {saved && !summary && (
          <div className="sm:col-span-2">
            <Alert variant="success" role="status">
              Les informations personnelles sont enregistrées.
            </Alert>
          </div>
        )}

        <FormField label="Nom" htmlFor={FIELD_IDS.lastName} required>
          <input
            id={FIELD_IDS.lastName}
            name="lastName"
            type="text"
            autoComplete="family-name"
            className={inputClassName}
            value={values.lastName}
            aria-required="true"
            aria-invalid={Boolean(errors.lastName)}
            onChange={(event) => update("lastName", event.target.value)}
          />
        </FormField>

        <FormField label="Prénom" htmlFor={FIELD_IDS.firstName} required>
          <input
            id={FIELD_IDS.firstName}
            name="firstName"
            type="text"
            autoComplete="given-name"
            className={inputClassName}
            value={values.firstName}
            aria-required="true"
            aria-invalid={Boolean(errors.firstName)}
            onChange={(event) => update("firstName", event.target.value)}
          />
        </FormField>

        <FormField label="Date de naissance" htmlFor={FIELD_IDS.birthDate} required>
          <input
            id={FIELD_IDS.birthDate}
            name="birthDate"
            type="date"
            autoComplete="bday"
            max={maxBirthDateIso()}
            className={inputClassName}
            value={values.birthDate}
            aria-required="true"
            aria-invalid={Boolean(errors.birthDate)}
            onChange={(event) => update("birthDate", event.target.value)}
          />
        </FormField>

        <FormField label="Genre" htmlFor={FIELD_IDS.gender} required>
          <select
            id={FIELD_IDS.gender}
            name="gender"
            autoComplete="sex"
            className={selectClassName}
            value={values.gender}
            aria-required="true"
            aria-invalid={Boolean(errors.gender)}
            onChange={(event) => update("gender", event.target.value)}
          >
            <option value="" disabled>
              Choisir
            </option>
            {GENDERS.map((gender) => (
              <option key={gender.id} value={gender.label}>
                {gender.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Taille T-shirt" htmlFor={FIELD_IDS.tshirtSize} required className="sm:col-span-2">
          <select
            id={FIELD_IDS.tshirtSize}
            name="tshirtSize"
            className={selectClassName}
            value={values.tshirtSize}
            aria-required="true"
            aria-invalid={Boolean(errors.tshirtSize)}
            onChange={(event) => update("tshirtSize", event.target.value)}
          >
            <option value="" disabled>
              Choisir une taille
            </option>
            {TSHIRT_SIZES.map((size) => (
              <option key={size.id} value={size.alias}>
                {size.alias}
              </option>
            ))}
          </select>
        </FormField>

        <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2">
          <button
            type="submit"
            className="w-full sm:w-auto rounded-xl bg-navy text-white px-4 py-2.5 text-sm"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </section>
  );
}
