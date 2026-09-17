import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Category, CategoryCreateDTO, CategoryGenre } from "@/lib/type";
import { formatAgeRange } from "@/lib/utils";
import {
  createCategory,
  deleteCategory,
  fetchCategoriesDetailed,
  updateCategory,
} from "@/services/categories";
import { CategoryFormModal } from "./CategoryFormModal";

const GENRE_BADGE: Record<CategoryGenre, string> = {
  Homme: "bg-blue-100 text-blue-800 border-blue-200",
  Femme: "bg-pink-100 text-pink-800 border-pink-200",
};

export const CategoriesList = () => {
  const [categories, setCategories] = useState<Category[]>([]);
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

  const sorted = useMemo(
    () =>
      [...categories].sort((a, b) => {
        if (a.genre !== b.genre) return a.genre.localeCompare(b.genre);
        return a.ageMin - b.ageMin;
      }),
    [categories]
  );

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
    if (dto.ageMin < 0) return "L'âge minimum doit être positif.";
    if (dto.ageMax != null && dto.ageMax < dto.ageMin) {
      return "L'âge maximum doit être supérieur ou égal à l'âge minimum.";
    }
    const duplicate = categories.find(
      (c) =>
        c.alias.toUpperCase() === dto.alias.trim().toUpperCase() &&
        c.id !== excludeId
    );
    if (duplicate) return `L'alias « ${dto.alias} » existe déjà.`;
    return null;
  }

  async function handleFormSubmit(dto: CategoryCreateDTO) {
    const validation = validateDto(dto, editTarget?.id);
    if (validation) {
      setFormError(validation);
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (modalMode === "create") {
        const created = await createCategory(dto);
        setCategories((prev) => [...prev, created]);
      } else if (editTarget) {
        const updated = await updateCategory(editTarget.id, dto);
        setCategories((prev) =>
          prev.map((c) => (c.id === editTarget.id ? updated : c))
        );
      }
      closeModal();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setFormError(err?.response?.data?.message ?? "Erreur lors de l'enregistrement.");
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
      const err = e as { response?: { data?: { message?: string } } };
      alert(err?.response?.data?.message ?? "Erreur lors de la suppression.");
    }
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Catégories</h1>
          <p className="page-subtitle">
            Tranches d&apos;âge par genre — utilisées pour classer les participants
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:opacity-90"
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
          <div className="table-scroll">
            <table>
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Alias</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Genre</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Tranche d&apos;âge
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sorted.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#8c9962]/5">
                    <td className="px-4 py-3 font-semibold">{cat.alias}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${GENRE_BADGE[cat.genre]}`}
                      >
                        {cat.genre}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatAgeRange(cat.ageMin, cat.ageMax)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col sm:flex-row sm:inline-flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => openEdit(cat)}
                          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs hover:bg-[#8c9962]/10"
                        >
                          <Pencil className="h-3 w-3" />
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        L&apos;alias est attribué automatiquement aux participants selon leur âge et genre
        lors de l&apos;inscription ou de la modification de catégorie.
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
