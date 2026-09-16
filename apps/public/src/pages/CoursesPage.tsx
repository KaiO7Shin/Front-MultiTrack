import { Link } from "react-router-dom";
import { Page } from "../components/Layout";
import { useCourses } from "../hooks/useCourses";
import { formatAmount, formatDistanceKm } from "../lib/utils";
import { courseGroupTitle } from "../services/catalogService";

export function CoursesPage() {
  const { groups, loading, error } = useCourses();

  return (
    <Page
      title="Nos challenges"
      intro="Choisissez le défi qui vous correspond."
      compact
      action={
        <Link className="button button-outline" to="/categories">
          Catégories
        </Link>
      }
    >
      {loading && <p className="section-lead">Chargement des courses…</p>}
      {error && (
        <div className="empty-results">
          <span className="empty-number">!</span>
          <h2>Impossible de charger les courses</h2>
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && groups.length === 0 && (
        <div className="empty-results">
          <span className="empty-number">0</span>
          <h2>Aucune course pour le moment</h2>
          <p>Les challenges seront bientôt disponibles.</p>
        </div>
      )}
      {!loading && !error && groups.map((group) => (
        <section className="race-group" key={group.typeCourse || "courses"}>
          <h2 className="race-group-title">{courseGroupTitle(group.typeCourse)}</h2>
          <div className="race-grid">
            {group.courses.map((course, index) => (
              <article className="race-card" key={course.id}>
                <div className="race-index">
                  <span className="race-kind">{group.typeCourse}</span>
                  <span className="race-number">0{index + 1}</span>
                </div>
                <div>
                  <h3>{course.libelle}</h3>
                  <p>{course.description}</p>
                </div>
                <div className="race-meta">
                  <strong>{formatDistanceKm(course.distance)}</strong>
                  <span>{formatAmount(course.tarif ?? 0)}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </Page>
  );
}
