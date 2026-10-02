import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import type { RenderResponse } from "@/lib/type";

export const ERROR_LOG_PAGE_SIZES = ["10", "20", "50", "100", "all"] as const;

export type ErrorLogPageSize = (typeof ERROR_LOG_PAGE_SIZES)[number];

export type ErrorLogListItem = {
  id: number;
  dateCreation: string;
  type: string;
  niveau: string;
  code: string;
};

export type ErrorLogPage = {
  items: ErrorLogListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type ErrorLogDetail = {
  id: number;
  dateCreation: string;
  type: string;
  niveau: string;
  code: string;
  message: string;
  requestId: string;
  endpoint: string;
  httpMethod: string;
  httpStatus: number | null;
  exceptionClass: string;
  stackTrace: string;
  environnement: string;
  metadata: Record<string, unknown> | null;
  resolutionStatut: string;
  compteUtilisateurId: number | null;
  inscriptionId: number | null;
  participantId: number | null;
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

export async function fetchErrorLogs(
  page: number,
  size: ErrorLogPageSize
): Promise<ErrorLogPage> {
  const { data } = await api.get<RenderResponse<Record<string, unknown>>>(API.errorLogs, {
    params: { page, size },
  });
  return normalizePage(data.data);
}

export async function fetchErrorLog(id: number): Promise<ErrorLogDetail> {
  const { data } = await api.get<RenderResponse<Record<string, unknown>>>(
    API.errorLogById(id)
  );
  if (!data.data) {
    throw new Error(data.message || "Journal introuvable");
  }
  return normalizeDetail(data.data);
}

function normalizePage(raw: Record<string, unknown> | null | undefined): ErrorLogPage {
  const source = raw ?? {};
  const items = Array.isArray(source.items) ? source.items : [];
  return {
    items: items.map((row) => normalizeItem(asRecord(row))),
    page: numberOr(source.page, 1),
    size: numberOr(source.size, items.length),
    totalElements: numberOr(source.totalElements, items.length),
    totalPages: numberOr(source.totalPages, 1),
  };
}

function normalizeItem(raw: Record<string, unknown>): ErrorLogListItem {
  return {
    id: numberOr(raw.id, 0),
    dateCreation: text(raw.dateCreation),
    type: text(raw.type),
    niveau: text(raw.niveau),
    code: text(raw.code),
  };
}

function normalizeDetail(raw: Record<string, unknown>): ErrorLogDetail {
  const metadata = asRecord(raw.metadata);
  return {
    ...normalizeItem(raw),
    message: text(raw.message),
    requestId: text(raw.requestId),
    endpoint: text(raw.endpoint),
    httpMethod: text(raw.httpMethod),
    httpStatus: raw.httpStatus == null || raw.httpStatus === "" ? null : numberOr(raw.httpStatus, 0),
    exceptionClass: text(raw.exceptionClass),
    stackTrace: text(raw.stackTrace),
    environnement: text(raw.environnement),
    metadata,
    resolutionStatut: text(raw.resolutionStatut),
    compteUtilisateurId: optionalId(raw.compteUtilisateurId),
    inscriptionId: optionalId(raw.inscriptionId),
    participantId: optionalId(raw.participantId),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function text(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

function numberOr(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalId(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = numberOr(value, 0);
  return parsed > 0 ? parsed : null;
}
