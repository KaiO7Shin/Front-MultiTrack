import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/ui/feedback";
import { FormField, selectClassName } from "@/components/ui/form-field";
import { DashboardPanel, DashboardTooltip } from "./DashboardPanel";
import { formatCount, type TrendMonth } from "./dashboardView";
import { DASHBOARD_MONTHS, type TrendPoint } from "./dashboardTypes";

const NAVY = "#0f172b";

export function RegistrationsTrendChart({
  points,
  seriesName,
  trendMonth,
  years,
  onTrendMonthChange,
}: {
  points: TrendPoint[];
  seriesName: string;
  trendMonth: TrendMonth;
  years: number[];
  onTrendMonthChange: (trendMonth: TrendMonth) => void;
}) {
  const hasValues = points.some((point) => point.count > 0);
  const yearOptions = years.includes(trendMonth.year)
    ? years
    : [trendMonth.year, ...years].sort((a, b) => b - a);

  return (
    <DashboardPanel
      title="Évolution des inscriptions"
      aside={
        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
          <FormField label="Mois" htmlFor="trend-month">
            <select
              id="trend-month"
              className={selectClassName}
              value={trendMonth.month}
              onChange={(event) =>
                onTrendMonthChange({
                  ...trendMonth,
                  month: Number(event.target.value),
                })
              }
            >
              {DASHBOARD_MONTHS.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Année" htmlFor="trend-year">
            <select
              id="trend-year"
              className={selectClassName}
              value={trendMonth.year}
              onChange={(event) =>
                onTrendMonthChange({
                  ...trendMonth,
                  year: Number(event.target.value),
                })
              }
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      }
    >
      {hasValues ? (
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={points.length > 14 ? 4 : 0}
                minTickGap={12}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, "auto"]}
                width={36}
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => formatCount(value)}
              />
              <Tooltip
                content={(props) => (
                  <DashboardTooltip
                    active={props.active}
                    label={props.label}
                    payload={props.payload?.map((item) => ({
                      name: seriesName,
                      value: Number(item.value ?? 0),
                      color: NAVY,
                    }))}
                  />
                )}
              />
              <Line
                type="monotone"
                dataKey="count"
                name={seriesName}
                stroke={NAVY}
                strokeWidth={2}
                dot={{ r: 3, fill: NAVY, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState
          title="Aucune inscription"
          description="Aucune nouvelle inscription sur ce mois."
        />
      )}
    </DashboardPanel>
  );
}
