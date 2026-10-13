import type jsPDF from "jspdf";

/** Pied de page obligatoire de tout export PDF (chaque page). */
export const PDF_FOOTER = "© 2026 MultiTrack - Powered by VAHIRA";

/** Marge basse à réserver pour le pied de page (mm). */
export const PDF_FOOTER_MARGIN = 14;

export function addPdfFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(PDF_FOOTER, pageW / 2, pageH - 8, { align: "center" });
  }
}

/** Helvetica ne rend pas l’espace insécable fin (`U+202F`) de `fr-FR` — il apparaît comme « / ». */
export function formatPdfNumber(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("fr-FR", options)
    .format(value)
    .replace(/[\u00a0\u202f]/g, " ");
}
