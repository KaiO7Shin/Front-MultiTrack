import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Alert } from "@/components/ui/feedback";
import { FormField, inputClassName, selectClassName } from "@/components/ui/form-field";
import type { CompteUtilisateurRow } from "@/lib/type";
import { fetchComptesUtilisateur, updateCompteUtilisateur } from "@/services/comptes";
import { CompteEditModal } from "./CompteEditModal";
import { ComptesTable } from "./ComptesTable";
import {
  COMPTE_PAGE_SIZE_OPTIONS,
  compteRangeLabel,
  filterComptesByQuery,
  paginateComptes,
  type ComptePageSize,
} from "./compteListUtils";

export function ComptesPage() {
  const [rows, setRows] = useState<CompteUtilisateurRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState<ComptePageSize>(20);
  const [page, setPage] = useState(1);

  const [editTarget, setEditTarget] = useState<CompteUtilisateurRow | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      setRows(await fetchComptesUtilisateur());
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setRows([]);
      setListError(
        e.response?.data?.message || e.message || "Impossible de charger les comptes."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(
    () => filterComptesByQuery(rows, query),
    [rows, query]
  );

  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  const { paged, totalPages, currentPage } = useMemo(
    () => paginateComptes(filtered, pageSize, page),
    [filtered, pageSize, page]
  );

  async function handleEditSubmit(payload: {
    username: string;
    email: string;
    phone: string;
    password?: string;
  }) {
    if (!editTarget) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await updateCompteUtilisateur(editTarget.id, payload);
      await reload();
      setEditTarget(null);
      setActionSuccess(res.message || "Compte mis à jour avec succès");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setEditError(
        e.response?.data?.message || e.message || "Impossible de mettre à jour le compte."
      );
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Comptes utilisateurs</h1>
          <p className="page-subtitle">
            Suivi des comptes front-office (inscription en ligne). Modification uniquement.
          </p>
        </div>
      </div>

      {listError && (
        <Alert variant="error" role="alert">
          {listError}
        </Alert>
      )}
      {actionSuccess && (
        <Alert variant="success" role="status">
          {actionSuccess}
        </Alert>
      )}

      <div className="filter-panel space-y-3">
        <div className="filter-fields">
          <FormField label="Recherche" htmlFor="comptes-search" className="flex-1 min-w-[200px]">
            <input
              id="comptes-search"
              type="search"
              className={inputClassName}
              placeholder="Id, nom d'utilisateur, e-mail, téléphone…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActionSuccess(null);
              }}
            />
          </FormField>

          <FormField
            label="Par page"
            htmlFor="comptes-page-size"
            className="w-full sm:w-40 lg:shrink-0"
          >
            <select
              id="comptes-page-size"
              className={selectClassName}
              value={String(pageSize)}
              onChange={(e) => {
                const value = e.target.value;
                setPageSize(value === "all" ? "all" : (Number(value) as ComptePageSize));
              }}
            >
              {COMPTE_PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
              <option value="all">Tous</option>
            </select>
          </FormField>
        </div>
        {!loading && (
          <p className="text-xs text-slate-500">
            {compteRangeLabel(filtered.length, pageSize, currentPage)}
          </p>
        )}
      </div>

      <ComptesTable
        loading={loading}
        rows={paged}
        onEdit={(row) => {
          setActionSuccess(null);
          setEditError(null);
          setEditTarget(row);
        }}
      />

      {pageSize !== "all" && totalPages > 1 && !loading && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border bg-white px-3 py-2.5">
          <p className="text-xs text-slate-500">
            Page {currentPage} / {totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-40"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </button>
            <button
              type="button"
              className="btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-40"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Page suivante"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <CompteEditModal
        open={editTarget != null}
        compte={editTarget}
        saving={editSaving}
        error={editError}
        onClose={() => {
          if (editSaving) return;
          setEditTarget(null);
          setEditError(null);
        }}
        onSubmit={(payload) => void handleEditSubmit(payload)}
      />
    </section>
  );
}
