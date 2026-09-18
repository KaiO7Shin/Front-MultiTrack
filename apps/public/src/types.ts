export type Theme = "light" | "dark";

export type PaymentMethod = "MVola" | "Orange Money";

export type AuthTab = "register" | "login";

export type PublicUser = {
  username: string;
  email: string;
  phone: string;
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
  status: string;
  paymentReference: string;
  paymentMethod: PaymentMethod | "";
  totalAmount: number;
  runner: Runner;
};

export type RunnerDraft = {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  courseId: number | "";
  race: string;
  identityFile: File | null;
  medicalFile: File | null;
  parentalFile: File | null;
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
  courseId: "",
  race: "",
  identityFile: null,
  medicalFile: null,
  parentalFile: null,
  tshirtSize: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

/** Ids stables du seed TBB (`genre` : Homme=1, Femme=2). */
export const GENDERS = [
  { id: 2, label: "Femme" },
  { id: 1, label: "Homme" },
] as const;

/** Ids stables du seed TBB (`taille_t_shirt` : XS=1 … XXL=6). */
export const TSHIRT_SIZES = [
  { id: 1, alias: "XS" },
  { id: 2, alias: "S" },
  { id: 3, alias: "M" },
  { id: 4, alias: "L" },
  { id: 5, alias: "XL" },
  { id: 6, alias: "XXL" },
] as const;

export const PAYMENT_METHODS: readonly PaymentMethod[] = ["MVola", "Orange Money"];

/** Longueur de la colonne `info_paiement.reference` côté API. */
export const PAYMENT_REFERENCE_MAX_LENGTH = 30;

export const ACCEPTED_FILES = ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg";
