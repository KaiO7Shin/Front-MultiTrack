import { useState, type FormEvent } from "react";
import { Field } from "../../components/form";
import { InfoIcon } from "../../components/icons";
import { PAYMENT, PAYMENT_MOTIF } from "../../config/site";
import { formatAmount } from "../../lib/utils";
import { validatePayment } from "../../services/registrationService";
import {
  PAYMENT_METHODS,
  PAYMENT_REFERENCE_MAX_LENGTH,
  type PaymentMethod,
  type Registration,
  type Runner,
} from "../../types";

export function Summary({ runner, totalAmount }: { runner: Runner; totalAmount: number }) {
  return (
    <div className="summary">
      <dl className="summary-facts">
        <div><dt>Nom</dt><dd>{runner.lastName}</dd></div>
        <div><dt>Prénom</dt><dd>{runner.firstName}</dd></div>
        <div><dt>Date de naissance</dt><dd>{new Date(runner.birthDate).toLocaleDateString("fr-FR")}</dd></div>
        <div><dt>Genre</dt><dd>{runner.gender}</dd></div>
        <div><dt>Course choisie</dt><dd>{runner.race}</dd></div>
        <div><dt>Taille de t-shirt finisher</dt><dd>{runner.tshirtSize}</dd></div>
        <div><dt>Nom du contact d’urgence</dt><dd>{runner.emergencyContactName}</dd></div>
        <div><dt>Téléphone du contact d’urgence</dt><dd>{runner.emergencyContactPhone}</dd></div>
      </dl>
      <div className="summary-payment">
        <p className="summary-payment-methods">
          <span>Moyens acceptés sur ce site</span>
          <strong>MVola ou Orange Money</strong>
        </p>
        <p className="summary-payment-amount">
          <span>Montant</span>
          <strong>{formatAmount(totalAmount)}</strong>
        </p>
      </div>
    </div>
  );
}

export function PaymentModal({
  totalAmount,
  busy = false,
  error,
  onClose,
  onValidate,
}: {
  totalAmount: number;
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onValidate: (method: Registration["paymentMethod"], reference: string) => void | Promise<void>;
}) {
  const [method, setMethod] = useState<PaymentMethod>("MVola");
  const [reference, setReference] = useState("");
  const [localError, setLocalError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const paymentError = validatePayment({ method, reference });
    if (paymentError) {
      setLocalError(paymentError);
      return;
    }
    setLocalError("");
    onValidate(method, reference.trim());
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="payment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" type="button" aria-label="Fermer" onClick={onClose} disabled={busy}>×</button>
        <p className="eyebrow">PAIEMENT EN LIGNE</p>
        <h3 id="payment-title">Finaliser le paiement</h3>
        <p>Sélectionnez votre opérateur et saisissez la référence reçue après votre paiement.</p>
        <div className="payment-total"><span>Total à payer</span><strong>{formatAmount(totalAmount)}</strong></div>
        <form className="form-grid" onSubmit={submit} noValidate>
          {(localError || error) && <p className="form-error" role="alert">{localError || error}</p>}
          <div className="payment-methods" role="radiogroup" aria-label="Mode de paiement">
            {PAYMENT_METHODS.map((option) => (
              <label
                className={method === option ? "payment-method active" : "payment-method"}
                data-operator={option}
                key={option}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option}
                  checked={method === option}
                  disabled={busy}
                  onChange={() => { setLocalError(""); setMethod(option); }}
                />
                <img src={PAYMENT[option].logo} alt={PAYMENT[option].alt} />
              </label>
            ))}
          </div>
          <div className="payment-instructions">
            <span>Numéro de paiement</span>
            <strong>{PAYMENT[method].number}</strong>
            <p className="payment-recipient">Au nom de {PAYMENT[method].recipient}</p>
            <aside className="payment-tip" aria-label="Conseil de paiement">
              <InfoIcon />
              <div>
                <p className="payment-tip-title">Conseil de paiement</p>
                <p>
                  Lors du paiement, indiquez comme motif : <strong>{PAYMENT_MOTIF.example}</strong>
                </p>
              </div>
            </aside>
          </div>
          <Field label="Référence de paiement *">
            <input
              name="paymentReference"
              value={reference}
              maxLength={PAYMENT_REFERENCE_MAX_LENGTH}
              onChange={(event) => { setLocalError(""); setReference(event.target.value); }}
              placeholder="XXXXXYYYYY"
              disabled={busy}
              required
            />
          </Field>
          <button className="button button-dark button-full" disabled={busy}>Confirmer le paiement</button>
        </form>
      </section>
    </div>
  );
}
