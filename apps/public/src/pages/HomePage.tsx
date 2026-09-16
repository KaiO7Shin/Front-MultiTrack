import { Link } from "react-router-dom";
import { Countdown } from "../components/Countdown";
import { BeerIcon, BikeIcon, TrailIcon } from "../components/icons";
import { HIGHLIGHTS } from "../data/catalog";

const ICONS = {
  trail: <TrailIcon />,
  bike: <BikeIcon />,
  beer: <BeerIcon />,
};

export function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-visual" aria-hidden="true">
          <img className="hero-photo hero-photo-trail" src="/hero-trail.png" alt="" />
          <img className="hero-photo hero-photo-vtt" src="/hero-vtt.png" alt="" />
        </div>
        <div className="site-shell hero-inner">
          <div className="hero-content">
            <h1>L’aventure<br />vous met au défi</h1>
            <p className="hero-copy">
              Rejoignez la communauté pour une expérience inoubliable.
            </p>
            <div className="hero-actions">
              <Link className="button button-dark" to="/inscription">Je participe</Link>
              <Link className="button button-outline" to="/a-propos">En savoir plus</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="countdown-section">
        <div className="site-shell">
          <Countdown />
        </div>
      </section>
      <section className="section highlights">
        <div className="site-shell">
          <h2>Nos Challenges</h2>
          <div className="highlight-grid">
            {HIGHLIGHTS.map((highlight) => (
              <article className="highlight-card" key={highlight.title}>
                {ICONS[highlight.icon]}
                <div>
                  <h3>{highlight.title}</h3>
                  <p>{highlight.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
