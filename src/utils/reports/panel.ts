/**
 * Motor de relatório - PAINEL
 * Agrega Megger, Cabo, Disjuntor, Hipot
 */

import { generateMeggerReport } from './megger';
import { generateCableReport } from './cable';
import { calculateBreaker, type BreakerInput } from '../calculations/breaker';
import { calculateHipot, type HipotInput } from '../calculations/hipot';
import { validateByNBR5410, validateByIEC60364 } from '../norms';

export interface PanelReportInput {
  /** Configuração Megger (opcional) */
  megger?: Parameters<typeof generateMeggerReport>[0];
  /** Configuração Cabo (opcional) */
  cable?: Parameters<typeof generateCableReport>[0];
  /** Configuração Disjuntor */
  breaker?: BreakerInput;
  /** Configuração Hipot */
  hipot?: HipotInput;
  /** Metadados */
  panelTag?: string;
  client?: string;
  site?: string;
}

export interface PanelReportOutput {
  id: string;
  createdAt: Date;
  megger?: ReturnType<typeof generateMeggerReport>;
  cable?: ReturnType<typeof generateCableReport>;
  breaker?: ReturnType<typeof calculateBreaker>;
  hipot?: ReturnType<typeof calculateHipot>[];
  validationNBR5410: ReturnType<typeof validateByNBR5410>;
  validationIEC60364: ReturnType<typeof validateByIEC60364>;
  metadata: {
    panelTag?: string;
    client?: string;
    site?: string;
  };
}

/**
 * Gera relatório completo de painel
 */
export function generatePanelReport(input: PanelReportInput): PanelReportOutput {
  let meggerReport: ReturnType<typeof generateMeggerReport> | undefined;
  let cableReport: ReturnType<typeof generateCableReport> | undefined;
  let breakerResult: ReturnType<typeof calculateBreaker> | undefined;
  const hipotResults: ReturnType<typeof calculateHipot>[] = [];

  const context: Parameters<typeof validateByNBR5410>[0] = {};

  if (input.megger) {
    meggerReport = generateMeggerReport(input.megger);
    context.megger = { input: input.megger, result: meggerReport.meggerResult };
  }

  if (input.cable) {
    cableReport = generateCableReport(input.cable);
    context.cable = { input: input.cable, result: cableReport.cableResult };
    if (cableReport.breakerResult) {
      breakerResult = cableReport.breakerResult;
      context.breaker = {
        input: { loadCurrent_A: cableReport.cableResult.current_A, loadType: input.cable.loadType || 'tomada' },
        result: breakerResult
      };
    }
  } else if (input.breaker) {
    breakerResult = calculateBreaker(input.breaker);
    context.breaker = { input: input.breaker, result: breakerResult };
  }

  if (input.hipot) {
    const hipotResult = calculateHipot(input.hipot);
    hipotResults.push(hipotResult);
    context.hipot = { input: input.hipot, result: hipotResult };
  }

  const validationNBR5410 = validateByNBR5410(context);
  const validationIEC60364 = validateByIEC60364(context);

  return {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    megger: meggerReport,
    cable: cableReport,
    breaker: breakerResult,
    hipot: hipotResults.length > 0 ? hipotResults : undefined,
    validationNBR5410,
    validationIEC60364,
    metadata: {
      panelTag: input.panelTag,
      client: input.client,
      site: input.site
    }
  };
}
