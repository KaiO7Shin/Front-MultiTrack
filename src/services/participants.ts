import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import { apiOrLocal, apiWriteOrLocal } from "@/lib/apiFallback";
import {
  localChangeParticipantStatus,
  localCreateParticipant,
  localGetParticipantsByCourse,
  localUpdateParticipant,
} from "@/lib/localData";
import type {
  ParticipantCreateDTO,
  ParticipantProjection,
  ParticipantUpdateDTO,
  RenderResponse,
  ParticipantResponse,
  ParticipantUpdateInfoResponse,
} from "@/lib/type";
import { formatParticipantName, normalizeParticipantProjection } from "@/lib/utils";

export async function fetchParticipantsByCourse(raceId: number) {
  return apiOrLocal(
    async () => {
      const { data } = await api.get<RenderResponse<Record<string, unknown>[]>>(
        API.participants,
        { params: { raceId } }
      );
      return (data.data ?? []).map((row) =>
        normalizeParticipantProjection(row, raceId)
      );
    },
    () => localGetParticipantsByCourse(raceId),
    { label: `GET ${API.participants}?raceId=` }
  );
}

export async function createParticipant(dto: ParticipantCreateDTO) {
  return apiWriteOrLocal(
    async () => {
      const { data } = await api.post<RenderResponse<ParticipantResponse>>(
        API.participant,
        dto
      );
      return data;
    },
    () => {
      const created = localCreateParticipant(dto);
      return {
        code: 200,
        message: `Participant ${formatParticipantName(created.prenom, created.nom)} inscrit (dossard ${created.numDossard}).`,
        data: {
          numDossard: created.numDossard,
          nom: created.nom,
          prenom: created.prenom,
          genre: created.genre,
          categorie: created.aliasCategorie,
          statut: created.statut,
        } satisfies ParticipantResponse,
      } satisfies RenderResponse<ParticipantResponse>;
    },
    `POST ${API.participant}`
  );
}

export async function updateParticipant(dto: ParticipantUpdateDTO) {
  return apiWriteOrLocal(
    async () => {
      const { bibNumber, ...body } = dto;
      const { data } = await api.put<RenderResponse<ParticipantUpdateInfoResponse>>(
        API.participantByBib(bibNumber),
        body
      );
      return data;
    },
    async () => {
      try {
        const updated = localUpdateParticipant(dto);
        return {
          code: 200,
          message: "Participant mis à jour.",
          data: updated,
        } satisfies RenderResponse<ParticipantUpdateInfoResponse>;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur lors de la mise à jour";
        throw { response: { data: { message } } };
      }
    },
    `PUT ${API.participantByBib(dto.bibNumber)}`
  );
}

export type ParticipantStatus = ParticipantProjection["statut"];

export async function changeParticipantStatus(
  bibNumber: string,
  newStatus: ParticipantStatus
): Promise<void> {
  return apiWriteOrLocal(
    async () => {
      await api.post(API.participantChangeStatus, {
        bibNumber: String(bibNumber),
        newStatus,
      });
    },
    () => {
      localChangeParticipantStatus(bibNumber, newStatus);
    },
    `POST ${API.participantChangeStatus}`
  );
}

export { USE_LOCAL_DATA, FORCE_LOCAL_DATA } from "@/lib/apiMode";
