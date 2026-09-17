import { RULES_DOCUMENT } from "../config/site";
import { DownloadIcon, EyeIcon } from "./icons";

export function RulesDocumentLinks() {
  return (
    <div className="document-row">
      <div>
        <strong>{RULES_DOCUMENT.title}</strong>
        <span>{RULES_DOCUMENT.subtitle}</span>
      </div>
      <div className="inline-actions">
        <a
          className="button button-light"
          href={RULES_DOCUMENT.viewUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Voir <EyeIcon />
        </a>
        <a
          className="button button-light"
          href={RULES_DOCUMENT.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Télécharger <DownloadIcon />
        </a>
      </div>
    </div>
  );
}
