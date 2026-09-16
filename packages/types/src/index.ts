export interface RenderResponse<T> {
  code: number;
  data?: T;
  message?: string;
  error?: string;
}

export interface CourseListItem {
  id: number;
  libelle: string;
  distance: number;
  denivele_positif: number;
  tarif: number | null;
  description: string | null;
  type_course: string;
}

export interface CategoryListItem {
  id: number;
  libelle: string;
  alias: string;
  age_min: number | null;
  age_max: number | null;
}

export interface EligibleCategoryItem {
  libelle_categorie: string;
}

export interface CourseEligibleCategories {
  libelle_course: string;
  nom_course: string;
  categories_eligibles: EligibleCategoryItem[];
}

export interface EventInformation {
  name?: string;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
}

export interface PublicRace {
  id: number | string;
  label?: string;
  status?: string;
  type?: string;
  distance?: number;
  elevation?: number;
  startAt?: string;
  nomSequence?: string;
  dureeBarriereHoraire?: string;
  tarif?: number;
  description?: string;
}

export interface Account {
  id?: number | string;
  email: string;
  phone?: string;
}

export interface User {
  id?: number | string;
  email: string;
  displayName?: string;
  role?: string;
  enabled?: boolean;
  phone?: string;
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  user?: User;
  account?: Account;
}

export interface RegisterRequest {
  email: string;
  password: string;
  phone: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Registration {
  id: number | string;
  courseId?: number | string;
  courseLabel?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: string;
  genderId?: number;
  tShirtSize?: string;
  tShirtSizeId?: number;
  identityDocumentUrl?: string;
  medicalCertificateUrl?: string;
  parentalAuthorizationUrl?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  phone?: string;
  accountId?: number | string;
  accountEmail?: string;
  accountPhone?: string;
  accountDisplayName?: string;
  status?: string;
  createdAt?: string;
}

export interface CreateRegistrationRequest {
  courseId: number;
  lastName: string;
  firstName?: string;
  birthDate: string;
  genderId: number;
  tShirtSizeId: number;
  identityDocumentUrl: string;
  medicalCertificateUrl?: string;
  parentalAuthorizationUrl?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  status?: string;
}

export interface OrganizerDashboard {
  raceCount?: number;
  registrationCount?: number;
  draftCount?: number;
  submittedCount?: number;
  validatedCount?: number;
  cancelledCount?: number;
}
