// ─── Generación de documentos (.docx y PDF) ─────────────────────────────────
// Convierte el contenido (Markdown) a .docx y PDF. Librerías serverless-safe
// (docx y pdf-lib: Node puro, sin binarios nativos).

import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Limpia la sintaxis Markdown básica para el documento final
function limpiarMd(text) {
  return text
    .replace(/^#+\s*/, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/_+([^_]+)_+/g, '$1');
}

export async function generarDocx(markdown) {
  const lines = String(markdown || '').split('\n');
  const children = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun(limpiarMd(trimmed))],
      });
    }
    return new Paragraph({ children: [new TextRun(limpiarMd(line))] });
  });
  const doc = new Document({ sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
}

export async function generarPdf(markdown) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const lines = String(markdown || '').split('\n').map((l) => limpiarMd(l));

  let page = pdf.addPage();
  let y = page.getHeight() - 60;

  for (const line of lines) {
    if (y < 50) {
      page = pdf.addPage();
      y = page.getHeight() - 60;
    }
    page.drawText(line || ' ', { x: 50, y, size: 10, font, color: rgb(0.12, 0.12, 0.12) });
    y -= 16;
  }

  return Buffer.from(await pdf.save());
}
