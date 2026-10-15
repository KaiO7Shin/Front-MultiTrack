import { ClipboardCheck, Clock3, UserCheck, Users } from "lucide-react";
import type { ReactNode } from "react";
import { formatCount } from "./dashboardView";
import type { DashboardKpis } from "./dashboardTypes";

const cards: {
  key: keyof DashboardKpis;
  title: string;
  icon: ReactNode;
}[] = [
  {
    key: "participantCount",
    title: "Inscriptions totales",
    icon: <Users className="h-4 w-4" />,
  },
  {
    key: "total",
    title: "Inscriptions en ligne",
    icon: <UserCheck className="h-4 w-4" />,
  },
  {
    key: "validated",
    title: "Inscriptions validées",
    icon: <ClipboardCheck className="h-4 w-4" />,
  },
  {
    key: "pending",
    title: "Inscriptions en attente",
    icon: <Clock3 className="h-4 w-4" />,
  },
];

export function DashboardKpiGrid({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.key} className="page-card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-muted-foreground">{card.title}</p>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-brand-muted text-brand">
                {card.icon}
              </div>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-brand">
              {formatCount(kpis[card.key])}
            </p>
          </article>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Les inscriptions totales correspondent aux dossiers participant pour la
        course sélectionnée. Les inscriptions en ligne, validées et en attente
        suivent la course et la période.
      </p>
    </div>
  );
}
