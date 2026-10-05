import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeftIcon } from "../../components/icons";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { WIZARD_STEPS } from "../../data/catalog";
import { draftToRunner, validateDraft } from "../../lib/participant";
import { mapInscription, submitRegistration, validatePayment } from "../../services/registrationService";
import { findRace } from "../../services/catalogService";
import { useCourses } from "../../hooks/useCourses";
import type { MissingFileNames } from "../../hooks/useRegistrationDraft";
import type { Registration, RunnerDraft } from "../../types";
import { ConfirmModal } from "../../components/ConfirmModal";
import { PaymentModal, Summary } from "./PaymentSummary";
import { RulesStep, RunnerStep } from "./RunnerStep";

export function RegistrationWizard({
  step,
  rulesAccepted,
  draft,
  missingFileNames,
  onStepChange,
  onRulesAcceptedChange,
  onDraftChange,
  onCancel,
  onValidate,
  onClearDraft,
}: {
  step: number;
  rulesAccepted: boolean;
  draft: RunnerDraft;
  missingFileNames: MissingFileNames;
  onStepChange: (step: number) => void;
  onRulesAcceptedChange: (accepted: boolean) => void;
  onDraftChange: (draft: RunnerDraft) => void;
  onCancel: () => void;
  onValidate: (registration: Registration) => void;
  onClearDraft: () => Promise<void>;
}) {
  const [stepError, setStepError] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const pendingRegistration = useRef<Registration | null>(null);
  const acknowledging = useRef(false);
  const wizardRef = useRef<HTMLDivElement>(null);
  const { courses } = useCourses();
  const selectedCourse = courses.find((course) => course.id === draft.courseId);
  const totalAmount = selectedCourse?.tarif ?? findRace(draft.race)?.price ?? 0;

  const scrollWizardIntoView = useCallback(() => {
    const node = wizardRef.current;
    if (!node) return;
    const header =
      Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--header-height"),
      ) || 72;
    const top = window.scrollY + node.getBoundingClientRect().top - header - 8;
    const maxTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: Math.min(Math.max(0, top), maxTop), behavior: "auto" });
  }, []);

  useLayoutEffect(() => {
    scrollWizardIntoView();
  }, [step, scrollWizardIntoView]);

  useLayoutEffect(() => {
    if (!stepError) return;
    scrollWizardIntoView();
  }, [stepError, scrollWizardIntoView]);

  function goToStep(next: number) {
    setStepError("");
    onStepChange(next);
  }

  function continueFromRules() {
    if (!rulesAccepted) {
      setStepError("Veuillez accepter le règlement de l’événement.");
      return;
    }
    goToStep(2);
  }

  function continueFromParticipant() {
    const clientError = validateDraft(draft);
    if (clientError) {
      setStepError(clientError);
      return;
    }
    goToStep(3);
  }

  async function validate(paymentMethod: Registration["paymentMethod"], paymentReference: string) {
    const payment = { method: paymentMethod, reference: paymentReference };
    const clientError = validateDraft(draft) ?? validatePayment(payment);
    if (clientError) {
      setStepError(clientError);
      return;
    }
    setStepError("");
    setLoading(true);
    const result = await submitRegistration(draft, payment);
    if (!result.ok) {
      setLoading(false);
      setStepError(result.error);
      return;
    }
    pendingRegistration.current = mapInscription(result.data);
    acknowledging.current = false;
    setLoading(false);
    setPaymentOpen(false);
    setSuccessOpen(true);
  }

  function acknowledgeSuccess() {
    if (acknowledging.current) return;
    acknowledging.current = true;
    const registration = pendingRegistration.current;
    pendingRegistration.current = null;
    setSuccessOpen(false);
    if (!registration) return;
    void (async () => {
      await onClearDraft();
      onValidate(registration);
    })();
  }

  return (
    <div className="wizard" ref={wizardRef}>
      <LoadingOverlay visible={loading} />
      <div className="wizard-header">
        <div>
          <p className="eyebrow">NOUVELLE INSCRIPTION</p>
          <h2>Étape {step} sur 3</h2>
        </div>
        <button className="text-button" onClick={onCancel} disabled={loading}>Quitter</button>
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
          error={stepError}
          onAcceptedChange={(accepted) => {
            setStepError("");
            onRulesAcceptedChange(accepted);
          }}
          onNext={continueFromRules}
        />
      )}

      {step === 2 && (
        <RunnerStep
          draft={draft}
          error={stepError}
          busy={loading}
          missingFileNames={missingFileNames}
          onChange={(next) => {
            setStepError("");
            onDraftChange(next);
          }}
          onPrevious={() => goToStep(1)}
          onNext={continueFromParticipant}
        />
      )}

      {step === 3 && (
        <section className="wizard-panel">
          <p className="eyebrow">03 — RÉSUMÉ</p>
          <h3>Vérifiez votre inscription</h3>
          <p>Contrôlez les informations du participant avant de valider.</p>
          {stepError && !paymentOpen && <p className="form-error" role="alert">{stepError}</p>}
          <Summary runner={draftToRunner(draft)} totalAmount={totalAmount} />
          <div className="wizard-actions">
            <button type="button" className="button button-light" onClick={() => goToStep(2)} disabled={loading}>
              <ArrowLeftIcon /> Retour
            </button>
            <div className="final-actions">
              <button type="button" className="button button-light" onClick={onCancel} disabled={loading}>Annuler</button>
              <button type="button" className="button button-dark" onClick={() => setPaymentOpen(true)} disabled={loading}>Valider et payer</button>
            </div>
          </div>
        </section>
      )}
      {paymentOpen && (
        <PaymentModal
          totalAmount={totalAmount}
          busy={loading}
          error={stepError}
          onClose={() => { if (!loading) setPaymentOpen(false); }}
          onValidate={validate}
        />
      )}
      <ConfirmModal
        open={successOpen}
        title="Inscription envoyée avec succès !"
        message="Votre inscription a bien été enregistrée."
        details="Vous recevrez un e-mail après validation par notre équipe."
        note="Pensez à vérifier vos spams si vous ne recevez pas notre e-mail."
        confirmLabel="Compris"
        showCancel={false}
        icon={<img src="/check.svg" alt="" width={28} height={28} />}
        onCancel={acknowledgeSuccess}
        onConfirm={acknowledgeSuccess}
      />
    </div>
  );
}
