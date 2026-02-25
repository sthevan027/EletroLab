/**
 * Módulo MICROHMÍMETRO
 * R = V/I e comparação percentual para mau contato
 */

export interface MicrohmInput {
  /** Tensão aplicada em V */
  voltage_V: number;
  /** Corrente medida em A */
  current_A: number;
  /** Valor de referência em Ω */
  reference_Ohm: number;
}

export interface MicrohmResult {
  /** Resistência medida R = V/I em Ω */
  R_Ohm: number;
  /** Diferença percentual |R_medido - R_ref| / R_ref × 100 */
  percentDelta: number;
  /** Indicador de possível mau contato (> 50%) */
  possibleBadContact: boolean;
  /** Status */
  status: 'ok' | 'alerta' | 'mau_contato';
}

/**
 * R = V / I
 */
export function calculateMicrohm(input: MicrohmInput): MicrohmResult {
  const { voltage_V, current_A, reference_Ohm } = input;
  const V = Number(voltage_V) ?? 0;
  const I = Math.max(1e-9, Number(current_A) ?? 0); // evitar div/0
  const R_ref = Math.max(1e-9, Number(reference_Ohm) ?? 0);

  const R_Ohm = V / I;
  const percentDelta = Math.abs(R_Ohm - R_ref) / R_ref * 100;
  const possibleBadContact = percentDelta > 50;

  let status: MicrohmResult['status'] = 'ok';
  if (percentDelta > 50) status = 'mau_contato';
  else if (percentDelta > 20) status = 'alerta';

  return {
    R_Ohm: Math.round(R_Ohm * 1000000) / 1000000,
    percentDelta: Math.round(percentDelta * 100) / 100,
    possibleBadContact,
    status
  };
}
