import { useEffect, useState } from "react";
import { getCountdownParts, type CountdownParts } from "../lib/countdown";

export function useCountdown(targetIso: string): CountdownParts {
  const targetMs = Date.parse(targetIso);

  const [parts, setParts] = useState<CountdownParts>(() =>
    getCountdownParts(Date.now(), targetMs),
  );

  useEffect(() => {
    function tick() {
      const next = getCountdownParts(Date.now(), targetMs);
      setParts(next);
      return next.expired;
    }

    if (tick()) return undefined;

    const id = window.setInterval(() => {
      if (tick()) window.clearInterval(id);
    }, 1_000);

    return () => window.clearInterval(id);
  }, [targetMs]);

  return parts;
}
