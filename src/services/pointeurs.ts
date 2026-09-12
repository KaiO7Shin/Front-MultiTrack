import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import type {
  Pointeur,
  PointeurCreateDTO,
  PointeurUpdateDTO,
  RenderResponse,
} from "@/lib/type";

function normalizePointeur(raw: Record<string, unknown>): Pointeur {
  const manches = (raw.assignedManches ?? raw.assigned_manches ?? []) as Record<
    string,
    unknown
  >[];
  return {
    id: Number(raw.id),
    libelle: String(raw.libelle ?? ""),
    role: Number(raw.role ?? 1),
    hasTrailControlPoint: Boolean(
      raw.hasTrailControlPoint ?? raw.has_trail_control_point
    ),
    trailControlPointId:
      raw.trailControlPointId != null || raw.trail_control_point_id != null
        ? Number(raw.trailControlPointId ?? raw.trail_control_point_id)
        : undefined,
    assignedManches: manches.map((m) => ({
      id: Number(m.id),
      label: String(m.label ?? m.libelle ?? ""),
      phaseId: Number(m.phaseId ?? m.phase_id),
      phaseLabel: String(m.phaseLabel ?? m.phase_label ?? ""),
      courseId: Number(m.courseId ?? m.course_id),
      courseLabel: String(m.courseLabel ?? m.course_label ?? ""),
      courseType: String(m.courseType ?? m.course_type ?? "") as Pointeur["assignedManches"][0]["courseType"],
    })),
    passcode: raw.passcode != null ? String(raw.passcode) : undefined,
  };
}

export async function fetchPointeurs(): Promise<Pointeur[]> {
  const { data } = await api.get<RenderResponse<Record<string, unknown>[]>>(
    API.pointeurs
  );
  return (data.data ?? []).map(normalizePointeur);
}

export async function createPointeur(
  dto: PointeurCreateDTO
): Promise<Pointeur> {
  const { data } = await api.post<RenderResponse<Record<string, unknown>>>(
    API.pointeur,
    dto
  );
  return normalizePointeur(data.data ?? {});
}

export async function updatePointeur(
  id: number,
  dto: PointeurUpdateDTO
): Promise<Pointeur> {
  const { data } = await api.put<RenderResponse<Record<string, unknown>>>(
    API.pointeurById(id),
    dto
  );
  return normalizePointeur(data.data ?? {});
}

export async function deletePointeur(id: number): Promise<void> {
  await api.delete(API.pointeurById(id));
}

export async function assignPointeurManches(
  id: number,
  mancheIds: number[]
): Promise<Pointeur> {
  const { data } = await api.put<RenderResponse<Record<string, unknown>>>(
    API.pointeurManches(id),
    { mancheIds }
  );
  return normalizePointeur(data.data ?? {});
}
