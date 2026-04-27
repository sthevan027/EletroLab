import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { EMHeaderMeta, EletroMecanicoReport } from '../../types';
import type { EMTemplateMapping, PDFPlacement, PDFTextPlacement } from './types';

function toDateStr(date: string | undefined): string {
  if (!date) return '';
  return date.slice(0, 10);
}

function safeText(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

function fieldValueFromHeader(key: string, header: EMHeaderMeta): string {
  switch (key) {
    case 'header.reportNumber':
      return safeText(header.reportNumber);
    case 'header.date':
      return toDateStr(header.date);
    case 'header.client':
      return safeText(header.client);
    case 'header.site':
      return safeText(header.site);
    case 'header.tag':
      return safeText(header.tag);
    case 'header.equipmentDescription':
      return safeText(header.equipmentDescription);
    case 'header.responsible.name':
      return safeText(header.responsible?.name);
    case 'header.responsible.crea':
      return safeText(header.responsible?.crea);
    case 'header.responsible.role':
      return safeText(header.responsible?.role);
    case 'header.observations':
      return safeText(header.observations);
    case 'header.recommendations':
      return safeText(header.recommendations);
    default:
      return '';
  }
}

/**
 * Preenche um PDF base com os dados do cabeçalho/rodapé (template corporativo).
 *
 * Observações importantes:
 * - Sem o PDF base, este método não consegue gerar um PDF "corporativo".
 * - Estratégia: overlay por coordenadas.
 * - Quando o PDF base tiver campos (AcroForm), podemos evoluir este módulo para preencher forms.
 */
export async function exportEMReportWithPdfTemplate(
  report: EletroMecanicoReport,
  templatePdfBytes: ArrayBuffer,
  mapping: EMTemplateMapping
): Promise<Blob> {
  if (!templatePdfBytes || templatePdfBytes.byteLength === 0) {
    throw new Error('PDF base do template não fornecido');
  }

  const pdfDoc = await PDFDocument.load(templatePdfBytes);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const defaultSize = 10;
  const color = { r: 0, g: 0, b: 0 };

  const header: EMHeaderMeta = report.header;
  const placements: PDFPlacement[] = mapping.placements || [];

  for (const p of placements) {
    if (p.type !== 'text') continue;

    const t = p as PDFTextPlacement;
    const page = pdfDoc.getPage(t.page ?? 0);
    const value = fieldValueFromHeader(t.key, header);
    if (!value) continue;

    const size = t.size ?? defaultSize;

    page.drawText(value, {
      x: t.x,
      y: t.y,
      size,
      font,
      color: rgb(color.r / 255, color.g / 255, color.b / 255),
      maxWidth: t.maxWidth,
    });
  }

  const bytes = await pdfDoc.save();
  // `bytes` pode vir com `ArrayBufferLike` em tipos; normalizamos para ArrayBuffer.
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

