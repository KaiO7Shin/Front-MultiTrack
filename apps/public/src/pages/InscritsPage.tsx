import { toErrorMessage } from "@multitrack/api-client";
import { useEffect, useMemo, useState } from "react";
import { Field } from "../components/form";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Page } from "../components/Layout";
import { useCourses } from "../hooks/useCourses";
import { usePublicFlags } from "../hooks/usePublicFlags";
import { loadInscrits, type PublicInscrit } from "../services/publicSite";
import { InscritsPager } from "./InscritsPager";
import { InscritsTable } from "./InscritsTable";
import { filterInscrits, pageOf, type PageSizeOption } from "./inscritsView";

export function InscritsPage() {
  const { flags, error: flagsError, ready } = usePublicFlags();
  const { courses, loading: coursesLoading, error: coursesError } = useCourses();
  const [courseId, setCourseId] = useState("");
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState<PageSizeOption>(20);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PublicInscrit[] | null>(null);
  const [listError, setListError] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const published = flags?.pubInscrits === true;

  useEffect(() => {
    if (!published || !courseId) {
      setRows(null);
      setListError("");
      setListLoading(false);
      return;
    }
    let active = true;
    setListLoading(true);
    setListError("");
    loadInscrits(Number(courseId))
      .then((data) => {
        if (active) setRows(data);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setRows(null);
        setListError(toErrorMessage(reason));
      })
      .finally(() => {
        if (active) setListLoading(false);
      });
    return () => {
      active = false;
    };
  }, [published, courseId]);

  useEffect(() => {
    setPage(1);
  }, [courseId, query, pageSize]);

  const filtered = useMemo(() => filterInscrits(rows ?? [], query), [rows, query]);
  const current = pageOf(filtered, page, pageSize);
  const emptyLabel = query.trim()
    ? "Aucun inscrit ne correspond à cette recherche."
    : "Aucun inscrit pour cette course.";

  return (
    <Page
      title="Inscrits"
      intro="Retrouvez les participants d’une course."
      compact
    >
      <LoadingOverlay visible={!ready || (published && coursesLoading) || listLoading} />
      {flagsError && <p className="form-error" role="alert">{flagsError}</p>}
      {ready && !published && !flagsError && (
        <p className="form-error" role="status">Liste non publiée.</p>
      )}
      {published && (
        <>
          {coursesError && <p className="form-error" role="alert">{coursesError}</p>}
          <div className="inscrits-toolbar">
            <Field label="Course">
              <select
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
              >
                <option value="">Choisir une course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.libelle}</option>
                ))}
              </select>
            </Field>
            <Field label="Recherche">
              <input
                value={query}
                placeholder="Nom, prénom ou dossard"
                disabled={!courseId}
                onChange={(event) => setQuery(event.target.value)}
              />
            </Field>
          </div>
          {!courseId && <p className="section-lead">Choisissez une course pour afficher les inscrits.</p>}
          {courseId && listError && <p className="form-error" role="alert">{listError}</p>}
          {courseId && rows && !listError && (
            <>
              <InscritsTable rows={current.slice} emptyLabel={emptyLabel} />
              <InscritsPager
                pageSize={pageSize}
                page={current.page}
                pages={current.pages}
                label={current.label}
                onPageSize={setPageSize}
                onPage={setPage}
              />
            </>
          )}
        </>
      )}
    </Page>
  );
}
