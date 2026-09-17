import { useEffect, useState } from "react";
import { Play, Square, Timer } from "lucide-react";
import { formatStopwatchMs } from "@/lib/utils";

export type MancheTimerStatus = "idle" | "running" | "stopped";

type MancheTimerProps = {
  status: MancheTimerStatus;
  startedAt: number | null;
  frozenMs: number;
  busy: boolean;
  canStart: boolean;
  onStart: () => void;
  onStop: () => void;
  hint?: string;
};

export function MancheTimer({
  status,
  startedAt,
  frozenMs,
  busy,
  canStart,
  onStart,
  onStop,
  hint,
}: MancheTimerProps) {
  const [displayMs, setDisplayMs] = useState(0);

  useEffect(() => {
    if (status === "stopped") {
      setDisplayMs(frozenMs);
      return;
    }
    if (status !== "running" || startedAt == null) {
      setDisplayMs(0);
      return;
    }
    const tick = () => setDisplayMs(Date.now() - startedAt);
    tick();
    const id = window.setInterval(tick, 47);
    return () => window.clearInterval(id);
  }, [status, startedAt, frozenMs]);

  const running = status === "running";
  const disabled = busy || (!running && !canStart);

  const statusLabel = running
    ? "Manche en cours — appuyez pour arrêter"
    : status === "stopped"
      ? "Manche terminée"
      : hint ?? "Sélectionnez un participant puis lancez sa manche";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-6 flex flex-col items-center gap-5">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Timer className="h-3.5 w-3.5" aria-hidden />
        <span>Chronomètre indicatif</span>
      </div>

      <div
        className={`text-4xl sm:text-5xl font-mono font-semibold tabular-nums tracking-wider ${
          running ? "text-[#8c9962]" : "text-slate-900"
        }`}
        aria-live="polite"
        aria-label={`Chronomètre : ${formatStopwatchMs(displayMs)}`}
      >
        {formatStopwatchMs(displayMs)}
      </div>

      <button
        type="button"
        onClick={running ? onStop : onStart}
        disabled={disabled}
        aria-label={running ? "Arrêter la manche" : "Lancer la manche"}
        className={`relative grid h-28 w-28 place-items-center rounded-full border-4 transition-transform active:scale-95 disabled:opacity-40 disabled:active:scale-100 ${
          running
            ? "border-red-200 bg-red-50"
            : "border-[#8c9962]/30 bg-[#8c9962]/5"
        }`}
      >
        {running && !busy && (
          <span
            className="absolute inset-0 rounded-full bg-red-500/25 animate-ping"
            aria-hidden
          />
        )}
        <span
          className={`relative grid place-items-center text-white shadow-lg transition-all duration-300 ${
            running
              ? "h-12 w-12 rounded-xl bg-red-600"
              : "h-20 w-20 rounded-full bg-[#8c9962]"
          }`}
        >
          {running ? (
            <Square className="h-5 w-5 fill-current" aria-hidden />
          ) : (
            <Play className="h-8 w-8 translate-x-0.5 fill-current" aria-hidden />
          )}
        </span>
      </button>

      <p
        className={`text-xs text-center ${
          running ? "text-red-600 font-medium" : "text-slate-500"
        }`}
      >
        {busy ? "Enregistrement…" : statusLabel}
      </p>
    </div>
  );
}
