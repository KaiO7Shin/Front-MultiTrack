import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { TshirtMatrix } from "./tshirtMatrix";

export function exportTshirtMatrixPdf(visible: TshirtMatrix) {
  if (visible.courses.length === 0) return;

  const doc = new jsPDF("l", "mm", "a4");
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Besoins T-shirts — tableau croisé", 14, 16);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Nombre de t-shirts par taille et par course", 14, 23);

  autoTable(doc, {
    startY: 28,
    head: [["Course", ...visible.sizes, "Total"]],
    body: [
      ...visible.courses.map((course) => [
        course.name,
        ...visible.sizes.map((size) =>
          String(visible.counts[size]?.[course.id] ?? 0)
        ),
        String(visible.columnTotals[course.id] ?? 0),
      ]),
      [
        "Total",
        ...visible.sizes.map((size) => String(visible.rowTotals[size] ?? 0)),
        String(visible.grandTotal),
      ],
    ],
    styles: { fontSize: 9, cellPadding: 2, halign: "center" },
    columnStyles: { 0: { halign: "left", cellWidth: 55 } },
    headStyles: {
      fillColor: [15, 23, 43],
      textColor: 255,
      fontStyle: "bold",
    },
  });

  doc.save("tshirts-par-course.pdf");
}
