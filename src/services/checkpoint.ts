import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import { apiWriteOrLocal } from "@/lib/apiFallback";

export type TrailCheckpointResult = {
  where: "PC" | "FINISHER";
  ts: number;
  cpLabel?: string;
};

export async function recordTrailCheckpoint(
  bibNumber: string,
  controlPointId: number | null
): Promise<TrailCheckpointResult> {
  return apiWriteOrLocal(
    async () => {
      if (controlPointId) {
        const res = await api.post(API.checkingPc, { bibNumber, controlPointId });
        const data = res?.data ?? {};
        const iso = data?.checkpointTime as string | undefined;
        return {
          where: "PC" as const,
          ts: iso ? Date.parse(iso) : Date.now(),
          cpLabel: data?.controlPoint?.label as string | undefined,
        };
      }
      const res = await api.post(API.checkingFinishline, { bibNumber });
      const data = res?.data ?? {};
      const iso = data?.arrivalTime as string | undefined;
      return {
        where: "FINISHER" as const,
        ts: iso ? Date.parse(iso) : Date.now(),
        cpLabel: undefined,
      };
    },
    () => {
      const now = Date.now();
      if (controlPointId) {
        return {
          where: "PC" as const,
          ts: now,
          cpLabel: `PC #${controlPointId} (local)`,
        };
      }
      return { where: "FINISHER" as const, ts: now };
    },
    controlPointId
      ? `POST ${API.checkingPc}`
      : `POST ${API.checkingFinishline}`
  );
}
