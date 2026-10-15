import jsPDF from "jspdf";
import autoTable, { type CellHookData, type Styles } from "jspdf-autotable";
import { INSCRIPTION_STATUS } from "@multitrack/types";
import { EVENT_INFO } from "../data/catalog";
import type { Registration } from "../types";
import { addPdfFooter, formatPdfNumber, PDF_FOOTER_MARGIN } from "./pdfExport";
import { isMinor } from "./participant";

const NAVY: [number, number, number] = [15, 23, 43];
const OLIVE: [number, number, number] = [140, 153, 98];
const MARGIN = 14;
const GAP = 6;

type KvRow = { label: string; value: string; align: Styles["halign"] };

export function exportRegistrationPdf(registration: Registration) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageW = doc.internal.pageSize.getWidth();
  const usable = pageW - MARGIN * 2;
  const runner = registration.runner;
  const validated = registration.status === INSCRIPTION_STATUS.VALIDATED;

  drawHeader(doc, registration, pageW);

  const participantHead = [
    "Nom",
    "Prénom",
    "Date de naissance",
    "Genre",
    "Taille t-shirt",
    "Catégorie",
    ...(validated ? ["N° dossard"] : []),
  ];
  const participantBody = [
    [
      textOrDash(runner.lastName),
      textOrDash(runner.firstName),
      formatBirthDate(runner.birthDate),
      textOrDash(runner.gender),
      textOrDash(runner.tshirtSize),
      textOrDash(runner.category),
      ...(validated ? [textOrDash(registration.numDossard)] : []),
    ],
  ];

  const participantCols: Record<number, Partial<Styles>> = {
    0: { halign: "left" },
    1: { halign: "left" },
    2: { halign: "center" },
    3: { halign: "center" },
    4: { halign: "center" },
    5: { halign: "center" },
  };
  if (validated) {
    participantCols[6] = { halign: "right" };
  }

  let y = 38;
  y = sectionTitle(doc, "Participant", y);

  autoTable(doc, {
    startY: y,
    theme: "grid",
    pageBreak: "avoid",
    head: [participantHead],
    body: participantBody,
    margin: { left: MARGIN, right: MARGIN, bottom: PDF_FOOTER_MARGIN },
    tableWidth: usable,
    styles: compactStyles(),
    headStyles: headStyles(),
    bodyStyles: { minCellHeight: 10 },
    columnStyles: participantCols,
    didParseCell: (data) => applyHeadAlign(data, participantCols),
  });

  y = lastTableY(doc, y) + 10;

  const half = (usable - GAP) / 2;
  const leftRight = pageW - MARGIN - half;
  const docRows = documentRows(registration);
  const contactRows: KvRow[] = [
    { label: "Nom", value: textOrDash(runner.emergencyContactName), align: "left" },
    { label: "Contact", value: textOrDash(runner.emergencyContactPhone), align: "left" },
  ];

  const tablesTop = sectionTitle(doc, "Documents et frais", y);
  sectionTitle(doc, "Contact d'urgence", y, leftRight);

  kvTable(doc, docRows, tablesTop, MARGIN, half, half * 0.42);
  kvTable(doc, contactRows, tablesTop, leftRight, half, half * 0.4);

  addPdfFooter(doc);
  doc.save(`inscription-${slugPart(runner.lastName)}-${slugPart(runner.firstName)}.pdf`);
}

function drawHeader(doc: jsPDF, registration: Registration, pageW: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...OLIVE);
  doc.text(EVENT_INFO.name, MARGIN, 14);

  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  doc.text("Résumé de l'inscription", MARGIN, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(
    `${textOrDash(registration.runner.race)}  ·  Inscrit le ${registration.createdAt}`,
    MARGIN,
    28,
  );

  const status = registration.status || "—";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text(status, pageW - MARGIN, 22, { align: "right" });
}

function documentRows(registration: Registration): KvRow[] {
  const { runner } = registration;
  const rows: KvRow[] = [
    { label: "Pièce d'identité", value: providedLabel(runner.identityDocument, registration.documentStates?.identite), align: "center" },
    { label: "Certificat médical", value: providedLabel(runner.medicalCertificate, registration.documentStates?.certificat), align: "center" },
  ];
  if (isMinor(runner.birthDate)) {
    rows.push({
      label: "Autorisation parentale",
      value: providedLabel(runner.parentalAuthorization, registration.documentStates?.autorisation),
      align: "center",
    });
  }
  rows.push(
    { label: "Moyen de paiement", value: textOrDash(registration.paymentMethod), align: "left" },
    {
      label: "Montant",
      value: registration.totalAmount
        ? `${formatPdfNumber(registration.totalAmount, { maximumFractionDigits: 0 })} Ar`
        : "—",
      align: "right",
    },
    { label: "Référence", value: textOrDash(registration.paymentReference), align: "left" },
  );
  return rows;
}

function sectionTitle(doc: jsPDF, title: string, y: number, x = MARGIN) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text(title, x, y);
  return y + 4;
}

function compactStyles(): Partial<Styles> {
  return {
    fontSize: 8,
    cellPadding: 2.2,
    valign: "middle",
    overflow: "linebreak",
    textColor: NAVY,
    lineColor: [210, 214, 220],
    lineWidth: 0.2,
  };
}

function headStyles(): Partial<Styles> {
  return {
    fillColor: NAVY,
    textColor: 255,
    fontStyle: "bold",
    fontSize: 7.5,
    cellPadding: 2,
  };
}

function kvTable(
  doc: jsPDF,
  rows: KvRow[],
  startY: number,
  left: number,
  width: number,
  labelWidth: number,
) {
  autoTable(doc, {
    startY,
    theme: "grid",
    pageBreak: "avoid",
    body: rows.map((row) => [row.label, row.value]),
    margin: {
      left,
      right: doc.internal.pageSize.getWidth() - left - width,
      bottom: PDF_FOOTER_MARGIN,
    },
    tableWidth: width,
    styles: compactStyles(),
    columnStyles: {
      0: { cellWidth: labelWidth, halign: "left", fontStyle: "bold", textColor: OLIVE },
    },
    didParseCell: (data) => applyValueAlign(data, rows),
  });
}

function applyValueAlign(data: CellHookData, rows: KvRow[]) {
  if (data.section !== "body" || data.column.index !== 1) return;
  const align = rows[data.row.index]?.align;
  if (align) data.cell.styles.halign = align;
}

function lastTableY(doc: jsPDF, fallback: number) {
  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? fallback;
}

function applyHeadAlign(
  data: CellHookData,
  cols: Record<number, Partial<Styles>>,
) {
  if (data.section !== "head") return;
  const align = cols[data.column.index]?.halign;
  if (align) data.cell.styles.halign = align;
}

function providedLabel(url?: string, state?: string) {
  if (isDocumentProvided(url)) return "Fourni";
  if (state === "EN_COURS") return "En cours d'envoi";
  if (state === "ECHEC") return "Echec d'envoi";
  return "Non fourni";
}

function isDocumentProvided(url?: string) {
  if (!url?.trim()) return false;
  if (/drive\.google\.com/i.test(url)) return false;
  return /\/api\/me\/registrations\/[^/]+\/documents\//.test(url);
}

function formatBirthDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR");
}

function textOrDash(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function slugPart(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "participant";
}
