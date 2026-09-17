import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import type {
  ControlPointConfig,
  ControlPointCreateDTO,
  ControlPointUpdateDTO,
  RenderResponse,
} from "@/lib/type";

function normalizeControlPoint(raw: Record<string, unknown>): ControlPointConfig {
  return {
    id: Number(raw.id ?? 0),
    courseId: Number(raw.courseId ?? raw.course_id ?? 0),
    label: String(raw.label ?? raw.libelle ?? ""),
    numero: Number(raw.numero ?? raw.numeroPointDeControle ?? raw.numero_point_de_controle ?? 0),
    utilisateurId: raw.utilisateurId != null ? Number(raw.utilisateurId) : undefined,
    passcode: raw.passcode != null ? String(raw.passcode) : undefined,
  };
}

export async function fetchControlPointsByCourse(
  courseId: number
): Promise<ControlPointConfig[]> {
  const { data } = await api.get<RenderResponse<Record<string, unknown>[]>>(
    API.controlPoints,
    { params: { courseId } }
  );
  return (data.data ?? []).map((row) => normalizeControlPoint(row));
}

export async function createControlPoint(
  dto: ControlPointCreateDTO
): Promise<ControlPointConfig> {
  const { data } = await api.post<RenderResponse<Record<string, unknown>>>(
    API.controlPoint,
    dto
  );
  return normalizeControlPoint(data.data ?? {});
}

export async function updateControlPoint(
  id: number,
  dto: ControlPointUpdateDTO
): Promise<ControlPointConfig> {
  const { data } = await api.put<RenderResponse<Record<string, unknown>>>(
    API.controlPointById(id),
    dto
  );
  return normalizeControlPoint(data.data ?? {});
}

export async function deleteControlPoint(id: number): Promise<void> {
  await api.delete(API.controlPointById(id));
}
