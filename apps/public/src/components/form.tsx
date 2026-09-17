import type { ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "./icons";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
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
