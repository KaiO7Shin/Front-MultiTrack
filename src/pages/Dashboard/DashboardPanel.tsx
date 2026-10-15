import type { ReactNode } from "react";

export function DashboardPanel({
  title,
  description,
  children,
  aside,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="page-card min-w-0 p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-brand">{title}</h2>
          {description && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function CourseAxisTick({
  x = 0,
  y = 0,
  payload,
}: {
  x?: string | number;
  y?: string | number;
  payload?: { value?: string };
}) {
  const words = String(payload?.value ?? "").split(" ");
  const mid = Math.ceil(words.length / 2);
  const first = words.slice(0, mid).join(" ");
  const second = words.slice(mid).join(" ");

  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="end" fill="#0f172b" fontSize={11}>
        <tspan x={0} dy={second ? "-0.4em" : "0.35em"}>
          {first}
        </tspan>
        {second ? (
          <tspan x={0} dy="1.15em">
            {second}
          </tspan>
        ) : null}
      </text>
    </g>
  );
}

type TooltipEntry = {
  name?: string;
  value?: number | string;
  color?: string;
};

export function DashboardTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-md">
      {label != null && label !== "" && (
        <p className="mb-1 font-medium text-brand">{label}</p>
      )}
      <ul className="space-y-1">
        {payload.map((item) => (
          <li key={item.name} className="flex items-center gap-2 text-foreground">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: item.color }}
            />
            <span>{item.name}</span>
            <span className="ml-auto pl-3 tabular-nums font-medium">
              {Number(item.value ?? 0).toLocaleString("fr-FR")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
