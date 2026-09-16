import { Link } from "react-router-dom";
import { EligibleIcon, IneligibleIcon } from "../components/icons";
import { Page } from "../components/Layout";
import { useCatalog } from "../hooks/useCatalog";

export function CategoriesPage() {
  const { categories, races, isCategoryEligible } = useCatalog();

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
      <section className="category-block">
        <h2 className="race-group-title">Liste des catégories</h2>
        <div className="registration-table-wrap">
          <table className="registration-table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Code homme</th>
                <th>Code femme</th>
                <th>Âge min</th>
                <th>Âge max</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.name}>
                  <td><strong>{category.name}</strong></td>
                  <td>{category.codeHomme}</td>
                  <td>{category.codeFemme}</td>
                  <td>{category.ageMin}</td>
                  <td>{category.ageMax}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="category-block">
        <h2 className="race-group-title">Catégories éligibles par course</h2>
        <div className="registration-table-wrap">
          <table className="registration-table eligibility-table">
            <thead>
              <tr>
                <th>Course</th>
                {categories.map((category) => (
                  <th key={category.name}>{category.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {races.map((race) => (
                <tr key={race.name}>
                  <td>
                    <strong>{race.name}</strong>
                    <span className="eligibility-race-meta">{race.distance}</span>
                  </td>
                  {categories.map((category) => {
                    const eligible = isCategoryEligible(race.name, category.name);
                    return (
                      <td key={category.name} className="eligibility-cell">
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
        <p className="category-note">
          Vous pouvez vous inscrire même si votre catégorie n’est pas éligible.
          Vous serez alors hors catégorie : pas de classement général, ni par catégorie.
        </p>
      </section>
    </Page>
  );
}
