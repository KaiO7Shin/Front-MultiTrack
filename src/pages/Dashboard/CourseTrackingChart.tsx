import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CourseAxisTick, DashboardPanel, DashboardTooltip } from "./DashboardPanel";
import { formatCount } from "./dashboardView";
import type { TrackingRow } from "./dashboardTypes";

const SERIES = [
  { key: "finishers", name: "Finishers", color: "#8c9962" },
  { key: "enCourse", name: "En course", color: "#0f172b" },
] as const;

export function CourseTrackingChart({
  rows,
  totals,
}: {
  rows: TrackingRow[];
  totals: { finishers: number; enCourse: number };
}) {
  return (
    <DashboardPanel title="Suivi des courses">
      <ul className="mb-4 grid gap-2 sm:grid-cols-2">
        {SERIES.map((series) => (
          <li
            key={series.key}
            className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2"
          >
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: series.color }}
              />
              {series.name}
            </span>
            <span className="text-sm font-semibold tabular-nums text-brand">
              {formatCount(totals[series.key])}
            </span>
          </li>
        ))}
      </ul>

      <div className="w-full min-w-0" style={{ height: Math.max(240, rows.length * 72) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={rows}
            margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
            barGap={2}
          >
            <CartesianGrid stroke="#e5e7eb" horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => formatCount(value)}
            />
            <YAxis
              type="category"
              dataKey="course"
              width={118}
              tick={CourseAxisTick}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(15, 23, 43, 0.04)" }}
              content={(props) => (
                <DashboardTooltip
                  active={props.active}
                  label={typeof props.label === "string" ? props.label : undefined}
                  payload={props.payload?.map((item) => ({
                    name: String(item.name ?? ""),
                    value: Number(item.value ?? 0),
                    color: item.color,
                  }))}
                />
              )}
            />
            <Legend
              itemSorter={(item) =>
                SERIES.findIndex((series) => series.key === item.dataKey)
              }
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            {SERIES.map((series) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                name={series.name}
                fill={series.color}
                radius={[0, 4, 4, 0]}
                barSize={10}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardPanel>
  );
}
