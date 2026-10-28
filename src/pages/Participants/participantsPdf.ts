import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addPdfFooter, PDF_FOOTER_MARGIN } from "@/lib/pdfExport";
import type { ParticipantProjection } from "@/lib/type";

const NAVY: [number, number, number] = [15, 23, 43];
const MARGIN_X = 14;
/** 2 px CSS (96 dpi) exprimés en mm, unité du PDF. */
const TWO_PX_MM = (2 * 25.4) / 96;
const CHECKING_ROW_HEIGHT = 10;
const PUBLICATION_ROW_HEIGHT = CHECKING_ROW_HEIGHT - TWO_PX_MM;

const CHECKING_HEAD = ["", "Dossard", "Nom", "Prénom", "Genre", "Course", "Signature"];
const PUBLICATION_HEAD = ["Dossard", "Nom", "Prénom", "Genre", "Course"];

type ColumnStyle = { cellWidth: number; halign: "left" | "center" | "right" };

const CHECKING_COLUMNS: Record<number, ColumnStyle> = {
  0: { cellWidth: 12, halign: "center" },
  1: { cellWidth: 18, halign: "right" },
  2: { cellWidth: 52, halign: "left" },
  3: { cellWidth: 44, halign: "left" },
  4: { cellWidth: 22, halign: "center" },
  5: { cellWidth: 51, halign: "left" },
  6: { cellWidth: 70, halign: "left" },
};

const PUBLICATION_COLUMNS: Record<number, ColumnStyle> = {
  0: { cellWidth: 18, halign: "right" },
  1: { cellWidth: 70, halign: "left" },
  2: { cellWidth: 58, halign: "left" },
  3: { cellWidth: 28, halign: "center" },
  4: { cellWidth: 95, halign: "left" },
};

export type ParticipantExportKind = "checking" | "publication";

type CourseGroup = {
  courseId: number;
  courseLabel: string;
  rows: ParticipantProjection[];
};

export async function exportParticipantsPdf(
  rows: ParticipantProjection[],
  options: { title: string; filename: string; kind: ParticipantExportKind },
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
    drawParticipantsTable(doc, group.rows, startY, options.kind);
    startY = (doc.lastAutoTable?.finalY ?? startY) + 8;
  }

  await addPdfFooter(doc);
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
    const nom = (a.nom || "").localeCompare(b.nom || "", "fr");
    if (nom !== 0) return nom;
    return (a.prenom || "").localeCompare(b.prenom || "", "fr");
  });
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
  kind: ParticipantExportKind,
) {
  const publication = kind === "publication";
  const columns = publication ? PUBLICATION_COLUMNS : CHECKING_COLUMNS;

  autoTable(doc, {
    startY,
    theme: "grid",
    head: [publication ? PUBLICATION_HEAD : CHECKING_HEAD],
    body: rows.map((participant) => participantRow(participant, publication)),
    margin: { left: MARGIN_X, right: MARGIN_X, bottom: PDF_FOOTER_MARGIN },
    styles: {
      fontSize: 9,
      cellPadding: { top: 1.6, bottom: 1.6, left: 2, right: 2 },
      minCellHeight: publication ? PUBLICATION_ROW_HEIGHT : CHECKING_ROW_HEIGHT,
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
    columnStyles: columns,
    didParseCell: (data) => {
      if (data.section !== "head") return;
      const align = columns[data.column.index]?.halign;
      if (align) data.cell.styles.halign = align;
    },
    didDrawCell: publication
      ? undefined
      : (data) => {
          if (data.column.index !== 0) return;
          if (data.section !== "head" && data.section !== "body") return;
          drawCheckbox(
            doc,
            data.cell,
            data.section === "head" ? [255, 255, 255] : NAVY,
          );
        },
  });
}

function participantRow(participant: ParticipantProjection, publication: boolean) {
  const cells = [
    participant.numDossard?.trim() || "—",
    participant.nom || "—",
    participant.prenom || "—",
    participant.genre || "—",
    participant.courseLibelle || participant.nomCourse || "—",
  ];
  if (publication) return cells;
  return ["", ...cells, ""];
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
