// API désactivée : données statiques du back-office.
// import api from "../lib/api";
// import { API } from "@/lib/apiEndpoints";
import { staticStore } from "@/data/staticStore";
import type {
  Category,
  CategoryCreateDTO,
  CategoryUpdateDTO,
  UICategory,
} from "@/lib/type";

export async function fetchCategories(): Promise<UICategory[]> {
  const list = await fetchCategoriesDetailed();
  return list.map((c) => ({ id: c.id, alias: c.alias }));
}

export async function fetchCategoriesDetailed(): Promise<Category[]> {
  // const res = await api.get(API.categories);
  // return coerceArray(res?.data).map(normalizeCategory).filter((c) => c.id > 0);
  return staticStore.listCategories();
}

export async function createCategory(dto: CategoryCreateDTO): Promise<Category> {
  // const { data } = await api.post<RenderResponse<Category>>(API.category, dto);
  // return normalizeCategory(data.data ?? data);
  return staticStore.createCategory(dto);
}

export async function updateCategory(
  id: number,
  dto: CategoryUpdateDTO
): Promise<Category> {
  // const { data } = await api.put<RenderResponse<Category>>(API.categoryById(id), dto);
  // return normalizeCategory(data.data ?? data);
  return staticStore.updateCategory(id, dto);
}

export async function deleteCategory(id: number): Promise<void> {
  // await api.delete(API.categoryById(id));
  staticStore.deleteCategory(id);
}
