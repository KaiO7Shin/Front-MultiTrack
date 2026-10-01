import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import type { RenderResponse } from "@/lib/type";

export type StatutLogEntry = {
  dateCreation: string;
  commentaire: string | null;
};

function normalizeLog(raw: Record<string, unknown>): StatutLogEntry {
  return {
    dateCreation: String(raw.dateCreation ?? ""),
    commentaire:
      raw.commentaire != null && String(raw.commentaire).trim()
        ? String(raw.commentaire).trim()
        : null,
  };
}

async function fetchLogs(path: string): Promise<StatutLogEntry[]> {
  const { data } = await api.get<RenderResponse<Record<string, unknown>[]>>(path);
  const rows = data.data ?? [];
  return rows.map((row) => normalizeLog(row));
}

export function fetchInscriptionStatutLogs(id: number) {
  return fetchLogs(API.inscriptionStatutLogs(id));
}

export function fetchParticipantStatutLogs(id: number) {
  return fetchLogs(API.participantStatutLogs(id));
}
