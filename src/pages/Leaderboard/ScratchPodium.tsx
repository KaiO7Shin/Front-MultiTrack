import type { ClassementLigne } from "@/services/classement";

const PLACES = [
  { label: "1re", medal: "#c4a035", wash: "#fbf6e8", ink: "#7a6210" },
  { label: "2e", medal: "#9aa3ad", wash: "#f4f6f8", ink: "#4e5964" },
  { label: "3e", medal: "#b87333", wash: "#fbf4ec", ink: "#7a4e22" },
] as const;

function genreCourt(genre: string) {
  if (genre === "Homme") return "H";
  if (genre === "Femme") return "F";
  return genre.slice(0, 1).toUpperCase() || "—";
}

export function ScratchPodium({ rows }: { rows: ClassementLigne[] }) {
  return (
    <section aria-label="Podium scratch" className="grid grid-cols-3 gap-2 sm:gap-3">
      {PLACES.map((place, index) => {
        const row = rows[index];
        return (
          <article
            key={place.label}
            className="page-card min-w-0 px-3 py-3 sm:px-4"
            style={{ backgroundColor: place.wash, borderColor: place.medal }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: place.ink }}>
              {place.label}
            </p>
            {row ? (
              <>
                <p className="mt-1 truncate text-sm font-semibold text-brand">
                  {row.nom} {row.prenom}
                </p>
                <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
                  <span className="tabular-nums">{row.dossard}</span>
                  <span>{genreCourt(row.genre)}</span>
                  <span className="tabular-nums text-foreground">{row.temps}</span>
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">—</p>
            )}
          </article>
        );
      })}
    </section>
  );
}
