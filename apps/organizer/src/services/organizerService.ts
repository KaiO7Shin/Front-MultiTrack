import {
  API,
  apiRequest,
  downloadAuthenticated,
  listFrom,
  unwrapData,
} from "@multitrack/api-client";
import type { OrganizerDashboard, Registration } from "@multitrack/types";

export async function fetchDashboard(): Promise<OrganizerDashboard> {
  const payload = await apiRequest<OrganizerDashboard | { data: OrganizerDashboard }>(
    API.organizerDashboard,
  );
  return unwrapData(payload);
}

export async function fetchRegistrations(): Promise<Registration[]> {
  const payload = await apiRequest<Registration[] | { data?: Registration[] }>(
    API.organizerRegistrations,
  );
  return listFrom(payload);
}

export async function exportRegistrations() {
  await downloadAuthenticated(API.organizerExport, "inscriptions-multitrack.csv");
}
