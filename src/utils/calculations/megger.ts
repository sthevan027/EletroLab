/**
 * Módulo MEGGER - Resistência de Isolamento
 * Funções puras de cálculo com validação Rmin = 1/L_km
 */

import {
  getInsulationConstant,
  estimateDiametersFromGauge,
  calculatePhysicalResistance,
  scaleResistanceForLength,
  applyEnvironmentalAdjustments
} from '../physics';

export interface MeggerInput {
  /** Bitola em mm² */
  gauge: number;
  /** Nº de condutores */
  conductorCount?: number;
  /** Material: PVC | XLPE | EPR */
  material: 'PVC' | 'XLPE' | 'EPR' | 'outro';
  /** Comprimento em metros */
  length: number;
  /** Temperatura em °C */
  temperature: number;
  /** Umidade em % */
  humidity: number;
  /** Tensão de ensaio em kV */
  testVoltage?: number;
  /** Diâmetro condutor em mm (opcional) */
  conductorDiameter?: number;
  /** Espessura isolante em mm (opcional) */
  insulationThickness?: number;
}

export interface MeggerResult {
  /** Resistência final em MΩ */
  R_MOhm: number;
  /** R mínimo por norma (1/L_km) em MΩ */
  Rmin_MOhm: number;
  /** Status: Aprovado | Reprovado */
  status: 'Aprovado' | 'Reprovado';
  /** Detalhes intermediários */
  details: {
    Ri_MOhm: number;
    scaleFactor: number;
    FT: number;
    FH: number;
    L_km: number;
  };
}

/**
 * Calcula resistência de isolamento (Megger) conforme especificação
 * R = Ri · F(L) · FT · FH
 * Rmin = 1 / L_km
 */
export function calculateMegger(input: MeggerInput): MeggerResult {
  const { gauge, material, length, temperature, humidity } = input;

  // Sanitizar entradas
  const L_m = Math.max(0.001, Number(length) || 0);
  const L_km = L_m / 1000;
  const T = Number(temperature) ?? 20;
  const H = Number(humidity) ?? 50;

  // Ki por material
  const Ki = getInsulationConstant(material);
  const { d, D } = estimateDiametersFromGauge(
    gauge,
    input.conductorDiameter,
    input.insulationThickness
  );

  // Ri = Ki · ln(D/d) / L_km
  let Ri = calculatePhysicalResistance(Ki, D, d, L_m);
  const scaleFactor = scaleResistanceForLength(1, L_m) || 1;
  Ri = scaleResistanceForLength(Ri, L_m);
  Ri = applyEnvironmentalAdjustments(Ri, T, H);

  // FT = 2^((20-T)/10)
  const FT = Math.pow(2, (20 - T) / 10);
  // FH = 1 - 0.002(H - 50)
  const FH = 1 - 0.002 * (H - 50);

  // R final (já aplicado em applyEnvironmentalAdjustments)
  const R_MOhm = Math.max(0, Ri);

  // Rmin = 1 / L_km (norma - MΩ)
  const Rmin = 1 / Math.max(0.001, L_km);
  const status: 'Aprovado' | 'Reprovado' = R_MOhm >= Rmin ? 'Aprovado' : 'Reprovado';

  return {
    R_MOhm,
    Rmin_MOhm: Rmin,
    status,
    details: {
      Ri_MOhm: Ri,
      scaleFactor,
      FT,
      FH,
      L_km
    }
  };
}
