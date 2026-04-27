import type { EletroMecanicoReport } from '../../types';

export type PDFPlacementUnit = 'pt';

export type PDFTextAlign = 'left' | 'center' | 'right';

export interface PDFTextPlacement {
  type: 'text';
  key: string; // ex: "header.client"
  page: number; // 0-based
  x: number;
  y: number;
  size?: number;
  maxWidth?: number;
  align?: PDFTextAlign;
}

export interface PDFImagePlacement {
  type: 'image';
  key: string; // ex: "header.signatures[0].imageDataUrl"
  page: number; // 0-based
  x: number;
  y: number;
  width: number;
  height: number;
}

export type PDFPlacement = PDFTextPlacement | PDFImagePlacement;

export interface EMTemplateMapping {
  id: string;
  name: string;
  unit: PDFPlacementUnit; // atualmente pt
  placements: PDFPlacement[];
}

export interface ExportEMTemplatePDFOptions {
  templatePdfBytes: ArrayBuffer; // PDF base (corporativo)
  mapping: EMTemplateMapping;
  report: EletroMecanicoReport;
  fontSizeDefault?: number;
}

