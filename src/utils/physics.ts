import { EnvironmentalFactors, PhysicalCableOptions } from '../types';
import { formatResistance as formatOhms, getStandardTimeSeries } from './units';

/**
 * Retorna constante de isolação (Ki) por material em MΩ·km
 */
export function getInsulationConstant(material: string): number {
  const map: Record<string, number> = {
    XLPE: 3700,
    EPR: 3000,
    PVC: 2500,
    outro: 3000
  };
  const key = String(material || 'outro').toUpperCase();
  return map[key] ?? map.outro;
}

/**
 * Estima diâmetros do condutor (d) e externo do isolamento (D), em mm
 * - d estimado via área (bitola) se não fornecido
 * - t estimada como ~0.6 × (d/2) se não fornecida
 * - D = d + 2t
 */
export function estimateDiametersFromGauge(
  gaugeMm2: number,
  dInput?: number,
  tInput?: number
): { d: number; D: number } {
  const area = Math.max(0, Number(gaugeMm2) || 0);
  const d = dInput && dInput > 0 ? dInput : Math.sqrt((4 * area) / Math.PI);
  const t = tInput && tInput > 0 ? tInput : 0.6 * (d / 2);
  const D = d + 2 * t;
  return { d, D };
}

/**
 * Calcula Ri em MΩ usando Ri = (Ki × ln(D/d)) / L_km
 * - Ki em MΩ·km, D e d em mm, L em metros (convertido para km)
 */
export function calculatePhysicalResistance(
  Ki: number,
  Dmm: number,
  dmm: number,
  lengthMeters: number
): number {
  const L_km = Math.max(0.001, (Number(lengthMeters) || 0) / 1000);
  const D = Math.max(0, Number(Dmm) || 0);
  const d = Math.max(0, Number(dmm) || 0);
  if (!(D > d) || D === 0 || d === 0) {
    // Evitar ln inválido; retornar mínimo seguro em MΩ
    return 0;
  }
  const lnRatio = Math.log(D / d);
  if (lnRatio <= 0) return 0;
  const Ri_MOhm = (Ki * lnRatio) / L_km;
  return Math.max(0, Ri_MOhm);
}

/**
 * Aplica fatores de escala por comprimento (entrada L em metros)
 * - L < 10 m  => × (1000 / L)
 * - 10 ≤ L < 100 m => × (100 / L)
 * - L ≥ 100 m => × 1
 */
export function scaleResistanceForLength(
  Ri_MOhm: number,
  lengthMeters: number,
  opts?: { boostShortLength?: boolean }
): number {
  const { boostShortLength = true } = opts || {};
  if (!boostShortLength) return Ri_MOhm;
  const L = Math.max(0.001, Number(lengthMeters) || 0); // evitar div/0
  if (L < 10) return Ri_MOhm * (1000 / L);
  if (L < 100) return Ri_MOhm * (100 / L);
  return Ri_MOhm;
}

/**
 * Ajustes ambientais: temperatura e umidade
 * - temperatura: × 2^((20 - T)/10)
 * - umidade: × (1 - 0.002 × (H - 50))
 * Clamp total 0.8–1.1
 */
export function applyEnvironmentalAdjustments(
  Ri_MOhm: number,
  temperatureC: number,
  humidityPct: number
): number {
  const tempFactor = Math.pow(2, (20 - (Number(temperatureC) || 0)) / 10);
  const humidityFactor = 1 - 0.002 * ((Number(humidityPct) || 0) - 50);
  const combined = tempFactor * humidityFactor;
  const clamped = Math.min(1.1, Math.max(0.8, combined));
  return Math.max(0, Ri_MOhm * clamped);
}

/**
 * Pipeline híbrido completo; retorna Ri final em MΩ
 */
export function calculateHybridResistance(
  options: PhysicalCableOptions,
  env: EnvironmentalFactors,
  opts?: { boostShortLength?: boolean }
): number {
  const Ki = getInsulationConstant(options.material);
  const { d, D } = estimateDiametersFromGauge(
    options.gauge,
    options.conductorDiameter,
    options.insulationThickness
  );
  let Ri = calculatePhysicalResistance(Ki, D, d, options.length);
  Ri = scaleResistanceForLength(Ri, options.length, opts);
  Ri = applyEnvironmentalAdjustments(Ri, env.temperature, env.humidity);
  return Ri; // em MΩ
}

/**
 * Formata resistência recebendo MΩ, convertendo para ohms e
 * delegando à função global de formatação (com OVRG)
 */
export function formatResistance(megaOhms: number, limitTOhm = 5): string {
  const ohms = Math.max(0, Number(megaOhms) || 0) * 1e6;
  return formatOhms(ohms, limitTOhm);
}

/**
 * Utilitário simples de decaimento temporal (exponencial) em MΩ
 */
export function applyTimeDecay(
  baseMOhm: number,
  index: number,
  decayPerStep: number = 0.97
): number {
  if (index <= 0) return baseMOhm;
  return baseMOhm * Math.pow(decayPerStep, index);
}


