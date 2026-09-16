import { Check, Field, WizardActions } from "../../components/form";
import { DownloadIcon, EyeIcon } from "../../components/icons";
import { ACCEPTED_FILES, GENDERS, type RunnerDraft } from "../../types";
import { getCategory, isDraftComplete, isMinor } from "../../lib/participant";
import { formatAmount, downloadTextFile } from "../../lib/utils";
import { formatRaceLabel, getRacePrice, getRaces, isDuoRace } from "../../services/catalogService";

export function RunnerStep({
  draft,
  onChange,
  onPrevious,
  onNext,
}: {
  draft: RunnerDraft;
  onChange: (draft: RunnerDraft) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const minor = isMinor(draft.birthDate);
  const category = getCategory(draft.birthDate, draft.gender);

  function update<K extends keyof RunnerDraft>(key: K, value: RunnerDraft[K]) {
    onChange({ ...draft, [key]: value });
  }

  return (
    <section className="wizard-panel">
      <p className="eyebrow">02 — PARTICIPANT</p>
      <h3>Renseigner le participant</h3>
      <p className="required-note">Les champs marqués d’un * sont obligatoires.</p>
      <div className="form-grid">
        <div className="two-columns">
          <Field label="Nom *"><input name="lastName" value={draft.lastName} onChange={(event) => update("lastName", event.target.value)} required /></Field>
          <Field label="Prénom *"><input name="firstName" value={draft.firstName} onChange={(event) => update("firstName", event.target.value)} required /></Field>
        </div>
        <div className="two-columns">
          <Field label="Date de naissance *">
            <input name="birthDate" type="date" value={draft.birthDate} onChange={(event) => update("birthDate", event.target.value)} required />
          </Field>
          <Field label="Genre *">
            <select name="gender" value={draft.gender} onChange={(event) => update("gender", event.target.value)} required>
              <option value="" disabled>Choisir</option>
              {GENDERS.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
            </select>
          </Field>
        </div>
        <div className="race-block">
          <div className="two-columns">
            <Field label="Catégorie">
              <span className={category ? "readonly-value" : "readonly-value is-placeholder"}>
                {category || "Déduite de la date de naissance et du genre"}
              </span>
            </Field>
            <Field label="Course choisie *">
              <select name="race" value={draft.race} onChange={(event) => update("race", event.target.value)} required>
                <option value="" disabled>Choisir une course</option>
                {getRaces().map((item) => <option key={item.name} value={formatRaceLabel(item)}>{formatRaceLabel(item)}</option>)}
              </select>
            </Field>
          </div>
          {draft.race && (
            <small className="file-hint">
              {formatAmount(getRacePrice(draft.race))}
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
              required={!draft.identityDocument}
              onChange={(event) => update("identityDocument", event.target.files?.[0]?.name ?? "")}
            />
            {draft.identityDocument && <small className="file-hint">Fichier actuel : {draft.identityDocument}</small>}
            <small className="file-hint">Formats acceptés : PDF, PNG, JPG, JPEG.</small>
          </Field>
          <Field label="Certificat médical">
            <input
              name="medicalCertificate"
              type="file"
              accept={ACCEPTED_FILES}
              onChange={(event) => update("medicalCertificate", event.target.files?.[0]?.name ?? draft.medicalCertificate)}
            />
            {draft.medicalCertificate && <small className="file-hint">Fichier actuel : {draft.medicalCertificate}</small>}
            <small className="file-hint">Formats acceptés : PDF, PNG, JPG, JPEG.</small>
          </Field>
          {minor && (
            <Field label="Autorisation parentale">
              <input
                name="parentalAuthorization"
                type="file"
                accept={ACCEPTED_FILES}
                onChange={(event) => update("parentalAuthorization", event.target.files?.[0]?.name ?? draft.parentalAuthorization)}
              />
              {draft.parentalAuthorization && <small className="file-hint">Fichier actuel : {draft.parentalAuthorization}</small>}
              <small className="file-hint">Formats acceptés : PDF, PNG, JPG, JPEG.</small>
            </Field>
          )}
        </div>
      </div>
      <WizardActions onPrevious={onPrevious} nextDisabled={!isDraftComplete(draft)} onNext={onNext} />
    </section>
  );
}

export function RulesStep({
  accepted,
  onAcceptedChange,
  onNext,
}: {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  onNext: () => void;
}) {
  return (
    <section className="wizard-panel">
      <p className="eyebrow">01 — RÈGLEMENT</p>
      <h3>Avant de commencer</h3>
      <p>
        Prenez connaissance du règlement fictif de l’événement avant
        de renseigner le participant.
      </p>
      <div className="document-row">
        <div><strong>Règlement de l’événement</strong><span>Document de démonstration · TXT</span></div>
        <div className="inline-actions">
          <button className="button button-light" onClick={() => alert("Aperçu fictif du règlement TBB.")}>
            Voir <EyeIcon />
          </button>
          <button className="button button-light" onClick={() => downloadTextFile("reglement-multitrack.txt", "RÈGLEMENT TBB — Document fictif de démonstration.")}>
            Télécharger <DownloadIcon />
          </button>
        </div>
      </div>
      <Check checked={accepted} onChange={onAcceptedChange}>
        J’ai lu et j’accepte le règlement de l’événement.
      </Check>
      <WizardActions nextDisabled={!accepted} onNext={onNext} />
    </section>
  );
}
