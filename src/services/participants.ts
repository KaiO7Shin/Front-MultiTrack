// src/services/participants.ts
import api from "@/lib/api";
import type { ParticipantCreateDTO, RenderResponse, ParticipantResponse, ParticipantProjection } from "@/lib/type";

export async function fetchParticipantsByCourse(raceId: number) {
  const { data } = await api.get<RenderResponse<ParticipantProjection[]>>(
    "/participants",
    { params: { raceId } }
  );
  return data.data ?? [];
}


export async function createParticipant(dto: ParticipantCreateDTO) {
  const { data } = await api.post<RenderResponse<ParticipantResponse>>("/participant", dto);
  return data;
}
