import { jsPDF, TilingPattern } from "./dep/jspdf.umd.min";
// import { jsPDF } from "jspdf";
import { createBinaryFile } from "./utils/utils";

export async function createPdf(app: any) {
  // const doc = new jsPDF({ unit: "px", format: "a4" });

  const pdf = new jsPDF({ unit: "px", format: "a4" });
  gridBackground(pdf, {
    color: "#C8C8C8",
    width: 0.5,
    spacing: 20,
    offsetX: 0,
    offsetY: 0,
  });
  const binary = pdf.output("arraybuffer");
  await createBinaryFile(app, binary, "./a4.pdf");
}

// Add lines to the pdf

interface lineSettings {
  color: string;
  width: number;
  spacing: number;
  offset: number;
}

function linedBackground(doc: jsPDF, settings: lineSettings) {
  doc.setDrawColor(settings.color);
  doc.setLineWidth(settings.width);
  for (let i = settings.offset; i < 1000; i += settings.spacing) {
    doc.line(0, i, 1000, i);
  }
}

interface gridSettings {
  color: string;
  width: number;
  spacing: number;
  offsetX: number;
  offsetY: number;
}

function gridBackground(doc: jsPDF, settings: gridSettings) {
  doc.setDrawColor(settings.color);
  doc.setLineWidth(settings.width);
  for (let i = settings.offsetX; i < 1000; i += settings.spacing) {
    doc.line(i, 0, i, 1000);
  }
  for (let i = settings.offsetY; i < 1000; i += settings.spacing) {
    doc.line(0, i, 1000, i);
  }
}
