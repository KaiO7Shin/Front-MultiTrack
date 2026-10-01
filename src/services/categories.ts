import api from "../lib/api";
import { API } from "@/lib/apiEndpoints";
import { coerceArray, normalizeCategory } from "@/lib/utils";
import type {
  Category,
  CategoryCreateDTO,
  CategoryUpdateDTO,
  RenderResponse,
  UICategory,
} from "@/lib/type";

function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string; error?: string } } })
    ?.response?.data;
  return data?.message || data?.error || fallback;
}

export async function fetchCategories(): Promise<UICategory[]> {
  const list = await fetchCategoriesDetailed();
  return list.map((c) => ({ id: c.id, alias: c.alias }));
}

/** Liste catégories depuis l’API (filtres participants / alias réels). */
export async function fetchCategoriesDetailed(): Promise<Category[]> {
  const res = await api.get<RenderResponse<Record<string, unknown>[]>>(
    API.categories
  );
  return coerceArray(res?.data?.data ?? res?.data)
    .map(normalizeCategory)
    .filter((c) => c.id > 0);
}

export async function createCategory(dto: CategoryCreateDTO): Promise<Category> {
  try {
    const { data } = await api.post<RenderResponse<Record<string, unknown>>>(
      API.category,
      dto
    );
    if (data.code !== 200 || !data.data) {
      throw new Error(data.message || data.error || "Création impossible");
    }
    return normalizeCategory(data.data);
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Erreur lors de la création de la catégorie."));
  }
}

export async function updateCategory(
  id: number,
  dto: CategoryUpdateDTO
): Promise<Category> {
  try {
    const { data } = await api.put<RenderResponse<Record<string, unknown>>>(
      API.categoryById(id),
      dto
    );
    if (data.code !== 200 || !data.data) {
      throw new Error(data.message || data.error || "Mise à jour impossible");
    }
    return normalizeCategory(data.data);
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Erreur lors de la mise à jour de la catégorie."));
  }
}

export async function deleteCategory(id: number): Promise<void> {
  try {
    const { data } = await api.delete<RenderResponse<null>>(API.categoryById(id));
    if (data.code !== 200) {
      throw new Error(data.message || data.error || "Suppression impossible");
    }
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Erreur lors de la suppression de la catégorie."));
  }
}
