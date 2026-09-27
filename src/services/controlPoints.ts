// API désactivée : données statiques du back-office.
// import api from "@/lib/api";
// import { API } from "@/lib/apiEndpoints";
import { staticStore } from "@/data/staticStore";
import type {
  ControlPointConfig,
  ControlPointCreateDTO,
  ControlPointUpdateDTO,
} from "@/lib/type";

export async function fetchControlPointsByCourse(
  courseId: number
): Promise<ControlPointConfig[]> {
  // const { data } = await api.get(API.controlPoints, { params: { courseId } });
  // return (data.data ?? []).map((row) => normalizeControlPoint(row));
  return staticStore.listControlPoints(courseId);
}

export async function createControlPoint(
  dto: ControlPointCreateDTO
): Promise<ControlPointConfig> {
  // const { data } = await api.post(API.controlPoint, dto);
  // return normalizeControlPoint(data.data ?? {});
  return staticStore.createControlPoint(dto);
}

export async function updateControlPoint(
  id: number,
  dto: ControlPointUpdateDTO
): Promise<ControlPointConfig> {
  // const { data } = await api.put(API.controlPointById(id), dto);
  // return normalizeControlPoint(data.data ?? {});
  return staticStore.updateControlPoint(id, dto);
}

export async function deleteControlPoint(id: number): Promise<void> {
  // await api.delete(API.controlPointById(id));
  staticStore.deleteControlPoint(id);
}
