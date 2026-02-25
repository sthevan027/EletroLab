/**
 * Motor de relatório - MEGGER
 */

import { calculateMegger, type MeggerInput, type MeggerResult } from '../calculations/megger';
import { validateByNBR5410 } from '../norms';
import type { IRReport } from '../../types';
import { formatResistance } from '../physics';
import { getStandardTimeSeries } from '../units';

export interface MeggerReportInput extends MeggerInput {
  category?: string;
  tag?: string;
  client?: string;
  site?: string;
  operator?: string;
}

export interface MeggerReportOutput {
  /** Relatório IR para compatibilidade com export existente */
  irReport: IRReport;
  /** Resultado do cálculo físico */
  meggerResult: MeggerResult;
  /** Validação NBR 5410 */
  validation: ReturnType<typeof validateByNBR5410>;
}

/**
 * Gera relatório completo de Megger
 */
export function generateMeggerReport(input: MeggerReportInput): MeggerReportOutput {
  const meggerResult = calculateMegger(input);
  const validation = validateByNBR5410({
    megger: { input, result: meggerResult }
  });

  // Gerar série temporal (4 leituras com leve decaimento)
  const times = getStandardTimeSeries();
  const R0 = meggerResult.R_MOhm;
  const readings = times.map((time, i) => {
    const decay = Math.pow(0.98, i);
    const R = R0 * decay;
    return {
      time,
      kv: '1.00',
      resistance: formatResistance(R)
    };
  });

  // DAI: R60/R30
  const r30 = meggerResult.R_MOhm * Math.pow(0.98, 1);
  const r60 = meggerResult.R_MOhm * Math.pow(0.98, 3);
  const dai = r30 > 0 ? (r60 / r30).toFixed(2) : 'Undefined';

  const irReport: IRReport = {
    id: crypto.randomUUID(),
    category: (input.category as any) || 'cabo',
    tag: input.tag,
    kv: input.testVoltage ?? 1,
    client: input.client,
    site: input.site,
    operator: input.operator,
    readings,
    dai,
    createdAt: new Date(),
    isSaved: false,
    status: meggerResult.status === 'Aprovado' ? 'aprovado' : 'reprovado',
    meta: {
      physics: {
        RiBaseMOhm: meggerResult.details.Ri_MOhm,
        scaleFactor: meggerResult.details.scaleFactor,
        temperature: input.temperature,
        humidity: input.humidity,
        appliedBoost: true,
        material: input.material,
        gauge: input.gauge,
        lengthMeters: input.length
      }
    }
  };

  return {
    irReport,
    meggerResult,
    validation
  };
}
