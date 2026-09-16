import { useState } from "react";
import { ArrowLeftIcon } from "../../components/icons";
import { WIZARD_STEPS } from "../../data/catalog";
import { draftToRunner } from "../../lib/participant";
import { createRegistration } from "../../services/registrationService";
import { getRacePrice } from "../../services/catalogService";
import { EMPTY_DRAFT, type Registration, type RunnerDraft } from "../../types";
import { PaymentModal, Summary } from "./PaymentSummary";
import { RulesStep, RunnerStep } from "./RunnerStep";

export function RegistrationWizard({
  onCancel,
  onValidate,
}: {
  onCancel: () => void;
  onValidate: (registration: Registration) => void;
}) {
  const [step, setStep] = useState(1);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [draft, setDraft] = useState<RunnerDraft>(EMPTY_DRAFT);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const totalAmount = getRacePrice(draft.race);

  function validate(paymentMethod: Registration["paymentMethod"], paymentReference: string) {
    onValidate(createRegistration(draft, { method: paymentMethod, reference: paymentReference }));
  }

  return (
    <div className="wizard">
      <div className="wizard-header">
        <div>
          <p className="eyebrow">NOUVELLE INSCRIPTION</p>
          <h2>Étape {step} sur 3</h2>
        </div>
        <button className="text-button" onClick={onCancel}>Quitter</button>
      </div>
      <ol className="stepper" aria-label="Progression">
        {WIZARD_STEPS.map((label, index) => (
          <li className={step === index + 1 ? "active" : step > index + 1 ? "done" : ""} key={label}>
            <span>{index + 1}</span>{label}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <RulesStep
          accepted={rulesAccepted}
          onAcceptedChange={setRulesAccepted}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <RunnerStep
          draft={draft}
          onChange={setDraft}
          onPrevious={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <section className="wizard-panel">
          <p className="eyebrow">03 — RÉSUMÉ</p>
          <h3>Vérifiez votre inscription</h3>
          <p>Contrôlez les informations du participant avant de valider.</p>
          <Summary runner={draftToRunner(draft)} totalAmount={totalAmount} />
          <div className="wizard-actions">
            <button type="button" className="button button-light" onClick={() => setStep(2)}>
              <ArrowLeftIcon /> Retour
            </button>
            <div className="final-actions">
              <button type="button" className="button button-light" onClick={onCancel}>Annuler</button>
              <button type="button" className="button button-dark" onClick={() => setPaymentOpen(true)}>Valider et payer</button>
            </div>
          </div>
        </section>
      )}
      {paymentOpen && (
        <PaymentModal
          totalAmount={totalAmount}
          onClose={() => setPaymentOpen(false)}
          onValidate={validate}
        />
      )}
    </div>
  );
}
