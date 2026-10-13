import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addPdfFooter, PDF_FOOTER_MARGIN } from "@/lib/pdfExport";
import type { ParticipantProjection } from "@/lib/type";

const NAVY: [number, number, number] = [15, 23, 43];
const CHECKBOX_COL = 0;
const SIGNATURE_COL = 7;
const MARGIN_X = 14;
const HEAD = ["", "Dossard", "Nom", "Prénom", "Course", "Genre", "Catégorie", "Signature"];

type CourseGroup = {
  courseId: number;
  courseLabel: string;
  rows: ParticipantProjection[];
};

export function exportParticipantsPdf(
  rows: ParticipantProjection[],
  options: { title: string; filename: string },
) {
  if (rows.length === 0) return;

  const groups = groupByCourse(rows);
  const doc = new jsPDF("l", "mm", "a4");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...NAVY);
  doc.text(options.title, MARGIN_X, 14);

  let startY = 20;

  for (const group of groups) {
    startY = ensureSpaceForSection(doc, startY, 24);
    startY = drawCourseHeading(doc, group.courseLabel, startY);
    drawParticipantsTable(doc, group.rows, startY);
    startY = (doc.lastAutoTable?.finalY ?? startY) + 8;
  }

  addPdfFooter(doc);
  doc.save(options.filename);
}

function groupByCourse(rows: ParticipantProjection[]): CourseGroup[] {
  const byCourse = new Map<number, CourseGroup>();

  for (const row of rows) {
    const courseId = row.courseId ?? Number.MAX_SAFE_INTEGER;
    const courseLabel = row.courseLibelle || row.nomCourse || "—";
    const existing = byCourse.get(courseId);
    if (existing) {
      existing.rows.push(row);
    } else {
      byCourse.set(courseId, { courseId, courseLabel, rows: [row] });
    }
  }

  return [...byCourse.values()]
    .sort((a, b) => a.courseId - b.courseId)
    .map((group) => ({
      ...group,
      rows: sortParticipantsInGroup(group.rows),
    }));
}

function sortParticipantsInGroup(rows: ParticipantProjection[]) {
  return [...rows].sort((a, b) => {
    const dossardA = parseDossard(a.numDossard);
    const dossardB = parseDossard(b.numDossard);
    if (dossardA != null && dossardB != null && dossardA !== dossardB) {
      return dossardA - dossardB;
    }
    const nom = a.nom.localeCompare(b.nom, "fr");
    if (nom !== 0) return nom;
    return a.prenom.localeCompare(b.prenom, "fr");
  });
}

function parseDossard(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
}

function ensureSpaceForSection(doc: jsPDF, startY: number, neededHeight: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (startY + neededHeight <= pageHeight - PDF_FOOTER_MARGIN) return startY;
  doc.addPage();
  return 16;
}

function drawCourseHeading(doc: jsPDF, label: string, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text(label, MARGIN_X, y);
  return y + 5;
}

function drawParticipantsTable(
  doc: jsPDF,
  rows: ParticipantProjection[],
  startY: number,
) {
  autoTable(doc, {
    startY,
    theme: "grid",
    head: [HEAD],
    body: rows.map((p) => [
      "",
      p.numDossard?.trim() || "—",
      p.nom || "—",
      p.prenom || "—",
      p.courseLibelle || p.nomCourse || "—",
      p.genre || "—",
      p.aliasCategorie || "—",
      "",
    ]),
    margin: { left: MARGIN_X, right: MARGIN_X, bottom: PDF_FOOTER_MARGIN },
    styles: {
      fontSize: 9,
      cellPadding: { top: 1.6, bottom: 1.6, left: 2, right: 2 },
      minCellHeight: 10,
      valign: "middle",
      overflow: "linebreak",
      textColor: NAVY,
      lineColor: [210, 214, 220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: NAVY,
      textColor: 255,
      fontStyle: "bold",
      minCellHeight: 7,
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 18, halign: "right" },
      2: { cellWidth: 46, halign: "left" },
      3: { cellWidth: 34, halign: "left" },
      4: { cellWidth: 50, halign: "left" },
      5: { cellWidth: 22, halign: "center" },
      6: { cellWidth: 20, halign: "center" },
      [SIGNATURE_COL]: { cellWidth: 64, halign: "left" },
    },
    didParseCell: (data) => {
      if (data.section === "head" && data.column.index === 1) {
        data.cell.styles.halign = "right";
      }
      if (data.section === "head" && (data.column.index === 5 || data.column.index === 6)) {
        data.cell.styles.halign = "center";
      }
    },
    didDrawCell: (data) => {
      if (data.column.index !== CHECKBOX_COL) return;
      if (data.section !== "head" && data.section !== "body") return;
      drawCheckbox(
        doc,
        data.cell,
        data.section === "head" ? [255, 255, 255] : NAVY,
      );
    },
  });
}

function drawCheckbox(
  doc: jsPDF,
  cell: { x: number; y: number; width: number; height: number },
  stroke: [number, number, number],
) {
  const size = 3.2;
  const x = cell.x + (cell.width - size) / 2;
  const y = cell.y + (cell.height - size) / 2;
  doc.setDrawColor(...stroke);
  doc.setLineWidth(0.4);
  doc.rect(x, y, size, size);
}

declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}
