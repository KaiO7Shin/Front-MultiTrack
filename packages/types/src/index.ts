export interface EventInformation {
  id?: string | number;
  name?: string;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  [key: string]: unknown;
}

export interface PublicRace {
  id: string | number;
  label?: string;
  status?: string;
  type?: string;
  distance?: number;
  elevation?: number;
  startAt?: string;
  [key: string]: unknown;
}

export interface User {
  id?: string | number;
  email: string;
  displayName?: string;
  role?: string;
  enabled?: boolean;
  [key: string]: unknown;
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  user?: User;
  [key: string]: unknown;
}

export interface Registration {
  id: string | number;
  courseId?: string | number;
  courseLabel?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  accountEmail?: string;
  accountDisplayName?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface OrganizerDashboard {
  raceCount?: number;
  registrationCount?: number;
  draftCount?: number;
  submittedCount?: number;
  validatedCount?: number;
  cancelledCount?: number;
  [key: string]: unknown;
}
