import { CURRENCY } from "@/config/site";

export function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[11rem_1fr] gap-1 sm:gap-3 py-2.5 border-b border-border last:border-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

export function formatBirthDate(value: string | undefined | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR");
}

/** Montants BO en Ariary (configurable via `src/config/site.ts`). */
export function formatMoney(value: number | undefined | null) {
  if (value == null || Number.isNaN(value)) return "—";
  const amount = new Intl.NumberFormat(CURRENCY.locale).format(value);
  return `${amount} ${CURRENCY.label}`;
}

/**
 * Formate les numéros malgaches `+261…` en `+261 XX XX XXX XX`
 * (9 chiffres nationaux, comme sur le site public).
 * Les autres numéros sont renvoyés tels quels (trim).
 */
export function formatPhone(value: string | undefined | null) {
  if (!value) return "—";
  const trimmed = value.trim();
  if (!trimmed) return "—";
  const digits = trimmed.replace(/[\s().-]/g, "");
  const match = digits.match(/^\+?261(\d{9})$/);
  if (!match) return trimmed;
  const n = match[1];
  return `+261 ${n.slice(0, 2)} ${n.slice(2, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
}

export function docLabel(present: boolean) {
  return present ? "Fourni" : "Non fourni";
}
