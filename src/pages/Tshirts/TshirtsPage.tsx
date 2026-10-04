import { useEffect, useMemo, useState } from "react";
import { Shirt } from "lucide-react";
import { fetchCoursesDetailed } from "@/services/courses";
import { fetchAllParticipants } from "@/services/participants";
import { TSHIRT_SIZES } from "@/lib/participantIdentity";
import { Alert, EmptyState, Spinner } from "@/components/ui/feedback";
import { FormField, selectClassName } from "@/components/ui/form-field";
import {
  buildTshirtMatrix,
  filterTshirtMatrix,
  type TshirtMatrixCourse,
  type TshirtMatrixParticipant,
} from "./tshirtMatrix";
import { exportTshirtMatrixPdf } from "./tshirtPdf";

export function TshirtsPage() {
  const [courses, setCourses] = useState<TshirtMatrixCourse[]>([]);
  const [participants, setParticipants] = useState<TshirtMatrixParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCourseId, setSelectedCourseId] = useState<number | "all">("all");
  const [selectedSize, setSelectedSize] = useState<string | "all">("all");

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const courseList = await fetchCoursesDetailed();
        if (!mounted) return;

        const mappedCourses = courseList.map((c) => ({
          id: c.id,
          name: c.name,
        }));
        setCourses(mappedCourses);

        const participantRows = await fetchAllParticipants();
        if (!mounted) return;

        setParticipants(
          participantRows.map((p) => ({
            courseId: p.courseId,
            tailleTShirt: p.tailleTShirt,
            tailleTShirtBinome: p.tailleTShirtBinome,
          }))
        );
      } catch {
        if (!mounted) return;
        setCourses([]);
        setParticipants([]);
        setError("Impossible de charger les quantités de T-shirts.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const matrix = useMemo(
    () => buildTshirtMatrix(courses, participants),
    [courses, participants]
  );

  const visible = useMemo(
    () => filterTshirtMatrix(matrix, selectedCourseId, selectedSize),
    [matrix, selectedCourseId, selectedSize]
  );

  const hasSizedParticipants = matrix.grandTotal > 0;

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">T-shirts</h1>
          <p className="page-subtitle">
            Quantités nécessaires par taille et par course (taille
            participant + taille parent/binôme si renseignée)
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={() => exportTshirtMatrixPdf(visible)}
            disabled={loading || visible.courses.length === 0}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
          >
            <img src="/pdf.svg" alt="" className="h-4 w-4" aria-hidden />
            Exporter
          </button>
        </div>
      </div>

      {error && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}

      <div className="filter-panel">
        <div className="filter-fields">
          <FormField label="Course" htmlFor="tshirt-filter-course">
            <select
              id="tshirt-filter-course"
              className={selectClassName}
              value={String(selectedCourseId)}
              onChange={(e) =>
                setSelectedCourseId(
                  e.target.value === "all" ? "all" : Number(e.target.value)
                )
              }
              disabled={loading || courses.length === 0}
            >
              <option value="all">Toutes les courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Taille" htmlFor="tshirt-filter-size">
            <select
              id="tshirt-filter-size"
              className={selectClassName}
              value={selectedSize}
              onChange={(e) =>
                setSelectedSize(
                  e.target.value === "all" ? "all" : e.target.value
                )
              }
              disabled={loading || courses.length === 0}
            >
              <option value="all">Toutes les tailles</option>
              {TSHIRT_SIZES.map((size) => (
                <option key={size.id} value={size.alias}>
                  {size.alias}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {!loading && courses.length > 0 && (
          <p className="text-xs text-slate-500">
            {visible.grandTotal} T-shirt{visible.grandTotal > 1 ? "s" : ""} au
            total
            {!hasSizedParticipants &&
              " — aucun participant avec taille renseignée"}
          </p>
        )}
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-slate-500">
            <Spinner className="text-brand" />
            <span className="text-sm">Chargement des T-shirts…</span>
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            icon={<Shirt className="h-10 w-10" />}
            title="Aucune course"
            description="Ajoutez des courses pour afficher le tableau des T-shirts."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-2 py-2 text-left w-[28%] sticky left-0 z-10 bg-slate-50">
                    Course
                  </th>
                  {visible.sizes.map((size) => (
                    <th
                      key={size}
                      className="px-1 py-2 text-center w-[9%] tabular-nums"
                    >
                      {size}
                    </th>
                  ))}
                  <th className="px-1 py-2 text-center font-semibold w-[10%]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.courses.map((course) => (
                  <tr key={course.id} className="hover:bg-[#8c9962]/5">
                    <td
                      className="px-2 py-2 font-medium sticky left-0 z-10 bg-white truncate"
                      title={course.name}
                    >
                      {course.name}
                    </td>
                    {visible.sizes.map((size) => (
                      <td
                        key={size}
                        className="px-1 py-2 text-center tabular-nums text-sm"
                      >
                        {visible.counts[size]?.[course.id] ?? 0}
                      </td>
                    ))}
                    <td className="px-1 py-2 text-center font-semibold tabular-nums">
                      {visible.columnTotals[course.id] ?? 0}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-2 py-2 sticky left-0 z-10 bg-slate-50">
                    Total
                  </td>
                  {visible.sizes.map((size) => (
                    <td
                      key={size}
                      className="px-1 py-2 text-center tabular-nums"
                    >
                      {visible.rowTotals[size] ?? 0}
                    </td>
                  ))}
                  <td className="px-1 py-2 text-center tabular-nums">
                    {visible.grandTotal}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
