import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import type { CheckpointMancheMode } from "@/lib/raceRanking";
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

function normalizeResultatMancheView(raw: Record<string, unknown>): ResultatMancheView {
  return {
    id: Number(raw.id ?? 0),
    participantId: Number(raw.participantId ?? raw.participant_id ?? 0),
    mancheId: Number(raw.mancheId ?? raw.manche_id ?? 0),
    tempsDepart: (raw.tempsDepart ?? raw.temps_depart ?? null) as string | null,
    tempsArrive: (raw.tempsArrive ?? raw.tempsArrivee ?? raw.temps_arrivee ?? null) as string | null,
    numDossard: String(raw.numDossard ?? raw.num_dossard ?? ""),
    prenom: String(raw.prenom ?? ""),
    nom: String(raw.nom ?? ""),
  };
}

export async function fetchPhasesByCourse(courseId: number): Promise<Phase[]> {
  const { data } = await api.get<RenderResponse<Phase[]>>(API.phases, {
    params: { courseId },
  });
  return data.data ?? [];
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
  const { data } = await api.post<RenderResponse<Phase>>(API.phase, dto);
  return data.data!;
}

export async function updatePhase(
  id: number,
  dto: PhaseUpdateDTO
): Promise<Phase> {
  const { data } = await api.put<RenderResponse<Phase>>(API.phaseById(id), dto);
  return data.data!;
}

export async function deletePhase(id: number): Promise<void> {
  await api.delete(API.phaseById(id));
}

export async function fetchManchesByPhase(phaseId: number): Promise<Manche[]> {
  const { data } = await api.get<RenderResponse<Manche[]>>(API.manches, {
    params: { phaseId },
  });
  return data.data ?? [];
}

export async function createManche(dto: MancheCreateDTO): Promise<Manche> {
  const { data } = await api.post<RenderResponse<Manche>>(API.manche, dto);
  return data.data!;
}

export async function updateManche(
  id: number,
  dto: MancheUpdateDTO
): Promise<Manche> {
  const { data } = await api.put<RenderResponse<Manche>>(API.mancheById(id), dto);
  return data.data!;
}

export async function deleteManche(id: number): Promise<void> {
  await api.delete(API.mancheById(id));
}

export async function fetchResultatsByManche(
  mancheId: number
): Promise<ResultatMancheView[]> {
  const { data } = await api.get<RenderResponse<ResultatMancheView[]>>(
    API.resultatsManche,
    { params: { mancheId } }
  );
  return (data.data ?? []).map((row) =>
    normalizeResultatMancheView(row as Record<string, unknown>)
  );
}

export async function fetchCheckpointEligibleParticipants(
  courseId: number,
  phaseId: number,
  mancheId: number,
  mode: CheckpointMancheMode
): Promise<ParticipantProjection[]> {
  const { data } = await api.get<RenderResponse<Record<string, unknown>[]>>(
    API.checkpointEligible,
    { params: { courseId, phaseId, mancheId, mode } }
  );
  return (data.data ?? []).map((row) =>
    normalizeParticipantProjection(row, courseId)
  );
}

export async function recordDepart(
  participantId: number,
  mancheId: number,
  recordedAt: string
): Promise<ResultatManche> {
  const { data } = await api.post<RenderResponse<ResultatManche>>(
    API.resultatMancheDepart,
    { participantId, mancheId, recordedAt }
  );
  return data.data!;
}

export async function recordArriveDH(
  participantId: number,
  mancheId: number,
  recordedAt: string
): Promise<ResultatManche> {
  const { data } = await api.post<RenderResponse<ResultatManche>>(
    API.resultatMancheArrivee,
    { participantId, mancheId, mode: "DH", recordedAt }
  );
  return data.data!;
}

export async function recordArriveXC(
  participantId: number,
  mancheId: number
): Promise<ResultatManche> {
  const { data } = await api.post<RenderResponse<ResultatManche>>(
    API.resultatMancheArrivee,
    { participantId, mancheId, mode: "XC" }
  );
  return data.data!;
}
