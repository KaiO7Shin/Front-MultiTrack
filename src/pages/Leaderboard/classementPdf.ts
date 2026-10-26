import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addPdfFooter, formatPdfNumber, PDF_FOOTER_MARGIN } from "@/lib/pdfExport";
import type { ClassementLigne } from "@/services/classement";
import {
  formatCltGenre,
  podiumTables,
  type ClassementCategorie,
} from "./classementView";

const NAVY: [number, number, number] = [15, 23, 43];
const MARGIN_X = 14;
// Pack essential : colonnes Cat. / Clt cat. masquées (scratch uniquement).
const HEAD = [
  "Rang",
  "Dossard",
  "Nom",
  "Prénom",
  "Temps",
  "Clt genre",
  "Statut",
];

const COLUMN_STYLES = {
  0: { halign: "right" as const },
  1: { halign: "center" as const },
  2: { halign: "left" as const },
  3: { halign: "left" as const },
  4: { halign: "center" as const },
  5: { halign: "center" as const },
  6: { halign: "center" as const },
};

export async function exportClassementGeneral(rows: ClassementLigne[], courseLabel: string) {
  const doc = new jsPDF("l", "mm", "a4");
  drawTitle(doc, `Classement général — ${courseLabel}`);
  drawTable(doc, rows, 22);
  await addPdfFooter(doc);
  doc.save(fileName("classement-general", courseLabel));
}

export async function exportClassementPodium(
  rows: ClassementLigne[],
  courseLabel: string,
  categories: ClassementCategorie[]
) {
  const doc = new jsPDF("l", "mm", "a4");
  drawTitle(doc, `Classement podium — ${courseLabel}`);
  let startY = 22;
  for (const table of podiumTables(rows, categories)) {
    startY = ensureSpace(doc, startY, 28);
    startY = drawHeading(doc, table.title, startY);
    if (table.rows.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Aucun coureur classé.", MARGIN_X, startY);
      startY += 8;
      continue;
    }
    drawTable(doc, table.rows, startY);
    startY = (doc.lastAutoTable?.finalY ?? startY) + 8;
  }
  await addPdfFooter(doc);
  doc.save(fileName("classement-podium", courseLabel));
}

function drawTitle(doc: jsPDF, title: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...NAVY);
  doc.text(title, MARGIN_X, 14);
}

function drawHeading(doc: jsPDF, title: string, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text(title, MARGIN_X, y);
  return y + 4;
}

function drawTable(doc: jsPDF, rows: ClassementLigne[], startY: number) {
  autoTable(doc, {
    startY,
    theme: "grid",
    head: [HEAD],
    body: rows.map(toPdfRow),
    margin: { left: MARGIN_X, right: MARGIN_X, bottom: PDF_FOOTER_MARGIN },
    styles: {
      fontSize: 9,
      cellPadding: 1.6,
      valign: "middle",
      textColor: NAVY,
      lineColor: [210, 214, 220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: NAVY,
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: COLUMN_STYLES,
    didParseCell: (data) => {
      if (data.section !== "head") return;
      const align = COLUMN_STYLES[data.column.index as keyof typeof COLUMN_STYLES]?.halign;
      if (align) data.cell.styles.halign = align;
    },
  });
}

function toPdfRow(row: ClassementLigne): string[] {
  return [
    row.rang == null ? "—" : formatPdfNumber(row.rang),
    row.dossard || "—",
    row.nom || "—",
    row.prenom || "—",
    row.temps || "—",
    pdfText(formatCltGenre(row)),
    row.statut || "—",
  ];
}

function pdfText(value: string) {
  return value.replace(/[\u00a0\u202f]/g, " ");
}

function ensureSpace(doc: jsPDF, startY: number, needed: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (startY + needed <= pageHeight - PDF_FOOTER_MARGIN) return startY;
  doc.addPage();
  return 16;
}

function fileName(prefix: string, courseLabel: string) {
  const slug = courseLabel
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${prefix}-${slug || "course"}.pdf`;
}

declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}
