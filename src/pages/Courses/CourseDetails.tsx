import { useParams } from "react-router-dom";

export const CourseDetails = () => {

    const { id } = useParams();
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Course #{id}</h1>
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="flex flex-wrap gap-2">
          <button className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm">Lancer la course</button>
          <button className="rounded-xl border px-4 py-2 text-sm">Terminer</button>
        </div>
        <div className="mt-4 text-sm text-slate-600">Infos course, checkpoints, participants…</div>
      </div>
    </section>
  );
}