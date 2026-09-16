import { useEffect, useState } from "react";
import type { OrganizerDashboard, Registration } from "@multitrack/types";
import { toErrorMessage } from "../services/authService";
import { fetchDashboard, fetchRegistrations } from "../services/organizerService";

export function useOrganizerDashboard() {
  const [dashboard, setDashboard] = useState<OrganizerDashboard | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchDashboard(), fetchRegistrations()])
      .then(([dashboardPayload, registrationsPayload]) => {
        setDashboard(dashboardPayload);
        setRegistrations(registrationsPayload);
      })
      .catch((reason: unknown) => setError(toErrorMessage(reason)))
      .finally(() => setLoading(false));
  }, []);

  return { dashboard, registrations, loading, error, setError };
}
