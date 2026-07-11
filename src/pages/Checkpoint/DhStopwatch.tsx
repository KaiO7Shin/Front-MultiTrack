import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { formatStopwatchMs } from "@/lib/utils";

export type DhStopwatchStatus = "idle" | "running" | "stopped";

type DhStopwatchProps = {
  status: DhStopwatchStatus;
  startedAt: number | null;
  frozenMs: number;
};

export function DhStopwatch({ status, startedAt, frozenMs }: DhStopwatchProps) {
  const [displayMs, setDisplayMs] = useState(0);

  useEffect(() => {
    if (status === "idle") {
      setDisplayMs(0);
      return;
    }
    if (status === "stopped") {
      setDisplayMs(frozenMs);
      return;
    }
    if (startedAt == null) {
      setDisplayMs(0);
      return;
    }

    const tick = () => setDisplayMs(Date.now() - startedAt);
    tick();
    const id = window.setInterval(tick, 47);
    return () => window.clearInterval(id);
  }, [status, startedAt, frozenMs]);

  const statusLabel =
    status === "running"
      ? "En course…"
      : status === "stopped"
        ? "Manche terminée"
        : "En attente de départ";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-5 text-center">
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mb-2">
        <Timer className="h-3.5 w-3.5" aria-hidden />
        <span>Chronomètre indicatif</span>
      </div>
      <div
        className={`text-3xl sm:text-4xl font-semibold tabular-nums tracking-wider font-mono ${
          status === "running" ? "text-[#8c9962]" : "text-slate-900"
        }`}
        aria-live="polite"
        aria-label={`Chronomètre : ${formatStopwatchMs(displayMs)}`}
      >
        {formatStopwatchMs(displayMs)}
      </div>
      <p
        className={`text-xs mt-2 ${
          status === "running" ? "text-[#8c9962]" : "text-slate-500"
        }`}
      >
        {statusLabel}
      </p>
    </div>
  );
}
