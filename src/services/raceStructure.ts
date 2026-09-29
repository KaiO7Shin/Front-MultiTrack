// API désactivée : données statiques du back-office.
// import api from "@/lib/api";
// import { API } from "@/lib/apiEndpoints";
import { staticStore } from "@/data/staticStore";
import type { CheckpointMancheMode } from "@/lib/raceRanking";
import type {
  Manche,
  MancheCreateDTO,
  MancheUpdateDTO,
  Phase,
  PhaseCreateDTO,
  PhaseUpdateDTO,
  PhaseWithManches,
  ResultatManche,
  ResultatMancheView,
  ParticipantProjection,
} from "@/lib/type";

export async function fetchPhasesByCourse(courseId: number): Promise<Phase[]> {
  // const { data } = await api.get(API.phases, { params: { courseId } });
  // return data.data ?? [];
  return staticStore.listPhases(courseId);
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
  // const { data } = await api.post(API.phase, dto);
  // return data.data!;
  return staticStore.createPhase(dto);
}

export async function updatePhase(id: number, dto: PhaseUpdateDTO): Promise<Phase> {
  // const { data } = await api.put(API.phaseById(id), dto);
  // return data.data!;
  return staticStore.updatePhase(id, dto);
}

export async function deletePhase(id: number): Promise<void> {
  // await api.delete(API.phaseById(id));
  staticStore.deletePhase(id);
}

export async function fetchManchesByPhase(phaseId: number): Promise<Manche[]> {
  // const { data } = await api.get(API.manches, { params: { phaseId } });
  // return data.data ?? [];
  return staticStore.listManches(phaseId);
}

export async function createManche(dto: MancheCreateDTO): Promise<Manche> {
  // const { data } = await api.post(API.manche, dto);
  // return data.data!;
  return staticStore.createManche(dto);
}

export async function updateManche(id: number, dto: MancheUpdateDTO): Promise<Manche> {
  // const { data } = await api.put(API.mancheById(id), dto);
  // return data.data!;
  return staticStore.updateManche(id, dto);
}

export async function deleteManche(id: number): Promise<void> {
  // await api.delete(API.mancheById(id));
  staticStore.deleteManche(id);
}

export async function fetchResultatsByManche(
  mancheId: number
): Promise<ResultatMancheView[]> {
  // const { data } = await api.get(API.resultatsManche, { params: { mancheId } });
  // return (data.data ?? []).map(...)
  return staticStore.listResultats(mancheId);
}

export async function fetchCheckpointEligibleParticipants(
  courseId: number,
  phaseId: number,
  mancheId: number,
  mode: CheckpointMancheMode
): Promise<ParticipantProjection[]> {
  // const { data } = await api.get(API.checkpointEligible, { params: { courseId, phaseId, mancheId, mode } });
  return staticStore.eligibleParticipants(courseId, phaseId, mancheId, mode);
}

export async function recordDepart(
  participantId: number,
  mancheId: number,
  recordedAt: string,
  _operatorId: number
): Promise<ResultatManche> {
  // const { data } = await api.post(API.resultatMancheDepart, { participantId, mancheId, recordedAt, operatorId });
  // return data.data!;
  return staticStore.recordDepart(participantId, mancheId, recordedAt);
}

export async function recordArriveDH(
  participantId: number,
  mancheId: number,
  recordedAt: string,
  _operatorId: number
): Promise<ResultatManche> {
  // const { data } = await api.post(API.resultatMancheArrivee, { participantId, mancheId, mode: "DH", recordedAt, operatorId });
  // return data.data!;
  return staticStore.recordArrive(participantId, mancheId, recordedAt, "DH");
}

export async function recordArriveXC(
  participantId: number,
  mancheId: number
): Promise<ResultatManche> {
  // const { data } = await api.post(API.resultatMancheArrivee, { participantId, mancheId, mode: "XC" });
  // return data.data!;
  return staticStore.recordArrive(
    participantId,
    mancheId,
    new Date().toISOString(),
    "XC"
  );
}

export async function cancelResultatManche(
  participantId: number,
  mancheId: number,
  _operatorId: number
): Promise<void> {
  // await api.post(API.resultatMancheAnnuler, { participantId, mancheId, operatorId });
  staticStore.cancelResultat(participantId, mancheId);
}
