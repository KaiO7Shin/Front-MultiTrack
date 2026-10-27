import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import { captureClientTimestamp } from "@/lib/utils";
import type { RenderResponse } from "@/lib/type";

export type CheckingMode = "presence" | "arrivee";

export type CheckingResult = {
  bibNumber: string;
  checkedAt: string;
};

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: { message?: string; error?: string } } })
      .response?.data;
    const message = data?.message?.trim();
    if (message) return message;
    const technical = data?.error?.trim();
    if (technical) return technical;
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

export async function checkPresence(bibNumber: string) {
  const { data } = await api.post<RenderResponse<CheckingResult>>(API.checkingPresence, {
    bibNumber,
    recordedAt: captureClientTimestamp(),
  });
  return data;
}

export async function checkArrival(bibNumber: string) {
  const { data } = await api.post<RenderResponse<CheckingResult>>(API.checkingFinishline, {
    bibNumber,
    recordedAt: captureClientTimestamp(),
  });
  return data;
}
