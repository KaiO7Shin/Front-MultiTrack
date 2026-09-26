import type { ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "./icons";

export function Field({
  label,
  action,
  error,
  errorId,
  valid = false,
  children,
}: {
  label: string;
  action?: ReactNode;
  error?: string;
  errorId?: string;
  valid?: boolean;
  children: ReactNode;
}) {
  const heading = action ? (
    <span className="field-label-row">
      <span>{label}</span>
      {action}
    </span>
  ) : (
    <span>{label}</span>
  );
  const className = error ? "field is-invalid" : valid ? "field is-valid" : "field";
  const errorNode = error ? (
    <span id={errorId} className="field-error" role="alert">{error}</span>
  ) : null;

  if (action) {
    return <div className={className}>{heading}{children}{errorNode}</div>;
  }

  return <label className={className}>{heading}{children}{errorNode}</label>;
}

export function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="check-row">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

export function WizardActions({
  onPrevious,
  onNext,
  nextDisabled,
}: {
  onPrevious?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
}) {
  if (!onPrevious && !onNext) return null;

  return (
    <div className="wizard-actions">
      {onPrevious ? (
        <button type="button" className="button button-light" onClick={onPrevious}>
          <ArrowLeftIcon /> Retour
        </button>
      ) : <span />}
      {onNext && (
        <button type="button" className="button button-dark" disabled={nextDisabled} onClick={onNext}>
          Continuer <ArrowRightIcon />
        </button>
      )}
    </div>
  );
}
