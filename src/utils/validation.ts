/**
 * Funções de validação para o EletriLab Ultra-MVP
 */

import { Category, ValidationResult, ValidationError, MultiPhaseConfig } from '../types';
import { parseResistance } from './units';

/**
 * Validação de categoria
 */
export function validateCategory(category: string): ValidationResult {
  const validCategories: Category[] = ['cabo', 'motor', 'bomba', 'trafo', 'outro'];
  
  return {
    isValid: validCategories.includes(category as Category),
    errors: validCategories.includes(category as Category) ? [] : [
      { 
        field: 'category', 
        message: 'Categoria deve ser: cabo, motor, bomba, trafo, outro',
        type: 'required'
      }
    ]
  };
}

/**
 * Validação de tensão
 */
export function validateVoltage(kv: number): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (typeof kv !== 'number' || isNaN(kv)) {
    errors.push({ 
      field: 'kv', 
      message: 'Tensão deve ser um número válido',
      type: 'format'
    });
  } else if (kv < 0.1 || kv > 50) {
    errors.push({ 
      field: 'kv', 
      message: 'Tensão deve estar entre 0.1 e 50 kV',
      type: 'range'
    });
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validação de tag (opcional)
 */
export function validateTag(tag?: string): ValidationResult {
  if (!tag) return { isValid: true, errors: [] };
  
  const errors: ValidationError[] = [];
  if (tag.length > 50) {
    errors.push({ 
      field: 'tag', 
      message: 'Tag deve ter no máximo 50 caracteres',
      type: 'format'
    });
  }
  if (!/^[a-zA-Z0-9\-\_\s]+$/.test(tag)) {
    errors.push({ 
      field: 'tag', 
      message: 'Tag deve conter apenas letras, números, hífens e underscores',
      type: 'format'
    });
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validação de campos opcionais
 */
export function validateOptionalFields(fields: {
  client?: string;
  site?: string;
  operator?: string;
  manufacturer?: string;
  model?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];
  
  Object.entries(fields).forEach(([key, value]) => {
    if (value && value.length > 100) {
      errors.push({ 
        field: key, 
        message: `${key} deve ter no máximo 100 caracteres`,
        type: 'format'
      });
    }
  });
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validação da série de tempos
 */
export function validateTimeSeries(readings: any[]): ValidationResult {
  const expectedTimes = ['00:15', '00:30', '00:45', '01:00'];
  const errors: ValidationError[] = [];
  
  if (readings.length !== 4) {
    errors.push({ 
      field: 'readings', 
      message: 'Deve ter exatamente 4 leituras',
      type: 'format'
    });
  }
  
  readings.forEach((reading, index) => {
    if (reading.time !== expectedTimes[index]) {
      errors.push({ 
        field: 'readings', 
        message: `Tempo ${index + 1} deve ser ${expectedTimes[index]}`,
        type: 'format'
      });
    }
  });
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validação da formatação de resistência
 */
export function validateResistanceFormat(resistance: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (resistance === '0.99 OVRG') {
    return { isValid: true, errors: [] };
  }
  
  const patterns = [
    /^\d+Ω$/,           // 500Ω
    /^\d+\.\d{2}kΩ$/,   // 2.50kΩ
    /^\d+\.\d{2}MΩ$/,   // 15.30MΩ
    /^\d+\.\d{2}GΩ$/,   // 5.23GΩ
    /^\d+\.\d{2}TΩ$/    // 2.15TΩ
  ];
  
  const isValid = patterns.some(pattern => pattern.test(resistance));
  if (!isValid) {
    errors.push({ 
      field: 'resistance', 
      message: 'Formato de resistência inválido. Use: 500Ω, 2.50kΩ, 15.30MΩ, 5.23GΩ, 2.15TΩ ou 0.99 OVRG',
      type: 'format'
    });
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validação de valores de resistência
 */
export function validateResistanceValue(resistance: string, category: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (resistance === '0.99 OVRG') {
    return { isValid: true, errors: [] };
  }
  
  const value = parseResistance(resistance);
  if (value === undefined) {
    errors.push({ 
      field: 'resistance', 
      message: 'Não foi possível interpretar o valor de resistência',
      type: 'format'
    });
    return { isValid: false, errors };
  }
  
  // Validações específicas por categoria
  if (category === 'cabo') {
    const valueG = value / 1e9;
    if (valueG < 5) {
      errors.push({ 
        field: 'resistance', 
        message: 'Para cabos, resistência deve ser ≥ 5 GΩ',
        type: 'range'
      });
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validação da configuração de fases
 */
export function validatePhaseConfiguration(config: MultiPhaseConfig): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validar nomes das fases
  if (!config.phases.names || config.phases.names.length < 2) {
    errors.push({ 
      field: 'phases', 
      message: 'Deve ter pelo menos 2 fases',
      type: 'required'
    });
  }
  
  if (config.phases.names.length > 20) {
    errors.push({ 
      field: 'phases', 
      message: 'Máximo de 20 fases permitido',
      type: 'range'
    });
  }
  
  // Validar nomes únicos
  const uniqueNames = new Set(config.phases.names);
  if (uniqueNames.size !== config.phases.names.length) {
    errors.push({ 
      field: 'phases', 
      message: 'Nomes das fases devem ser únicos',
      type: 'format'
    });
  }
  
  // Validar formato dos nomes
  config.phases.names.forEach((name, index) => {
    if (!/^[A-Za-z0-9]+$/.test(name)) {
      errors.push({ 
        field: 'phases', 
        message: `Nome da fase ${index + 1} deve conter apenas letras e números`,
        type: 'format'
      });
    }
  });
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validação de combinações fase/fase
 */
export function validatePhaseCombinations(
  combinations: string[][], 
  phaseNames: string[]
): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (combinations.length === 0) {
    errors.push({ 
      field: 'combinations', 
      message: 'Deve ter pelo menos uma combinação',
      type: 'required'
    });
  }
  
  // Validar cada combinação
  combinations.forEach((combination, index) => {
    if (combination.length !== 2) {
      errors.push({ 
        field: 'combinations', 
        message: `Combinação ${index + 1} deve ter exatamente 2 fases`,
        type: 'format'
      });
    }
    
    combination.forEach(phase => {
      if (!phaseNames.includes(phase)) {
        errors.push({ 
          field: 'combinations', 
          message: `Fase '${phase}' não existe na configuração`,
          type: 'format'
        });
      }
    });
    
    // Validar que não é a mesma fase
    if (combination[0] === combination[1]) {
      errors.push({ 
        field: 'combinations', 
        message: `Combinação ${index + 1} não pode ter a mesma fase duas vezes`,
        type: 'format'
      });
    }
  });
  
  // Validar combinações únicas
  const uniqueCombinations = new Set(
    combinations.map(c => c.sort().join('/'))
  );
  if (uniqueCombinations.size !== combinations.length) {
    errors.push({ 
      field: 'combinations', 
      message: 'Combinações devem ser únicas',
      type: 'format'
    });
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validação do nome da massa
 */
export function validateGroundName(groundName: string, phaseNames: string[]): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!groundName || groundName.trim() === '') {
    errors.push({ 
      field: 'groundName', 
      message: 'Nome da massa é obrigatório',
      type: 'required'
    });
  }
  
  if (groundName.length > 10) {
    errors.push({ 
      field: 'groundName', 
      message: 'Nome da massa deve ter no máximo 10 caracteres',
      type: 'range'
    });
  }
  
  if (!/^[A-Za-z0-9]+$/.test(groundName)) {
    errors.push({ 
      field: 'groundName', 
      message: 'Nome da massa deve conter apenas letras e números',
      type: 'format'
    });
  }
  
  if (phaseNames.includes(groundName)) {
    errors.push({ 
      field: 'groundName', 
      message: 'Nome da massa não pode ser igual ao nome de uma fase',
      type: 'format'
    });
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validação de correlações entre fases
 */
export function validatePhaseCorrelations(
  baseValues: number[], 
  phaseToPhaseValues: number[][],
  threshold: number = 0.8
): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validar que valores fase/fase são correlacionados com valores base
  phaseToPhaseValues.forEach((values, index) => {
    const phase1 = index % baseValues.length;
    const phase2 = Math.floor(index / baseValues.length);
    
    if (phase1 !== phase2) {
      const expectedCorrelation = (baseValues[phase1] + baseValues[phase2]) / 2;
      const actualValue = values[0]; // Primeira leitura
      
      const correlation = Math.abs(actualValue - expectedCorrelation) / expectedCorrelation;
      if (correlation > (1 - threshold)) {
        errors.push({ 
          field: 'correlations', 
          message: `Correlação entre fases ${phase1 + 1} e ${phase2 + 1} está fora do esperado`,
          type: 'correlation'
        });
      }
    }
  });
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validação de consistência fase/massa
 */
export function validatePhaseToGroundConsistency(
  baseValues: number[],
  phaseToGroundValues: number[],
  threshold: number = 0.7
): ValidationResult {
  const errors: ValidationError[] = [];
  
  phaseToGroundValues.forEach((value, index) => {
    const baseValue = baseValues[index];
    const expectedValue = baseValue * 0.8; // Fase/massa tipicamente 80% da fase
    
    const consistency = Math.abs(value - expectedValue) / expectedValue;
    if (consistency > (1 - threshold)) {
      errors.push({ 
        field: 'phaseToGround', 
        message: `Valor fase/massa ${index + 1} está inconsistente com valor base`,
        type: 'consistency'
      });
    }
  });
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validação de confiança da IA
 */
export function validateAIConfidence(
  confidence: number, 
  threshold: number = 0.7
): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (confidence < threshold) {
    errors.push({ 
      field: 'aiConfidence', 
      message: `Confiança da IA (${confidence.toFixed(2)}) está abaixo do threshold (${threshold})`,
      type: 'ai_confidence'
    });
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validação para exportação PDF
 */
export function validatePDFExport(report: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!report) {
    errors.push({ 
      field: 'report', 
      message: 'Relatório é obrigatório para exportação',
      type: 'required'
    });
  }
  
  // Validar que tem dados para exportar
  if ('readings' in report && (!report.readings || report.readings.length === 0)) {
    errors.push({ 
      field: 'readings', 
      message: 'Relatório deve ter leituras para exportar',
      type: 'required'
    });
  }
  
  if ('reports' in report && (!report.reports || report.reports.length === 0)) {
    errors.push({ 
      field: 'reports', 
      message: 'Relatório multi-fase deve ter sub-relatórios',
      type: 'required'
    });
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validação para exportação CSV
 */
export function validateCSVExport(report: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!report) {
    errors.push({ 
      field: 'report', 
      message: 'Relatório é obrigatório para exportação',
      type: 'required'
    });
  }
  
  // Validar que tem dados estruturados
  if ('readings' in report && (!report.readings || report.readings.length === 0)) {
    errors.push({ 
      field: 'readings', 
      message: 'Relatório deve ter leituras para exportar',
      type: 'required'
    });
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validação para salvamento
 */
export function validateForSaving(report: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validar campos obrigatórios para salvamento
  if ('category' in report && !report.category) {
    errors.push({ 
      field: 'category', 
      message: 'Categoria é obrigatória para salvar',
      type: 'required'
    });
  }
  
  if ('kv' in report && (!report.kv || report.kv <= 0)) {
    errors.push({ 
      field: 'kv', 
      message: 'Tensão deve ser maior que zero para salvar',
      type: 'range'
    });
  }
  
  // Validar que tem dados válidos
  if ('readings' in report && (!report.readings || report.readings.length === 0)) {
    errors.push({ 
      field: 'readings', 
      message: 'Relatório deve ter leituras para salvar',
      type: 'required'
    });
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validação de número de relatório
 */
export function validateReportNumber(number: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!number || number.trim() === '') {
    errors.push({ 
      field: 'number', 
      message: 'Número do relatório é obrigatório',
      type: 'required'
    });
  }
  
  if (number.length > 20) {
    errors.push({ 
      field: 'number', 
      message: 'Número do relatório deve ter no máximo 20 caracteres',
      type: 'range'
    });
  }
  
  if (!/^[A-Za-z0-9\-\_]+$/.test(number)) {
    errors.push({ 
      field: 'number', 
      message: 'Número do relatório deve conter apenas letras, números, hífens e underscores',
      type: 'format'
    });
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validação do limite OVRG
 */
export function validateOVRGLimit(limit: number): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (typeof limit !== 'number' || isNaN(limit)) {
    errors.push({ 
      field: 'ovrgLimit', 
      message: 'Limite OVRG deve ser um número válido',
      type: 'format'
    });
  } else if (limit < 1 || limit > 100) {
    errors.push({ 
      field: 'ovrgLimit', 
      message: 'Limite OVRG deve estar entre 1 e 100 TΩ',
      type: 'range'
    });
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Combina múltiplos resultados de validação
 */
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allValid = results.every(result => result.isValid);
  
  results.forEach(result => {
    allErrors.push(...result.errors);
  });
  
  return {
    isValid: allValid,
    errors: allErrors
  };
}

/**
 * Filtra erros por tipo
 */
export function filterErrorsByType(errors: ValidationError[], type: string): ValidationError[] {
  return errors.filter(error => error.type === type);
}

/**
 * Filtra erros por severidade
 */
export function filterErrorsBySeverity(errors: ValidationError[], severity: string): ValidationError[] {
  return errors.filter(error => error.severity === severity);
}

/**
 * Validação de relatório IR completo
 */
export function validateIRReport(report: Partial<any>): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validar categoria
  if (!report.category) {
    errors.push({ 
      field: 'category', 
      message: 'Categoria é obrigatória',
      type: 'required'
    });
  } else {
    const categoryValidation = validateCategory(report.category);
    errors.push(...categoryValidation.errors);
  }
  
  // Validar tensão
  if (report.kv !== undefined) {
    const voltageValidation = validateVoltage(report.kv);
    errors.push(...voltageValidation.errors);
  }
  
  // Validar tag se fornecida
  if (report.tag) {
    const tagValidation = validateTag(report.tag);
    errors.push(...tagValidation.errors);
  }
  
  return { isValid: errors.length === 0, errors };
}

// === Validações Físicas do Cabo ===
export function validatePhysicalCableInputs(inputs: {
  cableLength?: number;
  cableGauge?: number;
  insulationMaterial?: 'XLPE' | 'EPR' | 'PVC' | 'outro' | string;
  conductorDiameter?: number;
  insulationThickness?: number;
}): ValidationResult {
  const errors: ValidationError[] = [];

  // Comprimento: 1 m a 100 km
  if (inputs.cableLength !== undefined) {
    const L = Number(inputs.cableLength);
    if (isNaN(L) || L < 1 || L > 100_000) {
      errors.push({ field: 'cableLength', message: 'Comprimento deve estar entre 1 m e 100.000 m', type: 'range' });
    }
  }

  // Bitola: 0.5 a 500 mm²
  if (inputs.cableGauge !== undefined) {
    const G = Number(inputs.cableGauge);
    if (isNaN(G) || G < 0.5 || G > 500) {
      errors.push({ field: 'cableGauge', message: 'Bitola deve estar entre 0.5 e 500 mm²', type: 'range' });
    }
  }

  // Material isolante: enum válido
  if (inputs.insulationMaterial !== undefined) {
    const mat = String(inputs.insulationMaterial).toUpperCase();
    const valid = ['XLPE', 'EPR', 'PVC', 'OUTRO'];
    if (!valid.includes(mat)) {
      errors.push({ field: 'insulationMaterial', message: 'Material deve ser XLPE, EPR, PVC ou outro', type: 'format' });
    }
  }

  // Diâmetros informados: D > d
  if (inputs.conductorDiameter !== undefined || inputs.insulationThickness !== undefined) {
    const d = Number(inputs.conductorDiameter || 0);
    const t = Number(inputs.insulationThickness || 0);
    if (d > 0 && t > 0) {
      const D = d + 2 * t;
      if (!(D > d)) {
        errors.push({ field: 'diameters', message: 'Condição geométrica inválida: D deve ser maior que d', type: 'geometry' });
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

export function isPhysicalInputValid(inputs: Parameters<typeof validatePhysicalCableInputs>[0]): boolean {
  return validatePhysicalCableInputs(inputs).isValid;
}

// === Helpers de compatibilidade ===
export function validateEquipment(e: import('../types').Equipment) {
  // Faça validação real depois; por ora só garante assinatura
  return { ok: true as const, errors: [] as string[] };
}

// Compatibilidade: exportar validateIRReport como validateReport
export { validateIRReport as validateReport };

// Pequenos utilitários que as páginas antigas esperam:
export function validateTest() {
  return { ok: true as const, errors: [] as string[] };
}

export function generateRandomTestValue(min = 1, max = 10) {
  return Math.random() * (max - min) + min;
}

export function classifyTest(value: number) {
  // regra placeholder: > 1 MΩ OK
  return value >= 1_000_000 ? 'OK' : 'ALERTA';
}

// Formatações de compatibilidade
export function formatDate(date: string | Date): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}

export function formatTestValue(value: number, unit: string): string {
  return `${value.toFixed(2)} ${unit}`;
}
