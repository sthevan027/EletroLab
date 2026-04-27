import type {
  EletroMecanicoReport,
  EMHeaderMeta,
  EMResponsible,
  IRReport,
  MultiPhaseReport,
  ReportOriginal,
  TestOriginal,
} from '../types';

function isoDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function coalesce(...values: Array<string | undefined | null>): string {
  for (const v of values) {
    if (v && String(v).trim()) return String(v);
  }
  return '';
}

function buildResponsible(name: string | undefined): EMResponsible {
  const trimmed = (name || '').trim();
  return { name: trimmed || 'N/A' };
}

export function buildDefaultHeaderMeta(input: Partial<EMHeaderMeta>): EMHeaderMeta {
  return {
    reportNumber: input.reportNumber,
    date: input.date || isoDateOnly(new Date()),
    client: input.client || 'N/A',
    site: input.site || 'N/A',
    tag: input.tag,
    equipmentDescription: input.equipmentDescription,
    responsible: input.responsible || { name: 'N/A' },
    reviewers: input.reviewers,
    signatures: input.signatures,
    observations: input.observations,
    recommendations: input.recommendations,
  };
}

export function emFromIRReport(ir: IRReport, header?: Partial<EMHeaderMeta>): EletroMecanicoReport {
  const date =
    (ir.date && ir.date.slice(0, 10)) ||
    (ir.createdAt instanceof Date ? isoDateOnly(ir.createdAt) : isoDateOnly(new Date(ir.createdAt)));

  const hdr = buildDefaultHeaderMeta({
    reportNumber: ir.number,
    date,
    client: coalesce(ir.client, header?.client),
    site: coalesce(ir.site, header?.site),
    tag: coalesce(ir.tag, header?.tag) || undefined,
    equipmentDescription: header?.equipmentDescription,
    responsible: header?.responsible || buildResponsible(coalesce(ir.operator, ir.responsible)),
    observations: coalesce(ir.observations, ir.notes, header?.observations) || undefined,
    recommendations: coalesce(ir.recommendations, header?.recommendations) || undefined,
    reviewers: header?.reviewers,
    signatures: header?.signatures,
  });

  return {
    id: `em_${ir.id}`,
    discipline: 'eletrica',
    module: 'megger_ir',
    createdAt: ir.createdAt instanceof Date ? ir.createdAt : new Date(ir.createdAt),
    header: hdr,
    payload: { discipline: 'eletrica', module: 'megger_ir', data: ir },
    version: 1,
  };
}

export function emFromMultiPhaseReport(mp: MultiPhaseReport, header?: Partial<EMHeaderMeta>): EletroMecanicoReport {
  const createdAt = mp.createdAt instanceof Date ? mp.createdAt : new Date(mp.createdAt);
  const hdr = buildDefaultHeaderMeta({
    reportNumber: header?.reportNumber,
    date: header?.date || isoDateOnly(createdAt),
    client: header?.client || 'N/A',
    site: header?.site || 'N/A',
    tag: header?.tag || mp.equipmentTag || mp.equipment?.tag,
    equipmentDescription: header?.equipmentDescription || mp.equipment?.model,
    responsible: header?.responsible || buildResponsible(mp.operator),
    reviewers: header?.reviewers,
    signatures: header?.signatures,
    observations: header?.observations,
    recommendations: header?.recommendations,
  });

  return {
    id: `em_${mp.id}`,
    discipline: 'eletrica',
    module: 'multiphase_megger',
    createdAt,
    header: hdr,
    payload: { discipline: 'eletrica', module: 'multiphase_megger', data: mp },
    version: 1,
  };
}

export function emFromOriginalReport(
  report: ReportOriginal,
  _tests: TestOriginal[],
  header?: Partial<EMHeaderMeta>
): EletroMecanicoReport {
  const createdAt = report.createdAt ? new Date(report.createdAt) : new Date();
  const hdr = buildDefaultHeaderMeta({
    reportNumber: report.number || header?.reportNumber,
    date: report.date ? report.date.slice(0, 10) : header?.date || isoDateOnly(createdAt),
    client: coalesce(report.client, header?.client) || 'N/A',
    site: coalesce(report.location, header?.site) || 'N/A',
    tag: header?.tag,
    equipmentDescription: header?.equipmentDescription,
    responsible: header?.responsible || buildResponsible(coalesce(report.responsible)),
    observations: coalesce(report.observations, header?.observations) || undefined,
    recommendations: coalesce(report.recommendations, header?.recommendations) || undefined,
    reviewers: header?.reviewers,
    signatures: header?.signatures,
  });

  // Por ora, a migração “original” cai no módulo megger_ir com um IR vazio
  // (mantemos compat e preservamos cabeçalho/rodapé para template corporativo).
  const irStub: IRReport = {
    id: report.id,
    number: report.number,
    category: 'outro',
    kv: 1.0,
    client: report.client,
    site: report.location,
    operator: report.responsible,
    readings: [],
    dai: 'Undefined',
    createdAt,
    isSaved: true,
    notes: report.observations,
    recommendations: report.recommendations,
  };

  return {
    id: `em_${report.id}`,
    discipline: 'eletrica',
    module: 'megger_ir',
    createdAt,
    header: hdr,
    payload: { discipline: 'eletrica', module: 'megger_ir', data: irStub },
    version: 1,
  };
}

