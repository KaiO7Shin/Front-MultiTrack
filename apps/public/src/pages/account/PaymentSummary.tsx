import { useState, type FormEvent } from "react";
import { Field } from "../../components/form";
import { PAYMENT_NUMBER } from "../../data/catalog";
import { formatAmount } from "../../lib/utils";
import { PAYMENT_METHODS, type PaymentMethod, type Registration, type Runner } from "../../types";

export function Summary({ runner, totalAmount }: { runner: Runner; totalAmount: number }) {
  return (
    <div className="summary">
      <dl className="summary-facts">
        <div><dt>Nom</dt><dd>{runner.lastName}</dd></div>
        <div><dt>Prénom</dt><dd>{runner.firstName}</dd></div>
        <div><dt>Date de naissance</dt><dd>{new Date(runner.birthDate).toLocaleDateString("fr-FR")}</dd></div>
        <div><dt>Genre</dt><dd>{runner.gender}</dd></div>
        <div><dt>Catégorie</dt><dd>{runner.category}</dd></div>
        <div><dt>Course choisie</dt><dd>{runner.race}</dd></div>
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
  onClose,
  onValidate,
}: {
  totalAmount: number;
  onClose: () => void;
  onValidate: (method: Registration["paymentMethod"], reference: string) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("MVola");
  const [reference, setReference] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reference.trim()) return;
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
        <button className="modal-close" type="button" aria-label="Fermer" onClick={onClose}>×</button>
        <p className="eyebrow">PAIEMENT EN LIGNE · DÉMONSTRATION</p>
        <h3 id="payment-title">Finaliser le paiement</h3>
        <p>Sélectionnez votre opérateur et saisissez la référence reçue après votre paiement.</p>
        <div className="payment-total"><span>Total à payer</span><strong>{formatAmount(totalAmount)}</strong></div>
        <form className="form-grid" onSubmit={submit}>
          <div className="payment-methods" role="radiogroup" aria-label="Mode de paiement">
            {PAYMENT_METHODS.map((option) => (
              <label className={method === option ? "payment-method active" : "payment-method"} key={option}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option}
                  checked={method === option}
                  onChange={() => setMethod(option)}
                />
                <img
                  src={option === "MVola" ? "/mvola-placeholder.svg" : "/orange-money-placeholder.svg"}
                  alt={`${option} — visuel fictif`}
                />
              </label>
            ))}
          </div>
          <div className="payment-instructions">
            <span>Numéro de paiement</span>
            <strong>{PAYMENT_NUMBER}</strong>
            <small>Informations fictives pour le prototype.</small>
          </div>
          <Field label="Référence de paiement *">
            <input
              name="paymentReference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Ex. TBB-123456"
              required
            />
          </Field>
          <button className="button button-dark button-full">Confirmer le paiement</button>
        </form>
      </section>
    </div>
  );
}
