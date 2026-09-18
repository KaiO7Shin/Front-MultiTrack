import { inscriptionStatusPresentation } from "@multitrack/types";

export function StatusPill({ status }: { status: string }) {
  const { label, className } = inscriptionStatusPresentation(status);
  return <span className={className}>{label}</span>;
}
