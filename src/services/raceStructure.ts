import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import { apiOrLocal, apiWriteOrLocal } from "@/lib/apiFallback";
import {
  localCreateManche,
  localCreatePhase,
  localDeleteManche,
  localDeletePhase,
  localGetManchesByPhase,
  localGetPhasesByCourse,
  localGetResultatsByManche,
  localGetDisqualificationsByCourse,
  localGetAllResultatsManche,
  localGetPhases,
  localGetManches,
  localGetAssignmentsForPhase,
  localRecordArriveDH,
  localRecordArriveXC,
  localRecordDepart,
  localUpdateManche,
  localUpdatePhase,
} from "@/lib/localData";
import {
  canCheckParticipantOnManche,
  type CheckpointMancheMode,
} from "@/lib/raceRanking";
import type {
  Manche,
  MancheCreateDTO,
  MancheUpdateDTO,
  Phase,
  PhaseCreateDTO,
  PhaseUpdateDTO,
  PhaseWithManches,
  RenderResponse,
  ResultatManche,
  ResultatMancheView,
  ParticipantProjection,
} from "@/lib/type";
import { normalizeParticipantProjection } from "@/lib/utils";
import { fetchParticipantsByCourse } from "@/services/participants";

function throwLocalError(err: unknown): never {
  const message =
    err instanceof Error ? err.message : "Erreur lors de l'opération";
  throw { response: { data: { message } } };
}

export async function fetchPhasesByCourse(courseId: number): Promise<Phase[]> {
  return apiOrLocal(
    async () => {
      const { data } = await api.get<RenderResponse<Phase[]>>(API.phases, {
        params: { courseId },
      });
      return data.data ?? [];
    },
    () => localGetPhasesByCourse(courseId),
    { label: `GET ${API.phases}?courseId=` }
  );
}

export async function fetchPhasesWithManches(
  courseId: number
): Promise<PhaseWithManches[]> {
  const phases = await fetchPhasesByCourse(courseId);
  const withManches = await Promise.all(
    phases.map(async (phase) => ({
      ...phase,
      manches: await fetchManchesByPhase(phase.id),
    }))
  );
  return withManches;
}

export async function createPhase(dto: PhaseCreateDTO): Promise<Phase> {
  return apiWriteOrLocal(
    async () => {
      const { data } = await api.post<RenderResponse<Phase>>(API.phase, dto);
      return data.data!;
    },
    () => localCreatePhase(dto),
    `POST ${API.phase}`
  );
}

export async function updatePhase(
  id: number,
  dto: PhaseUpdateDTO,
  existing: Phase
): Promise<Phase> {
  return apiWriteOrLocal(
    async () => {
      const { data } = await api.put<RenderResponse<Phase>>(API.phaseById(id), dto);
      return data.data!;
    },
    () => localUpdatePhase(id, dto, existing),
    `PUT ${API.phaseById(id)}`
  );
}

export async function deletePhase(id: number): Promise<void> {
  return apiWriteOrLocal(
    async () => {
      await api.delete(API.phaseById(id));
    },
    () => localDeletePhase(id),
    `DELETE ${API.phaseById(id)}`
  );
}

export async function fetchManchesByPhase(phaseId: number): Promise<Manche[]> {
  return apiOrLocal(
    async () => {
      const { data } = await api.get<RenderResponse<Manche[]>>(API.manches, {
        params: { phaseId },
      });
      return data.data ?? [];
    },
    () => localGetManchesByPhase(phaseId),
    { label: `GET ${API.manches}?phaseId=` }
  );
}

export async function createManche(dto: MancheCreateDTO): Promise<Manche> {
  return apiWriteOrLocal(
    async () => {
      const { data } = await api.post<RenderResponse<Manche>>(API.manche, dto);
      return data.data!;
    },
    () => localCreateManche(dto),
    `POST ${API.manche}`
  );
}

