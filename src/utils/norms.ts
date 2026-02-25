/**
 * Motor de validação por normas
 * NBR 5410 e IEC 60364
 */

import type { ValidationError, ValidationResult } from '../types';
import { calculateMegger, type MeggerResult } from './calculations/megger';
import { calculateCable, type CableInput, type CableResult } from './calculations/cable';
import { calculateBreaker, type BreakerInput, type BreakerResult } from './calculations/breaker';
import { calculateHipot, type HipotInput, type HipotResult } from './calculations/hipot';
import { calculateMicrohm, type MicrohmInput, type MicrohmResult } from './calculations/microhm';

/** Tipo de validação */
export type NormType = 'NBR5410' | 'IEC60364';

/** Contexto de validação */
export interface ValidationContext {
  megger?: { input: Parameters<typeof calculateMegger>[0]; result?: MeggerResult };
  cable?: { input: CableInput; result?: CableResult };
  breaker?: { input: BreakerInput; result?: BreakerResult };
  hipot?: { input: HipotInput; result?: HipotResult };
  microhm?: { input: MicrohmInput; result?: MicrohmResult };
}

/** Resultado agregado de validação */
export interface NormValidationResult {
  norm: NormType;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  passed: string[];
}

/**
 * Validação conforme NBR 5410
 * - Resistência de isolamento: Rmin = 1/L_km
 * - Queda de tensão: ≤ 4% em geral
 * - Seção mínima: conforme tabela
 */
export function validateByNBR5410(context: ValidationContext): NormValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const passed: string[] = [];

  if (context.megger) {
    const result = context.megger.result ?? calculateMegger(context.megger.input);
    if (result.status === 'Reprovado') {
      errors.push({
        field: 'megger',
        message: `Resistência de isolamento (${result.R_MOhm.toFixed(2)} MΩ) menor que Rmin (${result.Rmin_MOhm.toFixed(2)} MΩ). Reprovado por NBR 5410.`,
        type: 'norm'
      });
    } else {
      passed.push('Megger: R >= Rmin (1/L_km)');
    }
  }

  if (context.cable) {
    const result = context.cable.result ?? calculateCable(context.cable.input);
    if (result.voltageDropPercent > 4) {
      errors.push({
        field: 'cable',
        message: `Queda de tensão (${result.voltageDropPercent.toFixed(2)}%) excede 4% admitido pela NBR 5410.`,
        type: 'norm'
      });
    } else {
      passed.push('Cable: queda de tensão <= 4%');
    }
    if (result.minSection_mm2 < 1.5) {
      warnings.push({
        field: 'cable',
        message: 'Seção mínima recomendada < 1.5 mm². Verificar instalação.',
        type: 'norm'
      });
    }
  }

  if (context.breaker) {
    const result = context.breaker.result ?? calculateBreaker(context.breaker.input);
    if (!result.coordinationOk && context.breaker.input.cableMaxCurrent_A) {
      errors.push({
        field: 'breaker',
        message: `Coordenação inválida: Idj (${result.In_A} A) > Icabo. NBR 5410 exige Idj <= Icabo.`,
        type: 'norm'
      });
    } else if (context.breaker.input.cableMaxCurrent_A) {
      passed.push('Breaker: coordenação Idj <= Icabo');
    }
  }

  if (context.hipot) {
    const result = context.hipot.result ?? calculateHipot(context.hipot.input);
    if (result.Vteste_V < 500 && context.hipot.input.nominalVoltage_V > 0) {
      warnings.push({
        field: 'hipot',
        message: `Tensão de teste (${result.Vteste_V} V) muito baixa para Vnom = ${context.hipot.input.nominalVoltage_V} V.`,
        type: 'norm'
      });
    } else {
      passed.push('Hipot: tensão de teste conforme');
    }
  }

  if (context.microhm) {
    const result = context.microhm.result ?? calculateMicrohm(context.microhm.input);
    if (result.possibleBadContact) {
      errors.push({
        field: 'microhm',
        message: `Desvio percentual (${result.percentDelta.toFixed(1)}%) > 50%. Possível mau contato.`,
        type: 'norm'
      });
    } else {
      passed.push('Microhm: desvio aceitável');
    }
  }

  return {
    norm: 'NBR5410',
    isValid: errors.length === 0,
    errors,
    warnings,
    passed
  };
}

/**
 * Validação conforme IEC 60364
 */
export function validateByIEC60364(context: ValidationContext): NormValidationResult {
  const result = validateByNBR5410(context);
  return { ...result, norm: 'IEC60364' };
}

/**
 * Valida entrada para evitar valores absurdos
 */
export function validateInputsSanity(context: ValidationContext): ValidationResult {
  const validationErrors: ValidationError[] = [];

  if (context.megger) {
    const { gauge, length, temperature, humidity } = context.megger.input;
    if (gauge <= 0 || gauge > 1000) validationErrors.push({ field: 'megger.gauge', message: 'Bitola deve estar entre 0.5 e 1000 mm²', type: 'range' });
    if (length <= 0 || length > 500000) validationErrors.push({ field: 'megger.length', message: 'Comprimento deve estar entre 1 m e 500 km', type: 'range' });
    if (temperature < -20 || temperature > 80) validationErrors.push({ field: 'megger.temperature', message: 'Temperatura deve estar entre -20 e 80 °C', type: 'range' });
    if (humidity < 0 || humidity > 100) validationErrors.push({ field: 'megger.humidity', message: 'Umidade deve estar entre 0 e 100%', type: 'range' });
  }

  if (context.cable) {
    const { power, voltage, powerFactor, distance, voltageDropPercent } = context.cable.input;
    if (power <= 0 || power > 10000000) validationErrors.push({ field: 'cable.power', message: 'Potência deve estar entre 1 W e 10 MW', type: 'range' });
    if (voltage < 24 || voltage > 1000) validationErrors.push({ field: 'cable.voltage', message: 'Tensão deve estar entre 24 e 1000 V', type: 'range' });
    if (powerFactor <= 0 || powerFactor > 1) validationErrors.push({ field: 'cable.powerFactor', message: 'Fator de potência deve estar entre 0 e 1', type: 'range' });
    if (distance <= 0 || distance > 10000) validationErrors.push({ field: 'cable.distance', message: 'Distância deve estar entre 1 m e 10 km', type: 'range' });
    if (voltageDropPercent <= 0 || voltageDropPercent > 10) validationErrors.push({ field: 'cable.voltageDropPercent', message: 'Queda admitida deve estar entre 0.1 e 10%', type: 'range' });
  }

  if (context.breaker?.input.loadCurrent_A && (context.breaker.input.loadCurrent_A <= 0 || context.breaker.input.loadCurrent_A > 1000)) {
    validationErrors.push({ field: 'breaker.loadCurrent', message: 'Corrente de carga deve estar entre 0.1 e 1000 A', type: 'range' });
  }

  return { isValid: validationErrors.length === 0, errors: validationErrors };
}
