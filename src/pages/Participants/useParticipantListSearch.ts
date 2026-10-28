import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { fetchAllParticipants } from "@/services/participants";
import {
  beginParticipantListLoad,
  commitParticipantListLoad,
  failParticipantListLoad,
  getCacheEpoch,
  getParticipantListSnapshot,
  isCurrentParticipantListLoad,
  subscribeParticipantList,
} from "@/lib/boMemoryCache";
import type { ParticipantProjection } from "@/lib/type";
import { ALL_STATUTS, type ParticipantListSource } from "./participantListSource";

type UseParticipantListSearchArgs = {
  source: ParticipantListSource;
  courseId: number | "all";
  categoryId: number | "all";
  gender: string;
  status: string;
};

function listErrorMessage(err: unknown) {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e.response?.data?.message || e.message || "Impossible de charger la liste.";
}

let listInflight: Promise<void> | null = null;

/** Un seul chargement de tous les participants. Les filtres restent locaux. */
export function loadParticipantList(force = false) {
  const current = getParticipantListSnapshot();
  if (!force && current.rows) return Promise.resolve();
  if (!force && listInflight) return listInflight;

  const task = fetchParticipantList();
  listInflight = task;
  return task.finally(() => {
    if (listInflight === task) listInflight = null;
  });
}

async function fetchParticipantList() {
  const epochAtStart = getCacheEpoch();
  const loadEpoch = beginParticipantListLoad();
  try {
    const data = await fetchAllParticipants();
    if (epochAtStart !== getCacheEpoch() || !isCurrentParticipantListLoad(loadEpoch)) {
      return;
    }
    commitParticipantListLoad(loadEpoch, loadEpoch, data);
  } catch (err: unknown) {
    failParticipantListLoad(loadEpoch, listErrorMessage(err));
  }
}

export function useParticipantListSearch({
  source,
  courseId,
  gender,
  status,
}: UseParticipantListSearchArgs) {
  const snapshot = useSyncExternalStore(
    subscribeParticipantList,
    getParticipantListSnapshot,
    getParticipantListSnapshot
  );

  useEffect(() => {
    void loadParticipantList(false);
  }, []);

  const reload = useCallback(() => loadParticipantList(true), []);

  const rows = useMemo(
    () =>
      filterParticipantList(snapshot.rows ?? [], {
        source,
        courseId,
        gender,
        status,
      }),
    [snapshot.rows, source, courseId, gender, status]
  );

  return {
    rows,
    loading: snapshot.loading && snapshot.rows == null,
    refreshing: snapshot.loading && snapshot.rows != null,
    error: snapshot.error,
    reload,
  };
}

function filterParticipantList(
  rows: ParticipantProjection[],
  filters: Omit<UseParticipantListSearchArgs, "categoryId">
) {
  return rows.filter((participant) => {
    if (
      participant.source &&
      participant.source !== filters.source
    ) {
      return false;
    }
    if (filters.courseId !== "all" && participant.courseId !== filters.courseId) {
      return false;
    }
    if (filters.gender !== "all" && participant.genre !== filters.gender) {
      return false;
    }
    if (
      filters.status &&
      filters.status !== ALL_STATUTS &&
      participant.statut !== filters.status
    ) {
      return false;
    }
    return true;
  });
}

/** Recherche libre côté client : id, dossard, nom, prénom. */
export function filterParticipantsByQuery(
  rows: ParticipantProjection[],
  query: string
): ParticipantProjection[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((p) => {
    const id = String(p.id);
    const dossard = (p.numDossard || "").trim().toLowerCase();
    const nom = (p.nom || "").toLowerCase();
    const prenom = (p.prenom || "").toLowerCase();
    return (
      id.includes(q) ||
      (dossard.length > 0 && dossard.includes(q)) ||
      nom.includes(q) ||
      prenom.includes(q)
    );
  });
}
