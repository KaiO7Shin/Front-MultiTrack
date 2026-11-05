import type { CourseListItem } from "@multitrack/types";
import { Field } from "../../components/form";
import { formatAmount } from "../../lib/utils";

export function RegistrationCourseField({
  courseId,
  courses,
  fallbackId,
  fallbackLabel,
  loading,
  disabled,
  onChange,
}: {
  courseId: number;
  courses: CourseListItem[];
  fallbackId: number;
  fallbackLabel: string;
  loading: boolean;
  disabled: boolean;
  onChange: (courseId: number, libelle: string) => void;
}) {
  const listed = courses.some((course) => course.id === fallbackId);
  const selected = courses.find((course) => course.id === courseId);

  return (
    <div className="race-block">
      <Field label="Course choisie *">
        <select
          name="race"
          value={courseId ? String(courseId) : ""}
          onChange={(event) => {
            const nextId = Number(event.target.value);
            const course = courses.find((item) => item.id === nextId);
            onChange(nextId, course?.libelle ?? (nextId === fallbackId ? fallbackLabel : ""));
          }}
          required
          disabled={disabled || loading}
        >
          <option value="" disabled>
            {loading ? "Chargement des courses…" : "Choisir une course"}
          </option>
          {!listed && fallbackId > 0 && (
            <option value={fallbackId}>{fallbackLabel}</option>
          )}
          {courses.map((course) => (
            <option key={course.id} value={course.id}>{course.libelle}</option>
          ))}
        </select>
      </Field>
      {selected?.tarif != null && (
        <small className="file-hint">{formatAmount(selected.tarif)}</small>
      )}
    </div>
  );
}
