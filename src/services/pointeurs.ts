// API désactivée : données statiques du back-office.
// import api from "@/lib/api";
// import { API } from "@/lib/apiEndpoints";
import { staticStore } from "@/data/staticStore";
import type { Pointeur, PointeurCreateDTO, PointeurUpdateDTO } from "@/lib/type";

export async function fetchPointeurs(): Promise<Pointeur[]> {
  // const { data } = await api.get(API.pointeurs);
  // return (data.data ?? []).map(normalizePointeur);
  return staticStore.listPointeurs();
}

export async function createPointeur(dto: PointeurCreateDTO): Promise<Pointeur> {
  // const { data } = await api.post(API.pointeur, dto);
  // return normalizePointeur(data.data ?? {});
  return staticStore.createPointeur(dto);
}

export async function updatePointeur(
  id: number,
  dto: PointeurUpdateDTO
): Promise<Pointeur> {
  // const { data } = await api.put(API.pointeurById(id), dto);
  // return normalizePointeur(data.data ?? {});
  return staticStore.updatePointeur(id, dto);
}

export async function deletePointeur(id: number): Promise<void> {
  // await api.delete(API.pointeurById(id));
  staticStore.deletePointeur(id);
}

export async function assignPointeurManches(
  id: number,
  mancheIds: number[]
): Promise<Pointeur> {
  // const { data } = await api.put(API.pointeurManches(id), { mancheIds });
  // return normalizePointeur(data.data ?? {});
  return staticStore.assignPointeurManches(id, mancheIds);
}
