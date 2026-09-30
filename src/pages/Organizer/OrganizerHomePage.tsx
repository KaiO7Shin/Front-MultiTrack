import { Navigate } from "react-router-dom";
import { ROLE_ORGANIZER, useAuth } from "@/lib/auth";
import { ParticipantsList } from "@/pages/Participants/ParticipantsList";
import { ParticipantManagementPage } from "./ParticipantManagementPage";

/** Index `/participants` : vue orga (gestion) ou liste admin. */
export function ParticipantsIndex() {
  const { user } = useAuth();
  if (user?.role === ROLE_ORGANIZER) {
    return <ParticipantManagementPage />;
  }
  return <ParticipantsList />;
}

/** Ancienne page stub : redirection vers la gestion participant. */
export function OrganizerHomePage() {
  return <Navigate to="/participants" replace />;
}
