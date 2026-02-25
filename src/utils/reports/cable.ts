/**
 * Motor de relatório - DIMENSIONAMENTO DE CABOS
 */

import { calculateCable, type CableInput, type CableResult } from '../calculations/cable';
import { calculateBreaker } from '../calculations/breaker';
import { validateByNBR5410 } from '../norms';

/** Ampacidade aproximada por seção (método B1) em A */
const AMPACITY: Record<number, number> = {
  1.5: 15, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 66, 25: 84, 35: 104, 50: 125, 70: 160, 95: 194, 120: 225, 150: 260, 185: 296, 240: 340
};

function getAmpacity(section: number): number {
  return AMPACITY[section] ?? 15;
}

export interface CableReportInput extends CableInput {
  tag?: string;
  client?: string;
  site?: string;
  loadType?: 'iluminacao' | 'tomada' | 'motor';
}

export interface CableReportOutput {
  id: string;
  createdAt: Date;
  cableResult: CableResult;
  breakerResult?: ReturnType<typeof calculateBreaker>;
  validation: ReturnType<typeof validateByNBR5410>;
  metadata: {
    tag?: string;
    client?: string;
    site?: string;
  };
}

/**
 * Gera relatório completo de dimensionamento de cabos
 */
export function generateCableReport(input: CableReportInput): CableReportOutput {
  const cableResult = calculateCable(input);
  let breakerResult: ReturnType<typeof calculateBreaker> | undefined;

  const cableMaxCurrent = getAmpacity(cableResult.minSection_mm2);
  if (input.loadType) {
    breakerResult = calculateBreaker({
      loadCurrent_A: cableResult.current_A,
      loadType: input.loadType,
      cableMaxCurrent_A: cableMaxCurrent
    });
  }

  const breakerInput = breakerResult ? {
    loadCurrent_A: cableResult.current_A,
    loadType: input.loadType || 'tomada' as const,
    cableMaxCurrent_A: cableMaxCurrent
  } : undefined;

  const validation = validateByNBR5410({
    cable: { input, result: cableResult },
    breaker: breakerResult && breakerInput ? { input: breakerInput, result: breakerResult } : undefined
  });

  return {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    cableResult,
    breakerResult,
    validation,
    metadata: {
      tag: input.tag,
      client: input.client,
      site: input.site
    }
  };
}
