import type { ClassementLigne } from "@/services/classement";
import type { ParticipantProjection, ParticipantStatus } from "@/lib/type";

/**
 * Cache mémoire de la session back-office.
 * Jamais écrit dans localStorage / sessionStorage (données nominatives).
 * Vidé à la déconnexion, à l’expiration du jeton, et à la fermeture de l’onglet.
 */

type Listener = () => void;

type Overlay =
  | { rev: number; kind: "upsert"; row: ParticipantProjection }
  | { rev: number; kind: "delete" };

export type ParticipantListSnapshot = {
  rows: ParticipantProjection[] | null;
  loading: boolean;
  error: string | null;
};

const listeners = new Set<Listener>();
const overlays = new Map<number, Overlay>();
const classements = new Map<number, ClassementLigne[]>();
const classementRequests = new Map<number, number>();

let revision = 0;
let cacheEpoch = 0;
let listLoadEpoch = 0;
let snapshot: ParticipantListSnapshot = {
  rows: null,
  loading: false,
  error: null,
};

function emit() {
  listeners.forEach((listener) => listener());
}

function publish(next: ParticipantListSnapshot) {
  snapshot = next;
  emit();
}

export function subscribeParticipantList(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getParticipantListSnapshot() {
  return snapshot;
}

export function getCacheEpoch() {
  return cacheEpoch;
}

export function beginParticipantListLoad() {
  listLoadEpoch = ++revision;
  publish({ ...snapshot, loading: true, error: null });
  return listLoadEpoch;
}

export function isCurrentParticipantListLoad(epoch: number) {
  return epoch === listLoadEpoch && epoch > 0;
}

export function commitParticipantListLoad(
  epoch: number,
  startRev: number,
  rows: ParticipantProjection[]
) {
  if (!isCurrentParticipantListLoad(epoch)) return;
  publish({
    rows: applyOverlays(rows, startRev),
    loading: false,
    error: null,
  });
}

export function failParticipantListLoad(epoch: number, message: string) {
  if (!isCurrentParticipantListLoad(epoch)) return;
  publish({ ...snapshot, loading: false, error: message });
}

function applyOverlays(rows: ParticipantProjection[], startRev: number) {
  let next = rows.slice();
  for (const [id, overlay] of overlays) {
    if (overlay.rev <= startRev) {
      overlays.delete(id);
      continue;
    }
    next = next.filter((row) => row.id !== id);
    if (overlay.kind === "upsert") next.push(overlay.row);
    overlays.delete(id);
  }
  return next;
}

function upsertLocal(row: ParticipantProjection) {
  const current = snapshot.rows;
  if (!current) return;
  const without = current.filter((item) => item.id !== row.id);
  publish({ ...snapshot, rows: [...without, row] });
}

function rememberCourse(row: ParticipantProjection | undefined) {
  if (row?.courseId) classements.delete(row.courseId);
}

export function replaceParticipantInCache(row: ParticipantProjection) {
  const previous = snapshot.rows?.find((item) => item.id === row.id);
  rememberCourse(previous);
  rememberCourse(row);
  const rev = ++revision;
  overlays.set(row.id, { rev, kind: "upsert", row });
  upsertLocal(row);
}

export function removeParticipantFromCache(id: number) {
  const previous = snapshot.rows?.find((item) => item.id === id);
  rememberCourse(previous);
  const rev = ++revision;
  overlays.set(id, { rev, kind: "delete" });
  if (snapshot.rows) {
    publish({
      ...snapshot,
      rows: snapshot.rows.filter((item) => item.id !== id),
    });
  }
}

export function patchParticipantStatusByBib(
  bib: string,
  statut: ParticipantStatus,
  extras?: { temps?: string | null }
) {
  const needle = bib.trim();
  const current = snapshot.rows?.find((item) => item.numDossard.trim() === needle);
  if (!current) return;
  const nextTemps = extras && "temps" in extras ? extras.temps : current.temps;
  if (current.statut === statut && current.temps === nextTemps) return;
  replaceParticipantInCache({ ...current, statut, temps: nextTemps });
}

export function readClassement(courseId: number) {
  return classements.get(courseId);
}

export function writeClassement(courseId: number, rows: ClassementLigne[]) {
  classements.set(courseId, rows);
}

export function nextClassementRequest(courseId: number) {
  const next = (classementRequests.get(courseId) ?? 0) + 1;
  classementRequests.set(courseId, next);
  return next;
}

export function isCurrentClassementRequest(courseId: number, requestId: number) {
  return classementRequests.get(courseId) === requestId;
}

export function clearBoMemoryCaches() {
  cacheEpoch += 1;
  listLoadEpoch = ++revision;
  overlays.clear();
  classements.clear();
  classementRequests.clear();
  publish({ rows: null, loading: false, error: null });
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    clearBoMemoryCaches();
  });
}
