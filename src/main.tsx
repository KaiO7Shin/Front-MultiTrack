import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import App from "./App";
import "./index.css";

import { DashboardPage } from "./pages/Dashboard/DashboardPage";
import { CoursesList } from "./pages/Courses/CoursesList";
import { CategoriesList } from "./pages/Categories/CategoriesList";
import { CourseDetails } from "./pages/Courses/CourseDetails";
import { ParticipantsList } from "./pages/Participants/ParticipantsList";
import { ImportParticipants } from "./pages/Participants/ImportParticipants";
import { AddParticipant } from "./pages/Participants/AddParticipant";
import { CheckpointScan } from "./pages/Checkpoint/CheckpointScan";
import { CheckpointHistory } from "./pages/Checkpoint/CheckpointHistory";
import { LeaderboardPage } from "./pages/Leaderboard/LeaderboardPage";
import { LoginPage } from "./pages/Auth/LoginPage";
import { PointeursList } from "./pages/Pointeurs/PointeursList";

import { AuthProvider, RequireAuth, RequireRole, ROLE_ADMIN } from "./lib/auth";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    // Tout le “site” derrière un garde
    path: "/",
    element: (
      <RequireAuth>
        <>
          <App /> {/* Assure-toi que App rend <Outlet/> */}
        </>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },

      { path: "courses", element: <CoursesList /> },
      { path: "categories", element: <CategoriesList /> },
      { path: "courses/:id", element: <CourseDetails /> },

      { path: "participants", element: <ParticipantsList /> },
      { path: "participants/import", element: <ImportParticipants /> },
      { path: "participants/add", element: <AddParticipant /> },

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
    ],
  },
  // Redirige tout le reste
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
