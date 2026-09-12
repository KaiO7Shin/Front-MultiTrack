import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

type Crumb = { label: string; to?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          {item.to ? (
            <Link to={item.to} className="hover:text-brand-cta transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-700 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
