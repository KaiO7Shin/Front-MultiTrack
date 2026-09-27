// API désactivée : données statiques du back-office.
// import api from "@/lib/api";
// import { API } from "@/lib/apiEndpoints";
import { staticStore } from "@/data/staticStore";

export type TrailCheckpointResult = {
  where: "PC" | "FINISHER";
  ts: number;
  cpLabel?: string;
};

export async function recordTrailCheckpoint(
  bibNumber: string,
  controlPointId: number | null
): Promise<TrailCheckpointResult> {
  // if (controlPointId) {
  //   const res = await api.post(API.checkingPc, { bibNumber, controlPointId });
  //   ...
  // }
  // const res = await api.post(API.checkingFinishline, { bibNumber });
  return staticStore.recordTrailCheckpoint(bibNumber, controlPointId);
}
