import { useCallback, useState } from "react";
import {
  fetchDossardPreflight,
  generateDossardsPdf,
} from "@/services/dossards";
import type { DossardPreflight } from "@/lib/type";

export type DossardPhase = "idle" | "checking" | "ready" | "generating" | "done";

export function useDossardGeneration() {
  const [phase, setPhase] = useState<DossardPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [preflight, setPreflight] = useState<DossardPreflight | null>(null);
  const [pdf, setPdf] = useState<{ blob: Blob; filename: string } | null>(null);

  const resetResult = useCallback(() => {
    setPreflight(null);
    setPdf(null);
    setPhase("idle");
    setError(null);
  }, []);

  const verify = useCallback(async (courseId: number) => {
    setError(null);
    setPdf(null);
    setPhase("checking");
    try {
      const report = await fetchDossardPreflight(courseId);
      setPreflight(report);
      setPhase("ready");
    } catch (err) {
      setPreflight(null);
      setPhase("idle");
      setError(messageOf(err, "Impossible de vérifier les dossards."));
    }
  }, []);

  const generate = useCallback(async (courseId: number, file: File) => {
    setError(null);
    setPhase("generating");
    try {
      const result = await generateDossardsPdf(courseId, file);
      setPdf(result);
      setPhase("done");
    } catch (err) {
      setPdf(null);
      setPhase("ready");
      setError(messageOf(err, "Impossible de générer le PDF."));
    }
  }, []);

  return { phase, error, preflight, pdf, verify, generate, resetResult, setError };
}

function messageOf(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
