import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, Spinner } from "@/components/ui/feedback";
import { DetailRow } from "@/pages/Participants/detailShared";
import {
  apiErrorMessage,
  fetchErrorLog,
  type ErrorLogDetail,
} from "@/services/errorLogs";
import { displayErrorLogValue, formatErrorLogDate } from "./errorLogFormat";

export function ErrorLogDetailPage() {
  const { id } = useParams();
  const logId = Number(id);
  const [detail, setDetail] = useState<ErrorLogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(logId) || logId <= 0) {
      setLoading(false);
      setError("Journal introuvable");
      setDetail(null);
      return;
    }
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchErrorLog(logId);
        if (mounted) setDetail(data);
      } catch (err: unknown) {
        if (!mounted) return;
        setDetail(null);
        setError(apiErrorMessage(err, "Impossible de charger ce journal."));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [logId]);

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Journal {Number.isFinite(logId) && logId > 0 ? `#${logId}` : ""}
          </p>
          <h1 className="page-title">Détail de l’erreur</h1>
        </div>
        <Link
          to="/journaux"
          className="inline-flex items-center hover:opacity-80"
          aria-label="Retour"
        >
          <img src="/bouton-retour.svg" alt="" className="h-8 w-8" aria-hidden />
        </Link>
      </div>

      {error && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}

      {loading && (
        <div className="flex items-center gap-2 justify-center p-8 text-slate-500">
          <Spinner className="text-brand" />
          <span className="text-sm">Chargement du journal…</span>
        </div>
      )}

      {detail && <ErrorLogDetailBody detail={detail} />}
    </section>
  );
}

function ErrorLogDetailBody({ detail }: { detail: ErrorLogDetail }) {
  const metadata =
    detail.metadata && Object.keys(detail.metadata).length > 0
      ? JSON.stringify(detail.metadata, null, 2)
      : "";

  return (
    <div className="grid gap-4">
      <section className="bg-white border rounded-2xl p-4 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand mb-2">
          Synthèse
        </h2>
        <dl>
          <DetailRow label="Date">{formatErrorLogDate(detail.dateCreation)}</DetailRow>
          <DetailRow label="Type">{displayErrorLogValue(detail.type)}</DetailRow>
          <DetailRow label="Niveau">{displayErrorLogValue(detail.niveau)}</DetailRow>
          <DetailRow label="Code">{displayErrorLogValue(detail.code)}</DetailRow>
          <DetailRow label="Statut de résolution">
            {displayErrorLogValue(detail.resolutionStatut)}
          </DetailRow>
          <DetailRow label="Environnement">
            {displayErrorLogValue(detail.environnement)}
          </DetailRow>
          <DetailRow label="Message">{displayErrorLogValue(detail.message)}</DetailRow>
        </dl>
      </section>

      <section className="bg-white border rounded-2xl p-4 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand mb-2">
          Requête
        </h2>
        <dl>
          <DetailRow label="Request id">{displayErrorLogValue(detail.requestId)}</DetailRow>
          <DetailRow label="Endpoint">{displayErrorLogValue(detail.endpoint)}</DetailRow>
          <DetailRow label="Méthode HTTP">{displayErrorLogValue(detail.httpMethod)}</DetailRow>
          <DetailRow label="Statut HTTP">{displayErrorLogValue(detail.httpStatus)}</DetailRow>
          <DetailRow label="Classe d’exception">
            {displayErrorLogValue(detail.exceptionClass)}
          </DetailRow>
          <DetailRow label="Compte">{displayErrorLogValue(detail.compteUtilisateurId)}</DetailRow>
          <DetailRow label="Inscription">{displayErrorLogValue(detail.inscriptionId)}</DetailRow>
          <DetailRow label="Participant">{displayErrorLogValue(detail.participantId)}</DetailRow>
        </dl>
      </section>

      <section className="bg-white border rounded-2xl p-4 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand mb-2">
          Métadonnées
        </h2>
        {metadata ? (
          <pre className="overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-700 whitespace-pre-wrap">
            {metadata}
          </pre>
        ) : (
          <p className="text-sm text-slate-500">—</p>
        )}
      </section>

      <section className="bg-white border rounded-2xl p-4 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand mb-2">
          Stack trace
        </h2>
        {detail.stackTrace.trim() ? (
          <pre className="overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-700 whitespace-pre-wrap">
            {detail.stackTrace}
          </pre>
        ) : (
          <p className="text-sm text-slate-500">—</p>
        )}
      </section>
    </div>
  );
}
