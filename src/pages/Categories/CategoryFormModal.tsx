import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Alert } from "@/components/ui/feedback";
import type { Category, CategoryCreateDTO, CategoryGenre } from "@/lib/type";

type CategoryFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Category | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (dto: CategoryCreateDTO) => void;
};

const emptyForm = {
  alias: "",
  ageMin: 18,
  ageMax: 39 as number | null,
};

function genreFromAlias(alias: string): CategoryGenre | null {
  const last = alias.trim().toUpperCase().slice(-1);
  if (last === "H") return "Homme";
  if (last === "F") return "Femme";
  return null;
}

export function CategoryFormModal({
  open,
  mode,
  initial,
  saving,
  error,
  onClose,
  onSubmit,
}: CategoryFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [noMaxAge, setNoMaxAge] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setForm({
        alias: initial.alias,
        ageMin: initial.ageMin,
        ageMax: initial.ageMax,
      });
      setNoMaxAge(initial.ageMax == null);
    } else {
      setForm(emptyForm);
      setNoMaxAge(false);
    }
  }, [open, mode, initial]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const alias = form.alias.trim().toUpperCase();
    const genre = genreFromAlias(alias);
    onSubmit({
      alias,
      genre: genre ?? "Homme",
      ageMin: form.ageMin,
      ageMax: noMaxAge ? null : form.ageMax,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => !saving && onClose()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div>
            <h2 id="category-form-title" className="text-lg font-semibold">
              {mode === "create" ? "Ajouter une catégorie" : "Modifier la catégorie"}
            </h2>
            {mode === "edit" && initial && (
              <p className="text-xs text-slate-500 mt-0.5">{initial.alias}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {error && (
            <Alert variant="error" role="alert">
              {error}
            </Alert>
          )}

          <div className="space-y-1">
            <label htmlFor="cat-alias" className="text-xs font-medium text-slate-600">
              Alias *
            </label>
            <input
              id="cat-alias"
              required
              maxLength={5}
              className="w-full rounded-lg border px-3 py-2 text-sm uppercase"
              placeholder="Ex. SNH, M1F"
              value={form.alias}
              onChange={(e) => setForm((f) => ({ ...f, alias: e.target.value }))}
              disabled={saving}
            />
            <p className="text-[10px] text-slate-400">
              5 caractères max. Doit se terminer par H (Homme) ou F (Femme) — le genre
              est déduit automatiquement.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="cat-age-min" className="text-xs font-medium text-slate-600">
                Âge minimum *
              </label>
              <input
                id="cat-age-min"
                type="number"
                min={1}
                required
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.ageMin}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ageMin: Number(e.target.value) }))
                }
                disabled={saving}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="cat-age-max" className="text-xs font-medium text-slate-600">
                Âge maximum
              </label>
              <input
                id="cat-age-max"
                type="number"
                min={1}
                className="w-full rounded-lg border px-3 py-2 text-sm disabled:bg-slate-50"
                value={form.ageMax ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    ageMax: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                disabled={saving || noMaxAge}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={noMaxAge}
              onChange={(e) => {
                setNoMaxAge(e.target.checked);
                if (e.target.checked) {
                  setForm((f) => ({ ...f, ageMax: null }));
                }
              }}
              disabled={saving}
            />
            Pas de limite supérieure (ex. 50 ans et +)
          </label>

          <div className="flex justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-40"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !form.alias.trim()}
              className="rounded-xl bg-navy px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-40"
            >
              {saving ? "Enregistrement..." : mode === "create" ? "Créer" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
