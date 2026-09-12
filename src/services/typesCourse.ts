import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import type { RenderResponse, TypeCourse } from "@/lib/type";

function normalizeTypeCourse(raw: Record<string, unknown>): TypeCourse {
  return {
    id: Number(raw.id ?? 0),
    libelle: String(raw.libelle ?? raw.label ?? ""),
    bibStart:
      raw.bibStart != null || raw.bib_start != null
        ? Number(raw.bibStart ?? raw.bib_start)
        : undefined,
    bibEnd:
      raw.bibEnd != null || raw.bib_end != null
        ? Number(raw.bibEnd ?? raw.bib_end)
        : undefined,
  };
}

export async function fetchTypesCourse(): Promise<TypeCourse[]> {
  const { data } = await api.get<RenderResponse<Record<string, unknown>[]>>(
    API.typesCourse
  );
  return (data.data ?? []).map(normalizeTypeCourse);
}
