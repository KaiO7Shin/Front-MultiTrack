import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/ui/feedback";
import { CourseAxisTick, DashboardPanel, DashboardTooltip } from "./DashboardPanel";
import { formatCount } from "./dashboardView";
import type { PopularityRow } from "./dashboardTypes";

const OLIVE = "#8c9962";

export function CoursePopularityChart({ rows }: { rows: PopularityRow[] }) {
  return (
    <DashboardPanel title="Popularité des courses">
      {rows.length === 0 ? (
        <EmptyState
          title="Aucune course à comparer"
          description="Aucune inscription ne correspond à cette sélection."
        />
      ) : (
        <div className="w-full min-w-0" style={{ height: Math.max(220, rows.length * 56) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={rows}
              margin={{ top: 4, right: 28, left: 8, bottom: 0 }}
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
                cursor={{ fill: "rgba(140, 153, 98, 0.12)" }}
                content={(props) => (
                  <DashboardTooltip
                    active={props.active}
                    label={typeof props.label === "string" ? props.label : undefined}
                    payload={props.payload?.map((item) => ({
                      name: "Inscriptions",
                      value: Number(item.value ?? 0),
                      color: OLIVE,
                    }))}
                  />
                )}
              />
              <Bar
                dataKey="count"
                name="Inscriptions"
                fill={OLIVE}
                radius={[0, 6, 6, 0]}
                barSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardPanel>
  );
}
