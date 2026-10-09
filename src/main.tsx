import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "./index.css";

import { DashboardPage } from "./pages/Dashboard/DashboardPage";
import { CoursesList } from "./pages/Courses/CoursesList";
import { CategoriesList } from "./pages/Categories/CategoriesList";
import { CourseDetails } from "./pages/Courses/CourseDetails";
import { ImportParticipants } from "./pages/Participants/ImportParticipants";
import { AddParticipant } from "./pages/Participants/AddParticipant";
import { ParticipantPage } from "./pages/Participants/ParticipantPage";
import { ParticipantsPage } from "./pages/Participants/ParticipantsPage";
import { ParticipantDetailPage } from "./pages/Participants/ParticipantDetailPage";
import { InscriptionDetailPage } from "./pages/Participants/InscriptionDetailPage";
import { TshirtsPage } from "./pages/Tshirts/TshirtsPage";
import { DossardsPage } from "./pages/Dossards/DossardsPage";
import { CheckpointScan } from "./pages/Checkpoint/CheckpointScan";
import { CheckpointHistory } from "./pages/Checkpoint/CheckpointHistory";
import { LeaderboardPage } from "./pages/Leaderboard/LeaderboardPage";
import { LoginPage } from "./pages/Auth/LoginPage";
import { PointeursList } from "./pages/Pointeurs/PointeursList";
import { StatutsPage } from "./pages/Statuts/StatutsPage";
import { EligibilitesPage } from "./pages/Eligibilites/EligibilitesPage";
import { ErrorLogDetailPage } from "./pages/ErrorLogs/ErrorLogDetailPage";
import { ErrorLogsPage } from "./pages/ErrorLogs/ErrorLogsPage";
import { ComptesPage } from "./pages/Comptes/ComptesPage";

import {
  AuthProvider,
  RequireAuth,
  RequireRole,
  ROLE_ADMIN,
  ROLE_ORGANIZER,
  RoleHomeRedirect,
} from "./lib/auth";
import { OrganizerHomePage } from "./pages/Organizer/OrganizerHomePage";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <>
          <App />
        </>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <RoleHomeRedirect /> },
      { path: "dashboard", element: <DashboardPage /> },

      { path: "courses", element: <CoursesList /> },
      { path: "categories", element: <CategoriesList /> },
      {
        path: "statuts",
        element: (
          <RequireRole role={ROLE_ADMIN}>
            <StatutsPage />
          </RequireRole>
        ),
      },
      {
        path: "eligibilites",
        element: (
          <RequireRole role={ROLE_ADMIN}>
            <EligibilitesPage />
          </RequireRole>
        ),
      },
      { path: "courses/:id", element: <CourseDetails /> },

      { path: "participants", element: <ParticipantsPage /> },
      { path: "participants/import", element: <ImportParticipants /> },
      { path: "participants/add", element: <AddParticipant /> },
      { path: "participants/identity", element: <ParticipantPage /> },
      { path: "participants/:id", element: <ParticipantDetailPage /> },
      { path: "inscriptions/:id", element: <InscriptionDetailPage /> },
      { path: "tshirts", element: <TshirtsPage /> },
      {
        path: "dossards",
        element: (
          <RequireRole role={ROLE_ADMIN}>
            <DossardsPage />
          </RequireRole>
        ),
      },

      { path: "checkpoint/scan", element: <CheckpointScan /> },
      { path: "checkpoint/history", element: <CheckpointHistory /> },

      {
        path: "pointeurs",
        element: (
          <RequireRole role={ROLE_ADMIN}>
            <PointeursList />
          </RequireRole>
        ),
      },

      { path: "leaderboard", element: <LeaderboardPage /> },

      {
        path: "comptes",
        element: (
          <RequireRole role={ROLE_ADMIN}>
            <ComptesPage />
          </RequireRole>
        ),
      },

      {
        path: "journaux",
        element: (
          <RequireRole role={ROLE_ADMIN}>
            <ErrorLogsPage />
          </RequireRole>
        ),
      },
      {
        path: "journaux/:id",
        element: (
          <RequireRole role={ROLE_ADMIN}>
            <ErrorLogDetailPage />
          </RequireRole>
        ),
      },

      {
        path: "organisateur",
        element: (
          <RequireRole role={[ROLE_ORGANIZER, ROLE_ADMIN]}>
            <OrganizerHomePage />
          </RequireRole>
        ),
      },
    ],
  },
  { path: "*", element: <RoleHomeRedirect /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
