import api from "../lib/api";
import { API } from "@/lib/apiEndpoints";
import { coerceArray, normalizeCategory } from "@/lib/utils";
import { staticStore } from "@/data/staticStore";
import type {
  Category,
  CategoryCreateDTO,
  CategoryUpdateDTO,
  RenderResponse,
  UICategory,
} from "@/lib/type";

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
  // CRUD catégories encore staticStore (hors périmètre login + participants).
  return staticStore.createCategory(dto);
}

export async function updateCategory(
  id: number,
  dto: CategoryUpdateDTO
): Promise<Category> {
  return staticStore.updateCategory(id, dto);
}

export async function deleteCategory(id: number): Promise<void> {
  staticStore.deleteCategory(id);
}
