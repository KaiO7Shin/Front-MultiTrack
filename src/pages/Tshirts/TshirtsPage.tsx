import { useEffect, useMemo, useState } from "react";
import { Shirt } from "lucide-react";
import { fetchCoursesDetailed } from "@/services/courses";
import { fetchParticipantsByCourse } from "@/services/participants";
import { TSHIRT_SIZES } from "@/lib/participantIdentity";
import { Alert, EmptyState, Spinner } from "@/components/ui/feedback";
import { FormField, selectClassName } from "@/components/ui/form-field";
import {
  buildTshirtMatrix,
  filterTshirtMatrix,
  type TshirtMatrixCourse,
  type TshirtMatrixParticipant,
} from "./tshirtMatrix";

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

        const rows = await Promise.all(
          mappedCourses.map((course) => fetchParticipantsByCourse(course.id))
        );
        if (!mounted) return;

        setParticipants(
          rows.flat().map((p) => ({
            courseId: p.courseId,
            tailleTShirt: p.tailleTShirt,
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
            Quantités nécessaires par taille et par course
          </p>
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
          <div className="table-scroll table-scroll-wide">
            <table>
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left sticky left-0 z-10 bg-slate-50">
                    Taille
                  </th>
                  {visible.courses.map((course) => (
                    <th
                      key={course.id}
                      className="px-4 py-2 text-right whitespace-nowrap"
                      title={course.name}
                    >
                      {course.name}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.sizes.map((size) => (
                  <tr key={size} className="hover:bg-[#8c9962]/5">
                    <td className="px-4 py-2 font-medium sticky left-0 z-10 bg-white">
                      {size}
                    </td>
                    {visible.courses.map((course) => (
                      <td
                        key={course.id}
                        className="px-4 py-2 text-right tabular-nums"
                      >
                        {visible.counts[size]?.[course.id] ?? 0}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right font-semibold tabular-nums">
                      {visible.rowTotals[size] ?? 0}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-4 py-2 sticky left-0 z-10 bg-slate-50">
                    Total
                  </td>
                  {visible.courses.map((course) => (
                    <td
                      key={course.id}
                      className="px-4 py-2 text-right tabular-nums"
                    >
                      {visible.columnTotals[course.id] ?? 0}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right tabular-nums">
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
