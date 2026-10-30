import { API, apiRequest } from "@multitrack/api-client";
import type { RenderResponse } from "@multitrack/types";

export type PublicFlags = {
  finInscription: boolean;
  pubInscrits: boolean;
};

export type PublicInscrit = {
  dossard: string;
  nom: string;
  prenom: string;
  course: string;
  genre: string;
  categorie: string;
};

let flagsCache: PublicFlags | undefined;
let flagsRequest: Promise<PublicFlags> | undefined;

const inscritsCache = new Map<number, PublicInscrit[]>();
const inscritsRequests = new Map<number, Promise<PublicInscrit[]>>();

export function loadPublicFlags(): Promise<PublicFlags> {
  if (flagsCache) return Promise.resolve(flagsCache);
  flagsRequest ??= apiRequest<RenderResponse<PublicFlags>>(API.publicParametres)
    .then((payload) => {
      if (!payload.data) {
        throw new Error(payload.message || "Impossible de lire les paramètres.");
      }
      flagsCache = payload.data;
      return payload.data;
    })
    .finally(() => {
      flagsRequest = undefined;
    });
  return flagsRequest;
}

export function loadInscrits(courseId: number): Promise<PublicInscrit[]> {
  const cached = inscritsCache.get(courseId);
  if (cached) return Promise.resolve(cached);
  const running = inscritsRequests.get(courseId);
  if (running) return running;

  const request = apiRequest<RenderResponse<PublicInscrit[]>>(
    `${API.publicInscrits}?courseId=${courseId}`,
  )
    .then((payload) => {
      if (!payload.data) {
        throw new Error(payload.message || "Impossible de charger les inscrits.");
      }
      inscritsCache.set(courseId, payload.data);
      return payload.data;
    })
    .finally(() => {
      inscritsRequests.delete(courseId);
    });
  inscritsRequests.set(courseId, request);
  return request;
}
