import {
  getCacheEpoch,
  isCurrentClassementRequest,
  nextClassementRequest,
  readClassement,
  writeClassement,
} from "@/lib/boMemoryCache";
import { fetchClassement, type ClassementLigne } from "@/services/classement";

const inflight = new Map<number, Promise<ClassementLigne[]>>();

/** Classement d’une course : un appel, puis lectures mémoire jusqu’au rafraîchissement. */
export function loadClassementCached(courseId: number, force = false) {
  if (!force) {
    const cached = readClassement(courseId);
    if (cached) return Promise.resolve(cached);
    const pending = inflight.get(courseId);
    if (pending) return pending;
  }

  const epoch = getCacheEpoch();
  const requestId = nextClassementRequest(courseId);
  const task = fetchClassement(courseId)
    .then((rows) => {
      if (
        epoch === getCacheEpoch() &&
        isCurrentClassementRequest(courseId, requestId)
      ) {
        writeClassement(courseId, rows);
      }
      return rows;
    })
    .finally(() => {
      if (inflight.get(courseId) === task) inflight.delete(courseId);
    });
  inflight.set(courseId, task);
  return task;
}
