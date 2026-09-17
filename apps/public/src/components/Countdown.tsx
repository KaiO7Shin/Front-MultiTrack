import { EVENT_INFO, EVENT_START_AT } from "../data/catalog";
import { useCountdown } from "../hooks/useCountdown";
import { padCountdown } from "../lib/countdown";

const UNITS = [
  { key: "days", label: "jours" },
  { key: "hours", label: "heures" },
  { key: "minutes", label: "minutes" },
  { key: "seconds", label: "secondes" },
] as const;

export function Countdown() {
  const parts = useCountdown(EVENT_START_AT);

  return (
    <div
      className="countdown"
      role="timer"
      aria-label={`Compte à rebours jusqu’au ${EVENT_INFO.dateLabel}`}
    >
      <p className="eyebrow">{EVENT_INFO.dateLabel}</p>
      <h2>Rendez-vous dans</h2>
      <div className="countdown-track">
        {UNITS.map((unit) => (
          <div className="countdown-unit" key={unit.key}>
            <span className="countdown-value">{padCountdown(parts[unit.key])}</span>
            <span className="countdown-label">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
