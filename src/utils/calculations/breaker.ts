/**
 * Módulo DISJUNTOR (DJ)
 * Corrente nominal, curva, coordenação básica
 */

export type BreakerCurve = 'B' | 'C' | 'D';

export type LoadType = 'iluminacao' | 'tomada' | 'motor';

export interface BreakerInput {
  /** Corrente de carga em A */
  loadCurrent_A: number;
  /** Tipo de carga para definir curva */
  loadType: LoadType;
  /** Corrente máxima do cabo em A (coordenação) */
  cableMaxCurrent_A?: number;
}

export interface BreakerResult {
  /** Corrente nominal recomendada em A */
  In_A: number;
  /** Curva: B | C | D */
  curve: BreakerCurve;
  /** Correntes padronizadas disponíveis */
  standardValues: number[];
  /** Coordenação: Idj <= Icabo */
  coordinationOk: boolean;
  /** Valor selecionado (arredondado para padrão) */
  selectedIn_A: number;
}

/** Correntes padronizadas de disjuntores em A */
const STANDARD_BREAKER_CURRENTS = [
  6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250
];

/** Mapeia tipo de carga → curva */
const LOAD_TO_CURVE: Record<LoadType, BreakerCurve> = {
  iluminacao: 'B',
  tomada: 'C',
  motor: 'D'
};

/**
 * Seleciona In >= Icarga
 */
export function calculateBreaker(input: BreakerInput): BreakerResult {
  const { loadCurrent_A, loadType, cableMaxCurrent_A } = input;
  const I_load = Math.max(0, Number(loadCurrent_A) || 0);
  const I_cabo = cableMaxCurrent_A ? Math.max(0, Number(cableMaxCurrent_A)) : Infinity;

  const curve = LOAD_TO_CURVE[loadType] ?? 'C';
  const In = STANDARD_BREAKER_CURRENTS.find((v) => v >= I_load) ?? STANDARD_BREAKER_CURRENTS[STANDARD_BREAKER_CURRENTS.length - 1];
  const coordinationOk = In <= I_cabo;

  return {
    In_A: In,
    curve,
    standardValues: STANDARD_BREAKER_CURRENTS,
    coordinationOk,
    selectedIn_A: In
  };
}
