export const API = {
  publicEvent: "/api/public/event",
  publicRaces: "/api/public/races",
  courses: "/api/courses/",
  categories: "/api/categories",
  courseEligibleCategories: "/api/course/categories_eligibles",
  register: "/api/auth/register",
  login: "/api/auth/login",
  logout: "/api/auth/logout",
  me: "/api/me",
  myRegistrations: "/api/me/registrations",
  myRegistrationDocument: (
    inscriptionId: string | number,
    type: "identite" | "certificat" | "autorisation",
  ) => `/api/me/registrations/${inscriptionId}/documents/${type}`,
  organizerDashboard: "/api/organizer/dashboard",
  organizerRegistrations: "/api/organizer/registrations",
  organizerExport: "/api/organizer/registrations/export",
} as const;
