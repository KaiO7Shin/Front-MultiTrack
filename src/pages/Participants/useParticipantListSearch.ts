import { useCallback, useEffect, useState } from "react";
import { searchParticipants } from "@/services/participants";
import type { ParticipantProjection } from "@/lib/type";
import type { ParticipantListSource } from "./participantListSource";

type UseParticipantListSearchArgs = {
  source: ParticipantListSource;
  courseId: number | "all";
  categoryId: number | "all";
  gender: string;
  status: string;
};

export function useParticipantListSearch({
  source,
  courseId,
  categoryId,
  gender,
  status,
}: UseParticipantListSearchArgs) {
  const [rows, setRows] = useState<ParticipantProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchParticipants({
        source,
        courseId: courseId === "all" ? undefined : courseId,
        categorieId:
          source === "PARTICIPANT" && categoryId !== "all" ? categoryId : undefined,
        genre: gender === "all" ? undefined : gender,
        statut: status || undefined,
      });
      setRows(data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setRows([]);
      setError(
        e.response?.data?.message || e.message || "Impossible de charger la liste."
      );
    } finally {
      setLoading(false);
    }
  }, [source, courseId, categoryId, gender, status]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { rows, loading, error, setError, reload };
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
