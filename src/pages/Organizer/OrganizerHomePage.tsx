import { Navigate } from "react-router-dom";
import { ParticipantsPage } from "@/pages/Participants/ParticipantsPage";

/** Index `/participants` — page unique admin / organisateur. */
export function ParticipantsIndex() {
  return <ParticipantsPage />;
}

/** Ancienne page stub : redirection vers la gestion participant. */
export function OrganizerHomePage() {
  return <Navigate to="/participants" replace />;
}
