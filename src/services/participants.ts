import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import { normalizeParticipantProjection } from "@/lib/utils";
import type {
  InscriptionReviewDecision,
  ParticipantCreateDTO,
  ParticipantProjection,
  ParticipantUpdateDTO,
  ParticipantResponse,
  RenderResponse,
} from "@/lib/type";
import { staticStore } from "@/data/staticStore";

export async function fetchParticipantsByCourse(raceId: number) {
  const { data } = await api.get<RenderResponse<Record<string, unknown>[]>>(
    API.participants,
    { params: { raceId } }
  );
  return (data.data ?? []).map((row) =>
    normalizeParticipantProjection(row, raceId)
  );
}

export async function fetchAllParticipants() {
  const { data } = await api.get<RenderResponse<Record<string, unknown>[]>>(
    API.participants
  );
  return (data.data ?? []).map((row) => normalizeParticipantProjection(row));
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

/** Revue d'inscription : pas encore d'endpoint dédié — fallback staticStore. */
export async function reviewInscription(
  id: number,
  decision: InscriptionReviewDecision,
  commentaire?: string
): Promise<RenderResponse<ParticipantResponse>> {
  return staticStore.reviewInscription(id, decision, commentaire);
}

export async function deleteParticipant(
  id: number
): Promise<RenderResponse<null>> {
  const { data } = await api.delete<RenderResponse<null>>(
    API.participantById(id)
  );
  return data;
}
