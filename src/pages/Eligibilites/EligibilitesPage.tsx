export function EligibilitesPage() {
  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Éligibilités</h1>
          <p className="page-subtitle">
            Catégories éligibles par course — à brancher sur l’API.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-white p-6 text-sm text-muted-foreground">
        Aucune configuration d’éligibilité pour le moment.
      </div>
    </section>
  );
}
