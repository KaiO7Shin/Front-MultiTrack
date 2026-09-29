import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { BackOfficeShell, CheckpointShell } from "./components/BackOfficeShell";
import { CheckpointScan } from "./pages/Checkpoint/CheckpointScan";
import { isPathAllowedForRole, navItemsForRole } from "./config/backOfficeNav";
import {
  ROLE_ADMIN,
  ROLE_CHECKPOINT,
  ROLE_ORGANIZER,
  homePathForRole,
  useAuth,
} from "./lib/auth";

const ROLE_LABEL = {
  [ROLE_ADMIN]: "Admin",
  [ROLE_ORGANIZER]: "Organisateur",
  [ROLE_CHECKPOINT]: "Checkpoint",
} as const;

export default function App() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const role = user?.role;
  const isCollaborateur = role === ROLE_CHECKPOINT;
  const assignedManches = user?.assignedManches ?? [];
  const collaborateurLabel =
    user?.libelle?.trim() ||
    user?.assignedControlPoint?.label ||
    (assignedManches.length === 1
      ? `${assignedManches[0].courseLabel} / ${assignedManches[0].label}`
      : assignedManches.length > 1
        ? `${assignedManches.length} manches`
        : null);

  useEffect(() => {
    if (isCollaborateur && !location.pathname.startsWith("/checkpoint")) {
      navigate("/checkpoint/scan", { replace: true });
      return;
    }
    if (role != null && !isPathAllowedForRole(location.pathname, role)) {
      navigate(homePathForRole(role), { replace: true });
    }
  }, [isCollaborateur, role, location.pathname, navigate]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    signOut();
    navigate("/login", { replace: true });
  }

  if (isCollaborateur) {
    return (
      <CheckpointShell
        homeTo={homePathForRole(role)}
        label={collaborateurLabel}
        onLogout={handleLogout}
      >
        <CheckpointScan />
      </CheckpointShell>
    );
  }

  const roleLabel =
    role === ROLE_ADMIN || role === ROLE_ORGANIZER ? ROLE_LABEL[role] : "Session";

  return (
    <BackOfficeShell
      homeTo={homePathForRole(role)}
      navItems={navItemsForRole(role)}
      roleLabel={roleLabel}
      userName={user?.name ?? user?.libelle}
      open={open}
      onOpenChange={setOpen}
      onLogout={handleLogout}
    >
      <Outlet />
    </BackOfficeShell>
  );
}
