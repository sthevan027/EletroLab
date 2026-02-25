/**
 * Módulo DIMENSIONAMENTO DE CABOS
 * Funções puras: corrente, queda de tensão, seção mínima
 */

/** ρ cobre em Ω·mm²/m */
export const RHO_COPPER = 0.0172;

/** Tensões padrão em V */
export const STANDARD_VOLTAGES = [127, 220, 380, 440] as const;

export type SystemType = 'monofasico' | 'trifasico';

export interface CableInput {
  /** Potência em W */
  power: number;
  /** Tensão em V */
  voltage: number;
  /** Fator de potência (0 a 1) */
  powerFactor: number;
  /** Tipo de sistema */
  systemType: SystemType;
  /** Distância em metros */
  distance: number;
  /** Queda de tensão admitida em % (ex: 4) */
  voltageDropPercent: number;
  /** Método de instalação (para tabelas futuras) */
  installationMethod?: string;
  /** Temperatura ambiente °C */
  ambientTemp?: number;
}

export interface CableResult {
  /** Corrente em A */
  current_A: number;
  /** Queda de tensão em V */
  voltageDrop_V: number;
  /** Queda de tensão em % */
  voltageDropPercent: number;
  /** Seção mínima em mm² */
  minSection_mm2: number;
  /** Resistência do cabo em Ω */
  resistance_Ohm: number;
  /** Status */
  status: 'ok' | 'queda_alta' | 'entrada_invalida';
}

/**
 * Calcula corrente de carga
 * Monofásico: I = P / (V · FP)
 * Trifásico: I = P / (√3 · V · FP)
 */
export function calculateCurrent(
  power_W: number,
  voltage_V: number,
  powerFactor: number,
  systemType: SystemType
): number {
  const P = Math.max(0, Number(power_W) || 0);
  const V = Math.max(0.1, Number(voltage_V) || 0);
  const FP = Math.min(1, Math.max(0.1, Number(powerFactor) || 0.92));
  if (P === 0 || V === 0) return 0;
  if (systemType === 'trifasico') {
    return P / (Math.sqrt(3) * V * FP);
  }
  return P / (V * FP);
}

/**
 * Calcula queda de tensão
 * Monofásico: ΔV = 2 · L · I · R / 1000 (R em Ω/km)
 * Trifásico: ΔV = √3 · L · I · R / 1000
 * R_km = ρ/S para resistência por km
 */
export function calculateVoltageDrop(
  current_A: number,
  distance_m: number,
  section_mm2: number,
  systemType: SystemType,
  rho = RHO_COPPER
): number {
  const I = Math.max(0, Number(current_A) || 0);
  const L = Math.max(0, Number(distance_m) || 0);
  const S = Math.max(0.001, Number(section_mm2) || 0);
  if (I === 0 || L === 0 || S === 0) return 0;
  // R por metro = ρ/S Ω/m; R total = ρ·L/S Ω
  const R_total = (rho * L) / S;
  if (systemType === 'trifasico') {
    return Math.sqrt(3) * I * R_total;
  }
  return 2 * I * R_total;
}

/**
 * Calcula seção mínima para queda de tensão admitida
 * Mono: S = 2·ρ·L·I / ΔV_adm
 * Tri: S = √3·ρ·L·I / ΔV_adm
 */
export function calculateMinSection(
  current_A: number,
  distance_m: number,
  voltageDrop_V: number,
  systemType: SystemType,
  rho = RHO_COPPER
): number {
  const I = Math.max(0, Number(current_A) || 0);
  const L = Math.max(0, Number(distance_m) || 0);
  const dV = Math.max(0.1, Number(voltageDrop_V) || 0);
  if (I === 0 || L === 0) return 0;
  if (systemType === 'trifasico') {
    return (Math.sqrt(3) * rho * L * I) / dV;
  }
  return (2 * rho * L * I) / dV;
}

/**
 * Função principal: dimensionamento de cabo
 */
export function calculateCable(input: CableInput): CableResult {
  const {
    power,
    voltage,
    powerFactor,
    systemType,
    distance,
    voltageDropPercent,
    ambientTemp = 25
  } = input;

  const P = Math.max(0, Number(power) || 0);
  const V = Math.max(0.1, Number(voltage) || 0);
  const FP = Math.min(1, Math.max(0.1, Number(powerFactor) || 0.92));
  const L = Math.max(0, Number(distance) || 0);
  const dVpct = Math.min(10, Math.max(0.1, Number(voltageDropPercent) || 4));

  if (P === 0 || V === 0 || L === 0) {
    return {
      current_A: 0,
      voltageDrop_V: 0,
      voltageDropPercent: 0,
      minSection_mm2: 0,
      resistance_Ohm: 0,
      status: 'entrada_invalida'
    };
  }

  const I = calculateCurrent(P, V, FP, systemType);
  const dV_adm_V = (dVpct / 100) * V;
  const S_min = calculateMinSection(I, L, dV_adm_V, systemType);

  // Arredondar para bitola comercial (1.5, 2.5, 4, 6, 10, 16, 25, 35, 50...)
  const commercialSections = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];
  let S_sel = commercialSections.find((s) => s >= S_min) ?? commercialSections[commercialSections.length - 1];
  if (S_min <= 0) S_sel = 1.5;

  const voltageDrop_V = calculateVoltageDrop(I, L, S_sel, systemType);
  const voltageDropPct = (voltageDrop_V / V) * 100;
  const R_cable = (RHO_COPPER * L) / S_sel;

  let status: CableResult['status'] = 'ok';
  if (voltageDropPct > dVpct) status = 'queda_alta';

  return {
    current_A: Math.round(I * 100) / 100,
    voltageDrop_V: Math.round(voltageDrop_V * 1000) / 1000,
    voltageDropPercent: Math.round(voltageDropPct * 100) / 100,
    minSection_mm2: S_sel,
    resistance_Ohm: Math.round(R_cable * 10000) / 10000,
    status
  };
}
