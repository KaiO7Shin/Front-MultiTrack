export const API = {
  publicEvent: "/api/public/event",
  publicRaces: "/api/public/races",
  courses: "/api/courses/",
  categories: "/api/categories",
  courseEligibleCategories: "/api/course/categories_eligibles",
  register: "/api/auth/register",
  login: "/api/auth/login",
  me: "/api/me",
  myRegistrations: "/api/me/registrations",
  organizerDashboard: "/api/organizer/dashboard",
  organizerRegistrations: "/api/organizer/registrations",
  organizerExport: "/api/organizer/registrations/export",
} as const;
