import type jsPDF from "jspdf";

/** Pied de page obligatoire de tout export PDF (chaque page). */
export const PDF_FOOTER = "© 2026 MultiTrack - Powered by VAHIRA";

/** Marge basse à réserver pour le pied de page (mm). */
export const PDF_FOOTER_MARGIN = 14;

const LOGO_SIZE_MM = 13;
const LOGO_TOP_MM = 5;
const LOGO_RIGHT_MM = 8;

let logoPng: Promise<string | null> | null = null;

export async function addPdfFooter(doc: jsPDF) {
  const logo = await loadLogoPng();
  const pageCount = doc.getNumberOfPages();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    if (logo) {
      doc.addImage(
        logo,
        "PNG",
        pageW - LOGO_RIGHT_MM - LOGO_SIZE_MM,
        LOGO_TOP_MM,
        LOGO_SIZE_MM,
        LOGO_SIZE_MM,
      );
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(PDF_FOOTER, pageW / 2, pageH - 8, { align: "center" });
  }
}

function loadLogoPng(): Promise<string | null> {
  if (!logoPng) {
    logoPng = rasterizeLogo().catch(() => null);
  }
  return logoPng;
}

function rasterizeLogo(): Promise<string> {
  const url = `${import.meta.env.BASE_URL}multitrack.svg`;
  return fetch(url).then(async (response) => {
    if (!response.ok) throw new Error("Logo introuvable");
    const svg = await response.text();
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    try {
      const image = await loadImage(objectUrl);
      const size = 420;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas indisponible");
      context.drawImage(image, 0, 0, size, size);
      return canvas.toDataURL("image/png");
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Logo illisible"));
    image.src = src;
  });
}

/** Helvetica ne rend pas l’espace insécable fin (`U+202F`) de `fr-FR` — il apparaît comme « / ». */
export function formatPdfNumber(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("fr-FR", options)
    .format(value)
    .replace(/[\u00a0\u202f]/g, " ");
}
