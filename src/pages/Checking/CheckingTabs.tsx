type CheckingTab<T extends string> = {
  id: T;
  label: string;
};

export function CheckingTabs<T extends string>({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly CheckingTab<T>[];
  disabled?: boolean;
  onChange: (id: T) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1"
    >
      {options.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={disabled}
            onClick={() => onChange(item.id)}
            className={
              selected
                ? "rounded-lg bg-white px-3 py-2 text-sm font-medium text-brand shadow-sm"
                : "rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 disabled:opacity-50"
            }
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
