import { Page } from "../components/Layout";
import { RulesDocumentLinks } from "../components/RulesDocumentLinks";
import { ORGANIZER_CONTACTS } from "../config/site";
import { EVENT_INFO } from "../data/catalog";

export function AboutPage() {
  return (
    <Page
      title="À propos"
      intro="L’aventure TBB, propulsée par MultiTrack."
      compact
      meta={
        <dl className="event-facts">
          <div>
            <dt>Date</dt>
            <dd>{EVENT_INFO.dateLabel}</dd>
          </div>
          <div>
            <dt>Lieu</dt>
            <dd>{EVENT_INFO.location}</dd>
          </div>
        </dl>
      }
    >
      <div className="content-columns">
        <h2>Plus qu’un événement,<br />une aventure à partager.</h2>
        <div>
          <p>
            TBB — Trail Bike Beer — est un événement sportif conçu pour les
            amateurs d’aventure et toutes celles et ceux qui souhaitent partir
            à la conquête d’un défi, en trail ou en VTT.
          </p>
          <p>
            Aujourd’hui des petits, demain les grands : chaque challenge est
            pensé pour accompagner la progression, du premier dossard au défi
            suprême.
          </p>
          <p>
            En coulisses, MultiTrack simplifie la gestion des événements de
            sport d’endurance : inscriptions, participants, paiements et suivi
            réunis dans un même outil, pour que les organisateurs se concentrent
            sur l’essentiel.
          </p>
        </div>
      </div>
      <section className="about-rules" aria-labelledby="about-rules-title">
        <p className="eyebrow">RÈGLEMENT</p>
        <h2 id="about-rules-title">Consulter le règlement</h2>
        <p>
          Le règlement officiel de TBB — Trail Bike Beer est disponible en
          lecture ou en téléchargement.
        </p>
        <RulesDocumentLinks />
      </section>
    </Page>
  );
}

export function ContactPage() {
  return (
    <Page title="Contact" intro="Une question sur votre participation ?">
      <div className="contact-block">
        <div>
          <span>E-mail</span>
          <a href={`mailto:${ORGANIZER_CONTACTS.email}`}>{ORGANIZER_CONTACTS.email}</a>
        </div>
        <div>
          <span>Téléphone</span>
          <a href={`tel:${ORGANIZER_CONTACTS.phoneTel}`}>{ORGANIZER_CONTACTS.phone}</a>
        </div>
      </div>
    </Page>
  );
}