export async function updateManche(
  id: number,
  dto: MancheUpdateDTO,
  existing: Manche
): Promise<Manche> {
  return apiWriteOrLocal(
    async () => {
      const { data } = await api.put<RenderResponse<Manche>>(API.mancheById(id), dto);
      return data.data!;
    },
    () => localUpdateManche(id, dto, existing),
    `PUT ${API.mancheById(id)}`
  );
}

export async function deleteManche(id: number): Promise<void> {
  return apiWriteOrLocal(
    async () => {
      await api.delete(API.mancheById(id));
    },
    () => localDeleteManche(id),
    `DELETE ${API.mancheById(id)}`
  );
}

export async function fetchResultatsByManche(
  mancheId: number
): Promise<ResultatMancheView[]> {
  return apiOrLocal(
    async () => {
      const { data } = await api.get<RenderResponse<ResultatMancheView[]>>(
        API.resultatsManche,
        { params: { mancheId } }
      );
      return data.data ?? [];
    },
    () => localGetResultatsByManche(mancheId),
    { label: `GET ${API.resultatsManche}?mancheId=` }
  );
}

export async function fetchCheckpointEligibleParticipants(
  courseId: number,
  phaseId: number,
  mancheId: number,
  mode: CheckpointMancheMode
): Promise<ParticipantProjection[]> {
  return apiOrLocal(
    async () => {
      const { data } = await api.get<RenderResponse<Record<string, unknown>[]>>(
        API.checkpointEligible,
        { params: { courseId, phaseId, mancheId, mode } }
      );
      return (data.data ?? []).map((row) =>
        normalizeParticipantProjection(row, courseId)
      );
    },
    async () => {
      const participants = await fetchParticipantsByCourse(courseId);
      const phases = localGetPhases().filter((p) => p.courseId === courseId);
      const manches = localGetManches();
      const resultats = localGetAllResultatsManche();
      const disqualifications = localGetDisqualificationsByCourse(courseId);
      const assignments = localGetAssignmentsForPhase(phaseId, manches);

      return participants.filter((p) =>
        canCheckParticipantOnManche(
          p.id,
          mancheId,
          phaseId,
          phases,
          disqualifications,
          manches,
          resultats,
          mode,
          assignments
        )
      );
    },
    { label: `GET ${API.checkpointEligible}` }
  );
}

export async function recordDepart(
  participantId: number,
  mancheId: number
): Promise<ResultatManche> {
  return apiWriteOrLocal(
    async () => {
      const { data } = await api.post<RenderResponse<ResultatManche>>(
        API.resultatMancheDepart,
        { participantId, mancheId }
      );
      return data.data!;
    },
    () => {
      try {
        return localRecordDepart(participantId, mancheId);
      } catch (err) {
        throwLocalError(err);
      }
    },
    `POST ${API.resultatMancheDepart}`
  );
}

export async function recordArriveDH(
  participantId: number,
  mancheId: number
): Promise<ResultatManche> {
  return apiWriteOrLocal(
    async () => {
      const { data } = await api.post<RenderResponse<ResultatManche>>(
        API.resultatMancheArrivee,
        { participantId, mancheId, mode: "DH" }
      );
      return data.data!;
    },
    () => {
      try {
        return localRecordArriveDH(participantId, mancheId);
      } catch (err) {
        throwLocalError(err);
      }
    },
    `POST ${API.resultatMancheArrivee}`
  );
}

export async function recordArriveXC(
  participantId: number,
  mancheId: number
): Promise<ResultatManche> {
  return apiWriteOrLocal(
    async () => {
      const { data } = await api.post<RenderResponse<ResultatManche>>(
        API.resultatMancheArrivee,
        { participantId, mancheId, mode: "XC" }
      );
      return data.data!;
    },
    () => {
      try {
        return localRecordArriveXC(participantId, mancheId);
      } catch (err) {
        throwLocalError(err);
      }
    },
    `POST ${API.resultatMancheArrivee}`
  );
}
