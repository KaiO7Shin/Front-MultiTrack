import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Download,
  Flag,
  Timer,
  Users,
  Bike,
  Mountain,
} from "lucide-react";
import { Alert, EmptyState, PageLoading } from "@/components/ui/feedback";
import type { CourseType } from "@/lib/type";
import {
  fetchDashboardStats,
  type DashboardStats,
  type LiveCourseSummary,
} from "@/services/dashboard";

const TYPE_LABELS: Record<CourseType, string> = {
  TRAIL: "Trail",
  DH: "Descente",
  XC: "Cross-country",
};

const TYPE_ICONS: Record<CourseType, typeof Flag> = {
  TRAIL: Mountain,
  DH: Bike,
  XC: Activity,
};

export const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetchDashboardStats()
      .then((data) => {
        if (mounted) setStats(data);
      })
      .catch(() => {
        if (mounted) setError("Impossible de charger les statistiques.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <PageLoading message="Chargement du dashboard…" />;
  }

  if (error || !stats) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <Alert variant="error" role="alert">
          {error ?? "Données indisponibles."}
        </Alert>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <span className="badge-live mb-2">Tableau de bord</span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-brand">
            Dashboard
          </h1>
          <p className="page-subtitle">
            Vue d&apos;ensemble de l&apos;événement en temps réel
          </p>
        </div>
        <Link to="/courses" className="btn-secondary text-sm w-full sm:w-auto text-center">
          Gérer les courses →
        </Link>
      </div>

      <div className="rounded-2xl bg-brand text-white p-4 sm:p-6 shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/50">
              MultiTrack
            </p>
            <h2 className="text-lg font-medium">Indicateurs clés</h2>
          </div>
          {stats.courses.enCours > 0 && (
            <span className="badge-live bg-white/10 border-white/20 text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-cta animate-pulse" />
              En direct
            </span>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <HeroStat
            title="Participants"
            value={stats.participants.total}
            subtitle={`${stats.participants.presents} présents`}
          />
          <HeroStat
            title="En course"
            value={stats.participants.enCourse}
            subtitle="Coureurs actifs"
            live={stats.participants.enCourse > 0}
          />
          <HeroStat
            title="Arrivées"
            value={stats.resultats.arrivees}
            subtitle={`${stats.resultats.enAttenteArrivee} en attente`}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          title="Courses en cours"
          value={stats.courses.enCours}
          subtitle={`${stats.courses.total} au total`}
          icon={<Flag className="h-4 w-4" />}
        />
        <StatCard
          title="DNF / DNS"
          value={stats.participants.dnf + stats.participants.dns}
          subtitle={`${stats.participants.dnf} DNF · ${stats.participants.dns} DNS`}
          icon={<Timer className="h-4 w-4" />}
        />
        <StatCard
          title="Disqualifications"
          value={stats.resultats.disqualifications}
          subtitle="DH / XC"
          icon={<Timer className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2 page-card p-5">
          <h3 className="font-medium mb-3">Répartition des courses</h3>
          <div className="space-y-2">
            {(["TRAIL", "DH", "XC"] as CourseType[]).map((type) => {
              const Icon = TYPE_ICONS[type];
              const count = stats.courses.byType[type];
              return (
                <div
                  key={type}
                  className="flex items-center justify-between rounded-xl border px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    <Icon className="h-4 w-4 text-brand" />
                    {TYPE_LABELS[type]}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <StatusPill label="À venir" value={stats.courses.aVenir} />
            <StatusPill label="En cours" value={stats.courses.enCours} accent />
            <StatusPill label="Terminées" value={stats.courses.terminees} />
          </div>
        </div>

        <div className="lg:col-span-3 page-card p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h3 className="font-medium text-brand">Courses en cours</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Participants et chronos par course active
              </p>
            </div>
            {stats.courses.enCours > 0 && (
              <span className="badge-live">Live</span>
            )}
          </div>

          {stats.liveCourses.length === 0 ? (
            <EmptyState
              title="Aucune course en cours"
              description="Lancez une course depuis l'onglet Courses pour voir les stats live ici."
              action={
                <Link to="/courses" className="btn-primary text-sm">
                  Aller aux courses
                </Link>
              }
            />
          ) : (
            <ul className="divide-y">
              {stats.liveCourses.map((course) => (
                <LiveCourseRow key={course.id} course={course} />
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="page-card p-5">
        <h3 className="font-medium text-brand mb-4">Actions rapides</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <QuickAction
            title="Lancer une course"
            subtitle="Changer le statut"
            icon={<Flag className="h-4 w-4" />}
            href="/courses"
          />
          <QuickAction
            title="Importer des participants"
            subtitle="Fichier CSV"
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
            title="Pointage checkpoint"
            subtitle="DH / XC / Trail"
            icon={<Activity className="h-4 w-4" />}
            href="/checkpoint/scan"
          />
        </div>
      </div>
    </section>
  );
};

function HeroStat({
  title,
  value,
  subtitle,
  live = false,
}: {
  title: string;
  value: number;
  subtitle: string;
  live?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white/10 px-4 py-3 border border-white/10">
      <p className="text-xs text-white/60">{title}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
        {value.toLocaleString("fr-FR")}
      </p>
      <p className={`text-xs mt-1 ${live ? "text-brand-cta" : "text-white/50"}`}>
        {live ? `● ${subtitle}` : subtitle}
      </p>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="page-card p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs text-muted-foreground">{title}</p>
        <div className="h-8 w-8 rounded-xl flex items-center justify-center border border-border bg-brand-muted text-brand shrink-0">
          {icon}
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-brand">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
    </div>
  );
}

function StatusPill({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg px-2 py-1.5 text-center ${
        accent ? "bg-brand-muted text-brand" : "bg-secondary text-muted-foreground"
      }`}
    >
      <div className="font-semibold tabular-nums">{value}</div>
      <div>{label}</div>
    </div>
  );
}

function LiveCourseRow({ course }: { course: LiveCourseSummary }) {
  const Icon = TYPE_ICONS[course.type];

  return (
    <li className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center border border-border bg-brand-muted text-brand shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <Link
            to={`/courses/${course.id}`}
            className="text-sm font-medium text-brand hover:text-brand-cta truncate block transition-colors"
          >
            {course.name}
          </Link>
          <p className="text-xs text-slate-500">
            {TYPE_LABELS[course.type]} · {course.participantCount} inscrits
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs sm:justify-end">
        <MetricBadge label="Présents" value={course.presentCount} />
        <MetricBadge label="En course" value={course.enCourseCount} live />
        <MetricBadge label="Arrivées" value={course.arriveeCount} />
        <MetricBadge label="Départs" value={course.departCount} />
      </div>
    </li>
  );
}

function MetricBadge({
  label,
  value,
  live = false,
}: {
  label: string;
  value: number;
  live?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 tabular-nums ${
        live && value > 0
          ? "border-brand-cta/30 bg-brand-cta/10 text-brand-cta"
          : "border-border text-muted-foreground"
      }`}
    >
      {label} <strong>{value}</strong>
    </span>
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
    <Link
      to={href}
      className="group rounded-xl border border-border p-3 hover:border-brand-cta/30 hover:bg-brand-muted transition flex items-start gap-3"
    >
      <div className="h-9 w-9 rounded-xl flex items-center justify-center border border-border bg-brand-muted text-brand shrink-0 group-hover:text-brand-cta transition-colors">
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-brand group-hover:text-brand-cta transition-colors">
          {title}
        </div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </Link>
  );
}
