import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import { normalizeParticipantProjection } from "@/lib/utils";
import type {
  ParticipantCreateDTO,
  ParticipantListSource,
  ParticipantProjection,
  ParticipantUpdateDTO,
  ParticipantResponse,
  RenderResponse,
} from "@/lib/type";

export type ParticipantSearchParams = {
  source?: ParticipantListSource;
  courseId?: number;
  categorieId?: number;
  genre?: string;
  statut?: string;
  /** @deprecated Prefer courseId */
  raceId?: number;
};

function cleanParams(params?: ParticipantSearchParams) {
  if (!params) return { source: "PARTICIPANT" as const };
  const out: Record<string, string | number> = {
    source: params.source ?? "PARTICIPANT",
  };
  const courseId = params.courseId ?? params.raceId;
  if (courseId != null) out.courseId = courseId;
  if (params.categorieId != null) out.categorieId = params.categorieId;
  if (params.genre) out.genre = params.genre;
  if (params.statut) out.statut = params.statut;
  return out;
}

export async function searchParticipants(
  params?: ParticipantSearchParams
): Promise<ParticipantProjection[]> {
  const { data } = await api.get<RenderResponse<Record<string, unknown>[]>>(
    API.participants,
    { params: cleanParams(params) }
  );
  return (data.data ?? []).map((row) => normalizeParticipantProjection(row));
}

export async function fetchParticipantsByCourse(raceId: number) {
  return searchParticipants({ source: "PARTICIPANT", courseId: raceId });
}

export async function fetchAllParticipants() {
  return searchParticipants({ source: "PARTICIPANT" });
}

export async function fetchParticipantById(id: number) {
  const { data } = await api.get<RenderResponse<Record<string, unknown>>>(
    API.participantById(id)
  );
  if (!data.data) {
    throw new Error(data.message || "Participant introuvable");
  }
  return normalizeParticipantProjection(data.data);
}

export async function createParticipant(dto: ParticipantCreateDTO) {
  const { data } = await api.post<RenderResponse<ParticipantResponse>>(
    API.participant,
    dto
  );
  return data;
}

export async function updateParticipant(
  dto: ParticipantUpdateDTO
): Promise<RenderResponse<ParticipantResponse>> {
  const { bibNumber, courseChoisieId, ...rest } = dto;
  const { data } = await api.put<RenderResponse<ParticipantResponse>>(
    API.participantByBib(bibNumber),
    {
      ...rest,
      courseId: courseChoisieId,
    }
  );
  return data;
}

export type ParticipantStatus = ParticipantProjection["statut"];

export async function changeParticipantStatus(
  bibNumber: string,
  newStatus: ParticipantStatus
): Promise<void> {
  await api.post(API.participantChangeStatus, {
    bibNumber: String(bibNumber),
    newStatus,
  });
}

export async function deleteParticipant(
  id: number
): Promise<RenderResponse<null>> {
  const { data } = await api.delete<RenderResponse<null>>(
    API.participantById(id)
  );
  return data;
}
