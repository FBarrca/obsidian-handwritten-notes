import jsPDF from "./dep/jspdf.umd.min";

export function createPdf() {
  const doc = new jsPDF();

  doc.text("Hello world!", 10, 10);
  doc.save("a4.pdf");
}
