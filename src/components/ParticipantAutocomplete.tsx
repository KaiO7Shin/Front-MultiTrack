import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { ParticipantProjection } from "@/lib/type";
import { formatParticipantName } from "@/lib/utils";

type ParticipantAutocompleteProps = {
  participants: ParticipantProjection[];
  value: ParticipantProjection | null;
  onChange: (participant: ParticipantProjection | null) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function ParticipantAutocomplete({
  participants,
  value,
  onChange,
  disabled = false,
  placeholder = "Rechercher par nom, prénom ou dossard…",
}: ParticipantAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setQuery(
        `${value.numDossard} — ${formatParticipantName(value.prenom, value.nom)}`
      );
    } else {
      setQuery("");
    }
  }, [value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || (value && query.includes("—"))) {
      return participants.slice(0, 12);
    }
    return participants
      .filter((p) => {
        const full = formatParticipantName(p.prenom, p.nom).toLowerCase();
        return (
          full.includes(q) ||
          p.nom.toLowerCase().includes(q) ||
          p.prenom.toLowerCase().includes(q) ||
          p.numDossard.includes(q)
        );
      })
      .slice(0, 12);
  }, [participants, query, value]);

  function selectParticipant(p: ParticipantProjection) {
    onChange(p);
    setQuery(`${p.numDossard} — ${formatParticipantName(p.prenom, p.nom)}`);
    setOpen(false);
  }

  function handleInputChange(text: string) {
    setQuery(text);
    if (value) onChange(null);
    setOpen(true);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full rounded-xl border pl-9 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-50"
          autoComplete="off"
        />
      </div>

      {open && !disabled && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border bg-white shadow-lg">
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-[#8c9962]/10"
                onClick={() => selectParticipant(p)}
              >
                <span className="font-medium tabular-nums">{p.numDossard}</span>
                <span className="text-slate-600">
                  {" "}
                  — {formatParticipantName(p.prenom, p.nom)}
                </span>
                <span className="block text-xs text-slate-400">
                  {p.aliasCategorie}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !disabled && query.trim() && filtered.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-500 shadow-lg">
          Aucun participant trouvé.
        </div>
      )}
    </div>
  );
}
