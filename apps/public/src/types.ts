export type Theme = "light" | "dark";

export type PaymentMethod = "MVola" | "Orange Money";

export type AuthTab = "register" | "login";

export type PublicUser = {
  username: string;
  email: string;
  phone: string;
  password: string;
};

export type Runner = {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  category: string;
  race: string;
  identityDocument: string;
  medicalCertificate: string;
  parentalAuthorization?: string;
  tshirtSize: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

export type Registration = {
  id: string;
  createdAt: string;
  status: "Validée";
  paymentReference: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  runner: Runner;
};

export type RunnerDraft = {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  race: string;
  identityDocument: string;
  medicalCertificate: string;
  parentalAuthorization: string;
  tshirtSize: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

export type Race = {
  name: string;
  discipline: string;
  distance: string;
  price: number;
  duo: boolean;
  description: string;
};

export type Category = {
  name: string;
  codeHomme: string;
  codeFemme: string;
  ageMin: string;
  ageMax: string;
};

export type CourseGroup = {
  title: string;
  kind: string;
  races: readonly string[];
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export const EMPTY_DRAFT: RunnerDraft = {
  firstName: "",
  lastName: "",
  birthDate: "",
  gender: "",
  race: "",
  identityDocument: "",
  medicalCertificate: "",
  parentalAuthorization: "",
  tshirtSize: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

export const GENDERS = ["Femme", "Homme", "Non précisé"] as const;

export const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const PAYMENT_METHODS: readonly PaymentMethod[] = ["MVola", "Orange Money"];

export const ACCEPTED_FILES = ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg";
