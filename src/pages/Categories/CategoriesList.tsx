import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { Category, CategoryCreateDTO, CategoryGenre } from "@/lib/type";
import { nextColumnSort } from "@/lib/tableSort";
import {
  createCategory,
  deleteCategory,
  fetchCategoriesDetailed,
  updateCategory,
} from "@/services/categories";
import { CategoriesTable } from "./CategoriesTable";
import { sortCategories, type CategorySort, type CategorySortKey } from "./categorySort";
import { CategoryFormModal } from "./CategoryFormModal";

function genreFromAlias(alias: string): CategoryGenre | null {
  const last = alias.trim().toUpperCase().slice(-1);
  if (last === "H") return "Homme";
  if (last === "F") return "Femme";
  return null;
}

export const CategoriesList = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [sort, setSort] = useState<CategorySort>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setCategories(await fetchCategoriesDetailed());
    } catch {
      setLoadError("Impossible de charger les catégories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sorted = useMemo(() => {
    const byAge = [...categories].sort((a, b) => {
      if (a.ageMin !== b.ageMin) return a.ageMin - b.ageMin;
      return a.alias.localeCompare(b.alias);
    });
    return sortCategories(byAge, sort);
  }, [categories, sort]);

  function handleSort(key: CategorySortKey) {
    setSort((current) => nextColumnSort(current, key));
  }

  function openCreate() {
    setModalMode("create");
    setEditTarget(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setModalMode("edit");
    setEditTarget(cat);
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditTarget(null);
    setFormError(null);
  }

  function validateDto(dto: CategoryCreateDTO, excludeId?: number): string | null {
    if (!dto.alias.trim()) return "L'alias est requis.";
    if (dto.alias.trim().length > 5) return "L'alias ne peut pas dépasser 5 caractères.";
    if (dto.libelle != null && dto.libelle.trim().length > 30) {
      return "Le libellé ne doit pas dépasser 30 caractères.";
    }
    if (modalMode === "edit" && !dto.libelle?.trim()) return "Le libellé est requis.";
    const genre = dto.genre ?? genreFromAlias(dto.alias);
    if (!genre) {
      return "L'alias doit se terminer par H (Homme) ou F (Femme).";
    }
    if (dto.ageMin == null || dto.ageMin < 1) {
      return "L'âge minimum doit être supérieur à 0.";
    }
    if (dto.ageMax != null && dto.ageMax < 1) {
      return "L'âge maximum doit être supérieur à 0.";
    }
    if (dto.ageMax != null && dto.ageMin >= dto.ageMax) {
      return "L'âge minimum doit être strictement inférieur à l'âge maximum.";
    }
    const duplicate = categories.find(
      (c) =>
        c.alias.toLowerCase() === dto.alias.trim().toLowerCase() &&
        c.id !== excludeId
    );
    if (duplicate) return `L'alias « ${dto.alias} » existe déjà.`;
    return null;
  }

  async function handleFormSubmit(dto: CategoryCreateDTO) {
    const genre = dto.genre ?? genreFromAlias(dto.alias);
    const payload: CategoryCreateDTO = {
      ...dto,
      genre: genre ?? "Homme",
    };
    const validation = validateDto(payload, editTarget?.id);
    if (validation) {
      setFormError(validation);
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (modalMode === "create") {
        const created = await createCategory(payload);
        setCategories((prev) => [...prev, created]);
      } else if (editTarget) {
        const updated = await updateCategory(editTarget.id, payload);
        setCategories((prev) =>
          prev.map((c) => (c.id === editTarget.id ? updated : c))
        );
      }
      closeModal();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: Category) {
    if (!window.confirm(`Supprimer la catégorie « ${cat.alias} » ?`)) return;
    try {
      await deleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : "Erreur lors de la suppression.");
    }
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Catégories</h1>
          <p className="page-subtitle">
            Tranches d&apos;âge — utilisées pour classer les participants
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-navy text-white px-4 py-2 text-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Ajouter une catégorie
          </button>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      <div className="bg-white border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Chargement des catégories…
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Aucune catégorie. Ajoutez une tranche d&apos;âge pour commencer.
          </div>
        ) : (
          <CategoriesTable
            rows={sorted}
            sort={sort}
            onSort={handleSort}
            onEdit={openEdit}
            onDelete={(cat) => void handleDelete(cat)}
          />
        )}
      </div>

      <p className="text-xs text-slate-500">
        L&apos;alias se termine par H ou F ; le genre est déduit de cette lettre lors
        de l&apos;inscription ou de la modification de catégorie.
      </p>

      <CategoryFormModal
        open={modalOpen}
        mode={modalMode}
        initial={editTarget}
        saving={saving}
        error={formError}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
      />
    </section>
  );
};
