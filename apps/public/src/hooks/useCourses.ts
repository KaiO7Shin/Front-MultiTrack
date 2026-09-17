import { toErrorMessage } from "@multitrack/api-client";
import { useEffect, useMemo, useState } from "react";
import {
  fetchCourses,
  groupCoursesByType,
} from "../services/catalogService";
import type { CourseListItem } from "@multitrack/types";

export function useCourses() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses()
      .then(setCourses)
      .catch((reason: unknown) => setError(toErrorMessage(reason)))
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => groupCoursesByType(courses), [courses]);

  return { courses, groups, loading, error };
}
