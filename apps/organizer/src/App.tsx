import { useEffect, useState, type FormEvent } from "react";
import {
  apiRequest,
  clearToken,
  downloadAuthenticated,
  getToken,
  setToken,
} from "@multitrack/api-client";
import type { AuthResponse, OrganizerDashboard, Registration } from "@multitrack/types";
import { Button, Card, Field, Status } from "@multitrack/ui";

function message(error: unknown) {
  return error instanceof Error ? error.message : "Une erreur inattendue est survenue.";
}

function listFrom<T>(payload: T[] | { data?: T[] }): T[] {
  return Array.isArray(payload) ? payload : payload.data ?? [];
}

function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(getToken()));
  return authenticated ? (
    <OrganizerArea onLogout={() => { clearToken(); setAuthenticated(false); }} />
  ) : (
    <Login onAuthenticated={() => setAuthenticated(true)} />
  );
}

function Login({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await apiRequest<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const token = response.token ?? response.accessToken;
      if (!token) throw new Error("Le serveur n’a pas renvoyé de jeton de connexion.");
      setToken(token);
      onAuthenticated();
    } catch (reason) {
      setError(message(reason));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mt-shell mt-main">
      <Card>
        <h1>Espace organisateur</h1>
        <form className="mt-form" onSubmit={submit}>
          <Field label="Adresse e-mail"><input name="email" type="email" required /></Field>
          <Field label="Mot de passe"><input name="password" type="password" required /></Field>
          <Status loading={loading} error={error} />
          <Button disabled={loading}>Se connecter</Button>
        </form>
      </Card>
    </main>
  );
}

function OrganizerArea({ onLogout }: { onLogout: () => void }) {
  const [dashboard, setDashboard] = useState<OrganizerDashboard | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiRequest<OrganizerDashboard | { data: OrganizerDashboard }>("/api/organizer/dashboard"),
      apiRequest<Registration[] | { data?: Registration[] }>("/api/organizer/registrations"),
    ])
      .then(([dashboardPayload, registrationsPayload]) => {
        setDashboard(
          "data" in dashboardPayload
            ? (dashboardPayload.data as OrganizerDashboard)
            : dashboardPayload,
        );
        setRegistrations(listFrom(registrationsPayload));
      })
      .catch((reason: unknown) => setError(message(reason)))
      .finally(() => setLoading(false));
  }, []);

  async function exportRegistrations() {
    setExporting(true);
    setError(null);
    try {
      await downloadAuthenticated(
        "/api/organizer/registrations/export",
        "inscriptions-multitrack.csv",
      );
    } catch (reason) {
      setError(message(reason));
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <header className="mt-header">
        <div className="mt-shell mt-header-inner">
          <span className="mt-brand">MultiTrack Organisateur</span>
          <Button className="mt-button-secondary" onClick={onLogout}>Déconnexion</Button>
        </div>
      </header>
      <main className="mt-shell mt-main mt-grid">
        <div className="mt-actions">
          <h1>Tableau de bord</h1>
          <Button disabled={exporting} onClick={exportRegistrations}>
            {exporting ? "Export en cours…" : "Exporter les inscriptions"}
          </Button>
        </div>
        <Status loading={loading} error={error} />
        {dashboard && (
          <div className="mt-grid mt-grid-cards">
            <Card><strong>Courses</strong><p>{dashboard.raceCount ?? "—"}</p></Card>
            <Card><strong>Total</strong><p>{dashboard.registrationCount ?? registrations.length}</p></Card>
            <Card><strong>Soumises</strong><p>{dashboard.submittedCount ?? "—"}</p></Card>
            <Card><strong>Validées</strong><p>{dashboard.validatedCount ?? "—"}</p></Card>
          </div>
        )}
        {!loading && (
          <Card>
            <h2>Suivi des inscriptions</h2>
            <div className="mt-table-wrap">
              <table className="mt-table">
                <thead><tr><th>Participant</th><th>E-mail</th><th>Course</th><th>Statut</th><th>Date</th></tr></thead>
                <tbody>
                  {registrations.map((registration) => (
                    <tr key={registration.id}>
                      <td>{[registration.firstName, registration.lastName].filter(Boolean).join(" ") || "—"}</td>
                      <td>{registration.accountEmail ?? "—"}</td>
                      <td>{registration.courseLabel ?? registration.courseId ?? "—"}</td>
                      <td>{registration.status ?? "—"}</td>
                      <td>{registration.createdAt ? new Date(registration.createdAt).toLocaleDateString("fr-FR") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {registrations.length === 0 && <p>Aucune inscription à afficher.</p>}
          </Card>
        )}
      </main>
    </>
  );
}

export default App;
