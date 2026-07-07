import api from "../lib/api";
import { API } from "@/lib/apiEndpoints";
import { apiOrLocal, apiWriteOrLocal } from "@/lib/apiFallback";
import { coerceArray, normalizeCategory } from "@/lib/utils";
import {
  localCreateCategory,
  localDeleteCategory,
  localGetCategoriesDetailed,
  localUpdateCategory,
} from "@/lib/localData";
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

export async function fetchCategoriesDetailed(): Promise<Category[]> {
  return apiOrLocal(
    async () => {
      const res = await api.get(API.categories);
      return coerceArray(res?.data).map(normalizeCategory).filter((c) => c.id > 0);
    },
    () => localGetCategoriesDetailed(),
    { label: `GET ${API.categories}` }
  );
}

export async function createCategory(dto: CategoryCreateDTO): Promise<Category> {
  return apiWriteOrLocal(
    async () => {
      const { data } = await api.post<RenderResponse<Category>>(API.category, dto);
      return normalizeCategory(data.data ?? data);
    },
    () => localCreateCategory(dto),
    `POST ${API.category}`
  );
}

export async function updateCategory(
  id: number,
  dto: CategoryUpdateDTO,
  existing?: Category
): Promise<Category> {
  return apiWriteOrLocal(
    async () => {
      const { data } = await api.put<RenderResponse<Category>>(
        API.categoryById(id),
        dto
      );
      return normalizeCategory(data.data ?? data);
    },
    () => {
      if (!existing) throw new Error("Catégorie existante requise pour la mise à jour");
      return localUpdateCategory(id, dto, existing);
    },
    `PUT ${API.categoryById(id)}`
  );
}

export async function deleteCategory(id: number): Promise<void> {
  return apiWriteOrLocal(
    async () => {
      await api.delete(API.categoryById(id));
    },
    () => {
      localDeleteCategory(id);
    },
    `DELETE ${API.categoryById(id)}`
  );
}

export { USE_LOCAL_DATA } from "@/lib/apiMode";
