import { PAGE_SIZE_OPTIONS, type PageSizeOption } from "./inscritsView";

export function InscritsPager({
  pageSize,
  page,
  pages,
  label,
  onPageSize,
  onPage,
}: {
  pageSize: PageSizeOption;
  page: number;
  pages: number;
  label: string;
  onPageSize: (size: PageSizeOption) => void;
  onPage: (page: number) => void;
}) {
  return (
    <div className="inscrits-pager">
      <label className="field inscrits-page-size">
        <span>Afficher</span>
        <select
          value={String(pageSize)}
          onChange={(event) => {
            const value = event.target.value;
            onPageSize(value === "all" ? "all" : Number(value) as PageSizeOption);
          }}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
          <option value="all">Tous</option>
        </select>
      </label>
      <p className="inscrits-range">{label}</p>
      {pageSize !== "all" && pages > 1 && (
        <div className="inscrits-pages">
          <p>Page {page} / {pages}</p>
          <button
            type="button"
            className="button button-light button-small"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            Précédent
          </button>
          <button
            type="button"
            className="button button-light button-small"
            disabled={page >= pages}
            onClick={() => onPage(page + 1)}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
