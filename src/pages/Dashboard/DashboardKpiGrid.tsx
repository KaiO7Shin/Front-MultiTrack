import { Clock3, UserCheck, Users } from "lucide-react";
import type { ReactNode } from "react";
import { formatCount } from "./dashboardView";
import type { DashboardKpis } from "./dashboardTypes";

const cards: {
  key: keyof DashboardKpis;
  title: string;
  icon: ReactNode;
}[] = [
  {
    key: "inscrits",
    title: "Participants inscrits",
    icon: <Users className="h-4 w-4" />,
  },
  {
    key: "presents",
    title: "Participants présents",
    icon: <UserCheck className="h-4 w-4" />,
  },
  {
    key: "dns",
    title: "DNS",
    icon: <Clock3 className="h-4 w-4" />,
  },
];

export function DashboardKpiGrid({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-3">
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
        Compteurs des participants selon leur statut.
      </p>
    </div>
  );
}
