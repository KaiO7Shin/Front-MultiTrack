import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Alert, Spinner } from "@/components/ui/feedback";
import { FormField, selectClassName } from "@/components/ui/form-field";
import { fetchCoursesDetailed } from "@/services/courses";
import type { Course } from "@/lib/type";
import { DossardPreflightPanel } from "./DossardPreflightPanel";
import { DossardPdfPreview } from "./DossardPdfPreview";
import { useDossardGeneration } from "./useDossardGeneration";

const MAX_TEMPLATE_BYTES = 10 * 1024 * 1024;

export function DossardsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<number | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const gen = useDossardGeneration();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await fetchCoursesDetailed();
        if (mounted) setCourses(list);
      } catch {
        if (mounted) setCoursesError("Impossible de charger les courses.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const resetResult = gen.resetResult;
  useEffect(() => {
    resetResult();
  }, [courseId, file, resetResult]);

  const formError = gen.error || coursesError;

  function acceptFile(next: File | undefined) {
    if (!next) return;
    if (!next.name.toLowerCase().endsWith(".pdf")) {
      gen.setError("Le template doit être un fichier PDF (export Canva 1 page).");
      return;
    }
    if (next.size > MAX_TEMPLATE_BYTES) {
      gen.setError("Le template dépasse 10 Mo.");
      return;
    }
    setFile(next);
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (courseId === "") {
      gen.setError("Choisissez une course.");
      return;
    }
    await gen.verify(courseId);
  }

  async function onGenerate() {
    if (courseId === "" || !file) {
      gen.setError("Choisissez une course et un template PDF.");
      return;
    }
    if (gen.preflight && !gen.preflight.generable) {
      gen.setError("Corrigez les anomalies bloquantes avant de générer.");
      return;
    }
    await gen.generate(courseId, file);
  }

  const busy = gen.phase === "checking" || gen.phase === "generating";
  const canGenerate =
    courseId !== "" &&
    file != null &&
    gen.preflight?.generable === true &&
    !busy;

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Dossards</h1>
          <p className="page-subtitle">
            Génération locale à partir d’un template Canva PDF (1 page) et des
            participants de la course.
          </p>
        </div>
      </div>

      <form
        onSubmit={onVerify}
        className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-5"
      >
        {formError && (
          <Alert variant="error" role="alert">
            {formError}
          </Alert>
        )}

        <FormField label="Course" htmlFor="dossard-course" required>
          <select
            id="dossard-course"
            className={selectClassName}
            value={courseId === "" ? "" : String(courseId)}
            onChange={(e) =>
              setCourseId(e.target.value === "" ? "" : Number(e.target.value))
            }
            disabled={busy || courses.length === 0}
          >
            <option value="">Choisir une course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Template PDF" htmlFor="dossard-template" required>
          <div
            role="button"
            tabIndex={0}
            aria-label="Zone de dépôt du template PDF"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              acceptFile(e.dataTransfer.files?.[0]);
            }}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
              dragging
                ? "border-brand bg-brand-muted"
                : "border-slate-300 hover:border-brand/60 hover:bg-brand-muted/50"
            }`}
          >
            <input
              id="dossard-template"
              ref={fileInputRef}
              type="file"
              hidden
              accept=".pdf,application/pdf"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />
            <Upload className="h-8 w-8 mx-auto mb-3 text-slate-400" aria-hidden />
            {file ? (
              <p className="text-slate-700 font-medium">{file.name}</p>
            ) : (
              <>
                <p className="text-slate-600 font-medium">
                  Glissez le PDF Canva ici ou cliquez pour parcourir
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  PDF 1 page, sans traits de coupe — 10 Mo max.
                </p>
              </>
            )}
          </div>
        </FormField>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy || courseId === ""}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
          >
            {gen.phase === "checking" ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="text-brand" />
                Vérification…
              </span>
            ) : (
              "Vérifier"
            )}
          </button>
          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-40"
          >
            {gen.phase === "generating" ? (
              <span className="inline-flex items-center gap-2">
                <Spinner />
                Génération…
              </span>
            ) : (
              "Générer le PDF"
            )}
          </button>
        </div>
      </form>

      {gen.preflight && <DossardPreflightPanel report={gen.preflight} />}
      {gen.pdf && (
        <DossardPdfPreview blob={gen.pdf.blob} filename={gen.pdf.filename} />
      )}
    </section>
  );
}
