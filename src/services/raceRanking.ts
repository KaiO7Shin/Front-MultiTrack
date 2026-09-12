import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import type {
  BikeType,
  CategoryGenre,
  DHPhaseRanking,
  EnduroPhaseRanking,
  XCPhaseRanking,
} from "@/lib/type";

export async function fetchDHPhaseRanking(
  courseId: number,
  phaseId: number,
  filters?: { gender?: CategoryGenre; categoryAlias?: string; bikeType?: BikeType }
): Promise<DHPhaseRanking> {
  const { data } = await api.get<{ data: DHPhaseRanking }>(
    API.raceRankingDh(courseId),
    { params: { phaseId, ...filters } }
  );
  return data.data;
}

export async function fetchXCPhaseRanking(
  courseId: number,
  phaseId: number,
  filters?: { gender?: CategoryGenre; categoryAlias?: string }
): Promise<XCPhaseRanking> {
  const { data } = await api.get<{ data: XCPhaseRanking }>(
    API.raceRankingXc(courseId),
    { params: { phaseId, ...filters } }
  );
  return data.data;
}

export async function fetchEnduroPhaseRanking(
  courseId: number,
  phaseId: number,
  filters?: { gender?: CategoryGenre; categoryAlias?: string; bikeType?: BikeType }
): Promise<EnduroPhaseRanking> {
  const { data } = await api.get<{ data: EnduroPhaseRanking }>(
    API.raceRankingEnduro(courseId),
    { params: { phaseId, ...filters } }
  );
  return data.data;
}

export async function disqualifyParticipant(input: {
  participantId: number;
  courseId: number;
  currentPhaseId?: number;
  mancheId?: number;
  reason?: string;
}): Promise<void> {
  await api.post(API.participantDisqualify, input);
}

export async function revokeDisqualification(
  participantId: number
): Promise<void> {
  await api.delete(API.participantRevokeDisqualify(participantId));
}
