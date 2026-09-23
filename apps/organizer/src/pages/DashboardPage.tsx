import { useState } from "react";
import { Button, Card, Status } from "@multitrack/ui";
import { useOrganizerDashboard } from "../hooks/useOrganizerDashboard";
import { toErrorMessage } from "../services/authService";
import { exportRegistrations } from "../services/organizerService";

export function DashboardPage({ onLogout }: { onLogout: () => void }) {
  const { dashboard, registrations, loading, error, setError } = useOrganizerDashboard();
  const [exporting, setExporting] = useState(false);

  async function exportList() {
    setExporting(true);
    setError(null);
    try {
      await exportRegistrations();
    } catch (reason) {
      setError(toErrorMessage(reason));
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
          <Button disabled={exporting} onClick={exportList}>
            {exporting ? "Export en cours…" : "Exporter les inscriptions"}
          </Button>
        </div>
        <Status loading={loading} error={error} />
        {dashboard && (
          <div className="mt-grid mt-grid-cards">
            <Card><strong>Courses</strong><p>{dashboard.raceCount ?? "—"}</p></Card>
            <Card><strong>Total</strong><p>{dashboard.registrationCount ?? registrations.length}</p></Card>
            <Card><strong>Attente validation</strong><p>{dashboard.pendingValidationCount ?? "—"}</p></Card>
            <Card><strong>Validées</strong><p>{dashboard.validatedCount ?? "—"}</p></Card>
            <Card><strong>Refusées</strong><p>{dashboard.refusedCount ?? "—"}</p></Card>
          </div>
        )}
        {!loading && (
          <Card>
            <h2>Suivi des inscriptions</h2>
            <div className="mt-table-wrap">
              <table className="mt-table">
                <thead>
                  <tr>
                    <th>Participant</th><th>E-mail</th><th>Course</th><th>Statut</th>
                    <th>Paiement</th><th>Référence</th><th>Montant</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((registration) => (
                    <tr key={registration.id}>
                      <td>{[registration.firstName, registration.lastName].filter(Boolean).join(" ") || "—"}</td>
                      <td>{registration.accountEmail ?? "—"}</td>
                      <td>{registration.courseLabel ?? registration.courseId ?? "—"}</td>
                      <td>{registration.status ?? "—"}</td>
                      <td>{registration.paymentMethod ?? "—"}</td>
                      <td>{registration.paymentReference ?? "—"}</td>
                      <td>{registration.totalAmount != null ? `${registration.totalAmount} Ar` : "—"}</td>
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
