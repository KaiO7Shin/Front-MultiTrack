import { Link } from "react-router-dom";

export const CoursesList = () => {
    return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Courses</h1>
        <button className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm">+ Nouvelle course</button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="text-slate-500 text-sm">Aucune course pour l’instant.</div>
        <div className="mt-3">
          <Link to="/courses/1" className="underline text-slate-700">Exemple détail (mock)</Link>
        </div>
      </div>
    </section>
  );
}