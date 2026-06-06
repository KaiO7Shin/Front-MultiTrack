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

export type UpdateCategoryDTO = {
  bibNumber: string;
  genre: "Homme" | "Femme";
  dateNaissance: string; // yyyy-MM-dd
};

export async function updateParticipantCategory(dto: UpdateCategoryDTO) {
  const { data } = await api.post<RenderResponse<ParticipantResponse>>(
    "/participant/change/category",
    dto
  );
  return data;
}
