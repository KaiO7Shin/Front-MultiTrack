import { Link } from "react-router-dom";
import { Page } from "../components/Layout";
import { useCatalog } from "../hooks/useCatalog";
import { formatAmount } from "../lib/utils";

export function CoursesPage() {
  const { courseGroups, findRaceByName } = useCatalog();

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
      {courseGroups.map((group) => (
        <section className="race-group" key={group.title}>
          <h2 className="race-group-title">{group.title}</h2>
          <div className="race-grid">
            {group.races.map((name, index) => {
              const race = findRaceByName(name);
              if (!race) return null;
              return (
                <article className="race-card" key={`${group.title}-${race.name}`}>
                  <div className="race-index">
                    <span className="race-kind">{group.kind}</span>
                    <span className="race-number">0{index + 1}</span>
                  </div>
                  <div>
                    <h3>{race.name}</h3>
                    <p>{race.description}</p>
                  </div>
                  <div className="race-meta">
                    <strong>{race.distance}</strong>
                    <span>{formatAmount(race.price)}{race.duo ? " / duo" : ""}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </Page>
  );
}
