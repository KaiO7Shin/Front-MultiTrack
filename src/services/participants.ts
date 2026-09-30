// API désactivée : données statiques du back-office.
// import api from "@/lib/api";
// import { API } from "@/lib/apiEndpoints";
import { staticStore } from "@/data/staticStore";
import type {
  ParticipantCreateDTO,
  ParticipantProjection,
  ParticipantUpdateDTO,
  ParticipantResponse,
  RenderResponse,
} from "@/lib/type";

export async function fetchParticipantsByCourse(raceId: number) {
  // const { data } = await api.get<RenderResponse<Record<string, unknown>[]>>(
  //   API.participants,
  //   { params: { raceId } }
  // );
  // return (data.data ?? []).map((row) => normalizeParticipantProjection(row, raceId));
  return staticStore.listParticipants(raceId);
}

export async function fetchAllParticipants() {
  return staticStore.listAllParticipants();
}

export async function fetchParticipantById(id: number) {
  return staticStore.getParticipantById(id);
}

export async function createParticipant(dto: ParticipantCreateDTO) {
  // const { data } = await api.post<RenderResponse<ParticipantResponse>>(API.participant, dto);
  // return data;
  return staticStore.createParticipant(dto);
}

export async function updateParticipant(
  dto: ParticipantUpdateDTO
): Promise<RenderResponse<ParticipantResponse>> {
  // const { bibNumber, ...body } = dto;
  // const { data } = await api.put<RenderResponse<ParticipantResponse>>(
  //   API.participantByBib(bibNumber),
  //   body
  // );
  // return data;
  return staticStore.updateParticipant(dto);
}

export type ParticipantStatus = ParticipantProjection["statut"];

export async function changeParticipantStatus(
  bibNumber: string,
  newStatus: ParticipantStatus
): Promise<void> {
  // await api.post(API.participantChangeStatus, { bibNumber: String(bibNumber), newStatus });
  staticStore.changeParticipantStatus(bibNumber, newStatus);
}
