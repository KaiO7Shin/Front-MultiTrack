import { useState, type ChangeEvent, type FormEvent } from "react";
import { Field } from "../../components/form";
import { PhoneField } from "../../components/PhoneField";
import { needsPartnerTShirt } from "../../lib/duoCourses";
import { isMinor, validateIdentityFile, validateMedicalFile, validateParentalFile, validateRegistrationEdit } from "../../lib/participant";
import { formatAmount } from "../../lib/utils";
import { useCourses } from "../../hooks/useCourses";
import { updateRegistration, validatePayment } from "../../services/registrationService";
import {
  GENDERS,
  PAYMENT_METHODS,
  PAYMENT_REFERENCE_MAX_LENGTH,
  type PaymentMethod,
  type Registration,
} from "../../types";
import { RegistrationCourseField } from "./RegistrationCourseField";
import { RegistrationEditDocuments } from "./RegistrationEditDocuments";
import { TshirtSizeFields } from "./TshirtSizeFields";

export function RegistrationEditModal({
  registration,
  onClose,
  onSaved,
}: {
  registration: Registration;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { runner } = registration;
  const { courses, loading: coursesLoading, error: coursesError } = useCourses();
  const [courseId, setCourseId] = useState(registration.courseId);
  const [race, setRace] = useState(runner.race);
  const [lastName, setLastName] = useState(runner.lastName);
  const [firstName, setFirstName] = useState(runner.firstName);
  const [birthDate, setBirthDate] = useState(runner.birthDate.slice(0, 10));
  const [gender, setGender] = useState(runner.gender);
  const [tshirtSize, setTshirtSize] = useState(runner.tshirtSize);
  const [tshirtSizeBinome, setTshirtSizeBinome] = useState(runner.tshirtSizeBinome ?? "");
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [medicalFile, setMedicalFile] = useState<File | null>(null);
  const [parentalFile, setParentalFile] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">(registration.paymentMethod);
  const [paymentReference, setPaymentReference] = useState(
    registration.paymentReference === "—" ? "" : registration.paymentReference,
  );
  const [emergencyContactName, setEmergencyContactName] = useState(runner.emergencyContactName);
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(runner.emergencyContactPhone);
  const [fileError, setFileError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const minor = isMinor(birthDate);
  const selectedCourse = courses.find((course) => course.id === courseId);
  const amount = selectedCourse?.tarif ?? registration.totalAmount;
  const formError = error || coursesError || "";

  function chooseFile(
    event: ChangeEvent<HTMLInputElement>,
    validate: (file: File) => string | null,
    assign: (file: File | null) => void,
  ) {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      assign(null);
      return;
    }
    const chosenError = validate(file);
    if (chosenError) {
      event.target.value = "";
      setFileError(chosenError);
      setError(chosenError);
      assign(null);
      return;
    }
    setFileError("");
    setError("");
    assign(file);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const input = {
      courseId,
      lastName,
      firstName,
      birthDate,
      gender,
      race,
      tshirtSize,
      tshirtSizeBinome: needsPartnerTShirt(race) ? tshirtSizeBinome : "",
      identityFile,
      medicalFile,
      parentalFile: minor ? parentalFile : null,
      emergencyContactName,
      emergencyContactPhone,
    };
    const clientError = validateRegistrationEdit(input)
      ?? validatePayment({ method: paymentMethod, reference: paymentReference })
      ?? fileError;
    if (clientError) {
      setError(clientError);
      return;
    }
    setSaving(true);
    setError("");
    const result = await updateRegistration(registration.id, input, {
      method: paymentMethod,
      reference: paymentReference,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved(result.message);
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={saving ? undefined : onClose}>
      <section
        className="payment-modal registration-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="registration-edit-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" type="button" aria-label="Fermer" onClick={onClose} disabled={saving}>×</button>
        <h3 id="registration-edit-title">Modifier l’inscription</h3>
        <form className="form-grid" onSubmit={submit} noValidate>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="wizard-subsection">
            <h4>Participant</h4>
            <RegistrationCourseField
              courseId={courseId}
              courses={courses}
              fallbackId={registration.courseId}
              fallbackLabel={runner.race}
              loading={coursesLoading}
              disabled={saving}
              onChange={(nextId, libelle) => { setCourseId(nextId); setRace(libelle); if (!needsPartnerTShirt(libelle)) setTshirtSizeBinome(""); }}
            />
            <div className="two-columns">
              <Field label="Nom *">
                <input name="lastName" value={lastName} onChange={(event) => setLastName(event.target.value)} required disabled={saving} />
              </Field>
              <Field label="Prénom *">
                <input name="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} required disabled={saving} />
              </Field>
            </div>
            <div className="two-columns">
              <Field label="Date de naissance *">
                <input
                  name="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(event) => {
                    const next = event.target.value;
                    setBirthDate(next);
                    if (!isMinor(next)) setParentalFile(null);
                  }}
                  required
                  disabled={saving}
                />
              </Field>
              <Field label="Genre *">
                <select name="gender" value={gender} onChange={(event) => setGender(event.target.value)} required disabled={saving}>
                  <option value="" disabled>Choisir</option>
                  {GENDERS.map((item) => <option key={item.id} value={item.label}>{item.label}</option>)}
                </select>
              </Field>
            </div>
            <TshirtSizeFields
              tshirtSize={tshirtSize}
              tshirtSizeBinome={tshirtSizeBinome}
              race={race}
              busy={saving}
              onTshirtSizeChange={setTshirtSize}
              onTshirtSizeBinomeChange={setTshirtSizeBinome}
            />
          </div>
          <div className="wizard-subsection">
            <h4>Documents et frais</h4>
            <RegistrationEditDocuments
              minor={minor}
              saving={saving}
              identityFile={identityFile}
              medicalFile={medicalFile}
              parentalFile={parentalFile}
              identityUrl={runner.identityDocument}
              medicalUrl={runner.medicalCertificate}
              parentalUrl={runner.parentalAuthorization}
              identityState={registration.documentStates?.identite}
              medicalState={registration.documentStates?.certificat}
              parentalState={registration.documentStates?.autorisation}
              onIdentity={(event) => chooseFile(event, validateIdentityFile, setIdentityFile)}
              onMedical={(event) => chooseFile(event, validateMedicalFile, setMedicalFile)}
              onParental={(event) => chooseFile(event, validateParentalFile, setParentalFile)}
            />
            <div className="two-columns">
              <Field label="Moyen de paiement *">
                <select
                  name="paymentMethod"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                  required
                  disabled={saving}
                >
                  <option value="" disabled>Choisir</option>
                  {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
                </select>
              </Field>
              <Field label="Montant">
                <input name="totalAmount" value={formatAmount(amount)} readOnly disabled />
              </Field>
            </div>
            <Field label="Référence *">
              <input
                name="paymentReference"
                value={paymentReference}
                maxLength={PAYMENT_REFERENCE_MAX_LENGTH}
                onChange={(event) => setPaymentReference(event.target.value)}
                required
                disabled={saving}
              />
            </Field>
          </div>
          <div className="wizard-subsection">
            <h4>Contact d’urgence</h4>
            <div className="two-columns">
              <Field label="Nom *">
                <input name="emergencyContactName" value={emergencyContactName} onChange={(event) => setEmergencyContactName(event.target.value)} required disabled={saving} />
              </Field>
              <PhoneField
                label="Contact *"
                value={emergencyContactPhone}
                onChange={setEmergencyContactPhone}
                disabled={saving}
              />
            </div>
          </div>
          <div className="registration-edit-actions">
            <button type="button" className="button button-outline" onClick={onClose} disabled={saving}>Annuler</button>
            <button type="submit" className="button button-dark" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
