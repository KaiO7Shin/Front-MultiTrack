import { cn } from "@/lib/utils";

export function ParametreSwitch({
  checked,
  disabled,
  label,
  onToggle,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cta focus-visible:ring-offset-2",
        checked ? "bg-brand-cta" : "bg-slate-300",
        "disabled:cursor-not-allowed disabled:opacity-50"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}
