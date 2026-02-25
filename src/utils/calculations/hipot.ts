/**
 * Módulo HI-POT
 * Vteste = 2·Vnominal + 1000 ou 1.5 × Vnominal
 */

export interface HipotInput {
  /** Tensão nominal em V */
  nominalVoltage_V: number;
  /** Usar fórmula industrial (2·V+1000) ou simples (1.5·V) */
  useIndustrialFormula?: boolean;
}

export interface HipotResult {
  /** Tensão de teste em V */
  Vteste_V: number;
  /** Tensão nominal em V */
  Vnominal_V: number;
  /** Fórmula usada */
  formulaUsed: '2V+1000' | '1.5V';
}

/**
 * Vteste = 2·Vnominal + 1000 (industrial)
 * ou Vteste = 1.5 × Vnominal
 */
export function calculateHipot(input: HipotInput): HipotResult {
  const { nominalVoltage_V, useIndustrialFormula = true } = input;
  const V = Math.max(0, Number(nominalVoltage_V) ?? 0);

  let Vteste: number;
  let formulaUsed: '2V+1000' | '1.5V';
  if (useIndustrialFormula) {
    Vteste = 2 * V + 1000;
    formulaUsed = '2V+1000';
  } else {
    Vteste = 1.5 * V;
    formulaUsed = '1.5V';
  }

  return {
    Vteste_V: Math.round(Vteste),
    Vnominal_V: V,
    formulaUsed
  };
}
