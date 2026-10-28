import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { BackOfficeShell } from "./components/BackOfficeShell";
import { isPathAllowedForRole, navItemsForRole } from "./config/backOfficeNav";
import {
  ROLE_ADMIN,
  homePathForRole,
  useAuth,
} from "./lib/auth";

export default function App() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const role = user?.role;

  useEffect(() => {
    if (role != null && role !== ROLE_ADMIN) {
      signOut();
      navigate("/login", { replace: true });
      return;
    }
    if (role != null && !isPathAllowedForRole(location.pathname, role)) {
      navigate(homePathForRole(role), { replace: true });
    }
  }, [role, location.pathname, navigate, signOut]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    signOut();
    navigate("/login", { replace: true });
  }

  // Pack essential : shell checkpoint commenté. Un seul rôle, ADMIN.
  // if (role === ROLE_CHECKPOINT) {
  //   return (
  //     <CheckpointShell homeTo="/checkpoint/scan" onLogout={handleLogout}>
  //       <CheckpointScan />
  //     </CheckpointShell>
  //   );
  // }

  const roleLabel = "Admin";

  return (
    <BackOfficeShell
      homeTo={homePathForRole(role)}
      navItems={navItemsForRole(role)}
      roleLabel={roleLabel}
      userName={user?.name ?? user?.libelle}
      open={open}
      onOpenChange={setOpen}
      onLogout={handleLogout}
      settingsTo={role === ROLE_ADMIN ? "/parametres" : undefined}
    >
      <Outlet />
    </BackOfficeShell>
  );
}
