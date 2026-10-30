import { toErrorMessage } from "@multitrack/api-client";
import { useEffect, useState } from "react";
import { loadPublicFlags, type PublicFlags } from "../services/publicSite";

export function usePublicFlags() {
  const [flags, setFlags] = useState<PublicFlags | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    loadPublicFlags()
      .then((value) => {
        if (active) setFlags(value);
      })
      .catch((reason: unknown) => {
        if (active) setError(toErrorMessage(reason));
      });
    return () => {
      active = false;
    };
  }, []);

  return { flags, error, ready: flags !== null || error !== "" };
}
