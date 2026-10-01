export function StatutsPage() {
  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Statuts</h1>
          <p className="page-subtitle">
            Référentiel des statuts participants — à brancher sur l’API.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-white p-6 text-sm text-muted-foreground">
        Aucun statut à afficher pour le moment.
      </div>
    </section>
  );
}
