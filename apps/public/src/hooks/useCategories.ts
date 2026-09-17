import { toErrorMessage } from "@multitrack/api-client";
import type { CategoryListItem } from "@multitrack/types";
import { useEffect, useState } from "react";
import { fetchCategoriesList } from "../services/catalogService";

export function useCategories() {
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategoriesList()
      .then(setCategories)
      .catch((reason: unknown) => setError(toErrorMessage(reason)))
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading, error };
}
