import { toErrorMessage } from "@multitrack/api-client";
import type { CourseEligibleCategories } from "@multitrack/types";
import { useEffect, useState } from "react";
import { fetchEligibleCategoriesByCourse } from "../services/catalogService";

export function useEligibleCategories() {
  const [courses, setCourses] = useState<CourseEligibleCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEligibleCategoriesByCourse()
      .then(setCourses)
      .catch((reason: unknown) => setError(toErrorMessage(reason)))
      .finally(() => setLoading(false));
  }, []);

  return { courses, loading, error };
}
