import { useMemo } from "react";
import {
  LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar,
} from "recharts";
import {
  Trophy, Users, Timer, Activity, Download, FileText, Flag, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

/** Accent vert */
const ACCENT = "#8c9962";

/** --- Données mockables (remplace plus tard par tes appels Axios) --- */
const kpiData = {
  courses: { value: 4, trend: +8, data: [2, 2, 3, 3, 4] },
  participants: { value: 327, trend: +12, data: [210, 240, 260, 300, 327] },
  enCourse: { value: 2, trend: 0, data: [1, 1, 2, 2, 2] },
  passagesToday: { value: 1156, trend: +5, data: [780, 910, 980, 1120, 1156] },
};

const passagesByHour = [
  { h: "06h", v: 12 }, { h: "07h", v: 48 }, { h: "08h", v: 120 }, { h: "09h", v: 210 },
  { h: "10h", v: 260 }, { h: "11h", v: 280 }, { h: "12h", v: 190 }, { h: "13h", v: 100 },
  { h: "14h", v: 80 }, { h: "15h", v: 56 },
];

const leaderboardPreview = [
  { pos: 1, dossard: 124, nom: "Rasoa M.", temps: "01:17:42" },
  { pos: 2, dossard: 89, nom: "Rakoto J.", temps: "01:18:31" },
  { pos: 3, dossard: 301, nom: "Hanitra A.", temps: "01:19:02" },
  { pos: 4, dossard: 55, nom: "Tovo K.", temps: "01:19:40" },
];

export const DashboardPage = () => {
  const kpis = useMemo(
    () => [
      {
        title: "Courses",
        value: kpiData.courses.value,
        trend: kpiData.courses.trend,
        icon: Flag,
        series: kpiData.courses.data,
      },
      {
        title: "Participants",
        value: kpiData.participants.value,
        trend: kpiData.participants.trend,
        icon: Users,
        series: kpiData.participants.data,
      },
      {
        title: "En course",
        value: kpiData.enCourse.value,
        trend: kpiData.enCourse.trend,
        icon: Timer,
        series: kpiData.enCourse.data,
      },
      {
        title: "Passages (aujourd’hui)",
        value: kpiData.passagesToday.value,
        trend: kpiData.passagesToday.trend,
        icon: Activity,
        series: kpiData.passagesToday.data,
      },
    ],
    []
  );

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Action rapide</h1>
          <p className="text-sm text-slate-500">Vue d’ensemble de l’événement en cours</p>
        </div>
        {/* <div className="flex gap-2">
          <button className="rounded-xl border px-3 py-2 text-sm hover:bg-[#8c9962]/10">
            <FileText className="inline-block h-4 w-4 mr-2" /> Rapport du jour
          </button>
          <button className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm hover:opacity-90">
            <Download className="inline-block h-4 w-4 mr-2" /> Export global
          </button>
        </div> */}
      </div>

      {/* KPI Cards
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, idx) => (
          <StatCard
            key={idx}
            title={k.title}
            value={k.value.toLocaleString()}
            trend={k.trend}
            Icon={k.icon}
            series={k.series}
          />
        ))}
      </div>     */}

      {/* Graph + Classement + Actions rapides
      
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-medium">Passages aujourd’hui</h3>
              <p className="text-xs text-slate-500">Répartition par heure</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={passagesByHour} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="h" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "#8c996210" }}
                  contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }}
                />
                <Bar dataKey="v" radius={[8, 8, 0, 0]} fill={ACCENT} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-medium">Top 4 – Général</h3>
              <p className="text-xs text-slate-500">Aperçu en direct (provisoire)</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs border-[#8c9962]/50 text-[#8c9962]">
              <Trophy className="h-3.5 w-3.5" /> Live
            </span>
          </div>
          <ul className="divide-y">
            {leaderboardPreview.map((r) => (
              <li key={r.pos} className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 font-semibold">
                    {r.pos}
                  </span>
                  <div>
                    <div className="text-sm font-medium">{r.nom}</div>
                    <div className="text-xs text-slate-500">Dossard {r.dossard}</div>
                  </div>
                </div>
                <div className="text-sm font-medium tabular-nums">{r.temps}</div>
              </li>
            ))}
          </ul>
          <div className="mt-3 text-right">
            <a
              href="/leaderboard"
              className="text-sm text-slate-700 underline underline-offset-4 hover:text-[#8c9962]"
            >
              Voir le classement complet
            </a>
          </div>
        </div>
      </div>
      */}

      {/* Raccourcis + Stat cartes “images” */}
      <div className="grid gap-4 lg:grid-cols-1">
        {/* Actions rapides */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <h3 className="font-medium mb-3">Actions rapides</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            <QuickAction
              title="Lancer une course"
              subtitle="Démarre officiel"
              icon={<Flag className="h-4 w-4" />}
              href="/courses"
            />
            <QuickAction
              title="Importer des participants"
              subtitle="CSV / Excel"
              icon={<Download className="h-4 w-4" />}
              href="/participants/import"
            />
            <QuickAction
              title="Ajouter un participant"
              subtitle="Formulaire"
              icon={<Users className="h-4 w-4" />}
              href="/participants/add"
            />
            <QuickAction
              title="Pointage Checkpoint"
              subtitle="Mobile"
              icon={<Activity className="h-4 w-4" />}
              href="/checkpoint/scan"
            />
          </div>
        </div>

      </div>
    </section>
  );
};

/** --- Composants --- */

function StatCard({
  title,
  value,
  trend,
  Icon,
  series,
}: {
  title: string;
  value: string | number;
  trend: number;
  Icon: React.ComponentType<any>;
  series: number[];
}) {
  const up = trend > 0;
  const flat = trend === 0;

  const spark = series.map((v, i) => ({ i, v }));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <div className="text-sm text-slate-500">{title}</div>
        <div
          className="h-8 w-8 rounded-xl flex items-center justify-center border"
          style={{ borderColor: `${ACCENT}55`, color: ACCENT }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="text-3xl font-semibold">{value}</div>
        <div
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border
          ${up ? "text-emerald-700 bg-emerald-50 border-emerald-200"
               : flat ? "text-slate-600 bg-slate-50 border-slate-200"
                      : "text-red-700 bg-red-50 border-red-200"}`}
          title={up ? "En hausse" : flat ? "Stable" : "En baisse"}
        >
          {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : flat ? null : <ArrowDownRight className="h-3.5 w-3.5" />}
          {trend}%
        </div>
      </div>

      {/* Sparkline */}
      <div className="mt-3 h-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={spark} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <Line
              type="monotone"
              dataKey="v"
              stroke={ACCENT}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: ACCENT }}
            />
            {/* Tooltip minimaliste */}
            <Tooltip
              cursor={{ stroke: "#e2e8f0" }}
              contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }}
              labelFormatter={() => ""}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function QuickAction({
  title,
  subtitle,
  icon,
  href,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-2xl border p-3 hover:bg-[#8c9962]/10 transition flex items-start gap-3"
    >
      <div
        className="h-9 w-9 rounded-xl flex items-center justify-center border shrink-0"
        style={{ borderColor: `${ACCENT}55`, color: ACCENT }}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium group-hover:text-slate-800">{title}</div>
        <div className="text-xs text-slate-500">{subtitle}</div>
      </div>
    </a>
  );
}

function VisualCard({
  title,
  caption,
  gradientFrom,
  gradientTo,
}: {
  title: string;
  caption: string;
  gradientFrom: string;
  gradientTo: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div
        className="h-32 w-full"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
        }}
        aria-hidden="true"
      />
      <div className="p-4">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-slate-500">{caption}</div>
      </div>
    </div>
  );
}
