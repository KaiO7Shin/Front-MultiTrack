import { Page } from "../components/Layout";
import {
  PRIVACY_POLICY,
  TERMS_OF_USE,
  type LegalSection,
} from "../data/legalContent";

function LegalDocument({
  title,
  intro,
  updatedAt,
  sections,
}: {
  title: string;
  intro: string;
  updatedAt: string;
  sections: readonly LegalSection[];
}) {
  return (
    <Page title={title} intro={intro} compact>
      <p className="legal-updated">Dernière mise à jour : {updatedAt}</p>
      <div className="legal-document">
        {sections.map((section) => (
          <section key={section.title} className="legal-section">
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph, index) => (
              <p key={`${section.title}-${index}`}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </Page>
  );
}

export function PrivacyPolicyPage() {
  return (
    <LegalDocument
      title={PRIVACY_POLICY.title}
      intro={PRIVACY_POLICY.intro}
      updatedAt={PRIVACY_POLICY.updatedAt}
      sections={PRIVACY_POLICY.sections}
    />
  );
}

export function TermsOfUsePage() {
  return (
    <LegalDocument
      title={TERMS_OF_USE.title}
      intro={TERMS_OF_USE.intro}
      updatedAt={TERMS_OF_USE.updatedAt}
      sections={TERMS_OF_USE.sections}
    />
  );
}
