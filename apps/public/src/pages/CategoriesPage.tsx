import { Link } from "react-router-dom";
import { EligibleIcon, IneligibleIcon } from "../components/icons";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Page } from "../components/Layout";
import { useCategories } from "../hooks/useCategories";
import { useEligibleCategories } from "../hooks/useEligibleCategories";
import { formatAgeBound } from "../lib/utils";
import { isCategoryEligibleForCourse } from "../services/catalogService";

export function CategoriesPage() {
  const { categories, loading, error } = useCategories();
  const {
    courses: eligibleCourses,
    loading: eligibilityLoading,
    error: eligibilityError,
  } = useEligibleCategories();
  const pageLoading = loading || eligibilityLoading;

  return (
    <Page
      title="Catégories"
      intro=""
      compact
      action={
        <Link className="button button-outline" to="/courses">
          Retour aux courses
        </Link>
      }
    >
      <LoadingOverlay visible={pageLoading} />
      <section className="category-block">
        <h2 className="race-group-title">Liste des catégories</h2>
        {error && (
          <div className="empty-results">
            <span className="empty-number">!</span>
            <h2>Impossible de charger les catégories</h2>
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && (
          <div className="registration-table-wrap">
            <table className="registration-table categories-table">
              <thead>
                <tr>
                  <th className="col-text">Catégorie</th>
                  <th className="col-code">Alias</th>
                  <th className="col-num">Âge min</th>
                  <th className="col-num">Âge max</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-table">
                      Aucune catégorie pour le moment.
                    </td>
                  </tr>
                ) : categories.map((category) => (
                  <tr key={category.id}>
                    <td className="col-text"><strong>{category.libelle}</strong></td>
                    <td className="col-code">{category.alias}</td>
                    <td className="col-num">{formatAgeBound(category.age_min)}</td>
                    <td className="col-num">{formatAgeBound(category.age_max, category.age_min == null ? "–" : "+")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="category-block">
        <h2 className="race-group-title">Catégories éligibles par course</h2>
        {eligibilityError && (
          <div className="empty-results">
            <span className="empty-number">!</span>
            <h2>Impossible de charger les catégories éligibles</h2>
            <p>{eligibilityError}</p>
          </div>
        )}
        {!eligibilityLoading && !eligibilityError && (
          <div className="registration-table-wrap">
            <table className="registration-table eligibility-table">
              <thead>
                <tr>
                  <th className="col-text">Course</th>
                  {categories.map((category) => (
                    <th className="col-icon" key={category.id}>{category.libelle}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eligibleCourses.length === 0 ? (
                  <tr>
                    <td colSpan={Math.max(categories.length + 1, 1)} className="empty-table">
                      Aucune course pour le moment.
                    </td>
                  </tr>
                ) : eligibleCourses.map((course) => (
                  <tr key={`${course.nom_course}-${course.libelle_course}`}>
                    <td className="col-text">
                      <strong>{course.libelle_course}</strong>
                      <span className="eligibility-race-meta">{course.nom_course}</span>
                    </td>
                    {categories.map((category) => {
                      const eligible = isCategoryEligibleForCourse(course, category.libelle);
                      return (
                        <td key={category.id} className="eligibility-cell col-icon">
                          {eligible ? <EligibleIcon /> : <IneligibleIcon />}
                          <span className="sr-only">{eligible ? "Éligible" : "Non éligible"}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="category-note">
          <span className="category-note-label">Remarque</span> : Si votre catégorie n’est pas éligible à la course choisie, votre inscription
          sera acceptée, mais vous serez classé <strong>Hors catégorie</strong>.
          Vous serez reconnu comme finisher, sans classement général ni classement par catégorie.
        </p>
      </section>
    </Page>
  );
}
