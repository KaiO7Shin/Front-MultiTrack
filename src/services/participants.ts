import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import { normalizeParticipantProjection } from "@/lib/utils";
import type {
  ParticipantCreateDTO,
  ParticipantProjection,
  ParticipantUpdateDTO,
  RenderResponse,
  ParticipantResponse,
} from "@/lib/type";

export async function fetchParticipantsByCourse(raceId: number) {
  const { data } = await api.get<RenderResponse<Record<string, unknown>[]>>(
    API.participants,
    { params: { raceId } }
  );
  return (data.data ?? []).map((row) =>
    normalizeParticipantProjection(row, raceId)
  );
}

export async function createParticipant(dto: ParticipantCreateDTO) {
  const { data } = await api.post<RenderResponse<ParticipantResponse>>(
    API.participant,
    dto
  );
  return data;
}

export async function updateParticipant(dto: ParticipantUpdateDTO) {
  const { bibNumber, ...body } = dto;
  const { data } = await api.put<RenderResponse<ParticipantResponse>>(
    API.participantByBib(bibNumber),
    body
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
