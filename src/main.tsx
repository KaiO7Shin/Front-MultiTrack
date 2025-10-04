import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import App from "./App";
import "./index.css";

import { DashboardPage } from "./pages/Dashboard/DashboardPage";
import { CoursesList } from "./pages/Courses/CoursesList";
import { CourseDetails } from "./pages/Courses/CourseDetails";
import { ParticipantsList } from "./pages/Participants/ParticipantsList";
import { ImportParticipants } from "./pages/Participants/ImportParticipants";
import { AddParticipant } from "./pages/Participants/AddParticipant";
import { CheckpointScan } from "./pages/Checkpoint/CheckpointScan";
import { CheckpointHistory } from "./pages/Checkpoint/CheckpointHistory";
import { LeaderboardPage } from "./pages/Leaderboard/LeaderboardPage";
import { LoginPage } from "./pages/Auth/LoginPage";

import { AuthProvider, RequireAuth } from "./lib/auth"; // <== ton fichier de contexte


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
      { index: true, element: <DashboardPage /> },
      { path: "dashboard", element: <DashboardPage /> },

      { path: "courses", element: <CoursesList /> },
      { path: "courses/:id", element: <CourseDetails /> },

      { path: "participants", element: <ParticipantsList /> },
      { path: "participants/import", element: <ImportParticipants /> },
      { path: "participants/add", element: <AddParticipant /> },

      { path: "checkpoint/scan", element: <CheckpointScan /> },
      { path: "checkpoint/history", element: <CheckpointHistory /> },

      { path: "leaderboard", element: <LeaderboardPage /> },
    ],
  },
  // Redirige tout le reste
  { path: "*", element: <Navigate to="/" replace /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
