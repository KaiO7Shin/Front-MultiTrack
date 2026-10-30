import { fetchClassement, type ClassementLigne } from "@/services/classement";

const cache = new Map<number, ClassementLigne[]>();
const inflight = new Map<number, Promise<ClassementLigne[]>>();

export function clearClassementCache() {
  cache.clear();
  inflight.clear();
}

/** Classement d’une course : un appel, puis lectures mémoire jusqu’au rafraîchissement. */
export function loadClassementCached(courseId: number, force = false) {
  if (!force) {
    const cached = cache.get(courseId);
    if (cached) return Promise.resolve(cached);
    const pending = inflight.get(courseId);
    if (pending) return pending;
  }

  const task = fetchClassement(courseId)
    .then((rows) => {
      cache.set(courseId, rows);
      return rows;
    })
    .finally(() => {
      if (inflight.get(courseId) === task) inflight.delete(courseId);
    });
  inflight.set(courseId, task);
  return task;
}
