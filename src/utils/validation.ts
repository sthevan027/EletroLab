import { TestType, TestResult, TestLimit, EquipmentCategory, ValidationResult, ValidationError } from '../types';

// Funções de classificação de testes
export function classifyMegger(value: number, limits: TestLimit): TestResult {
  if (value >= limits.good) {
    return 'BOM';
  } else if (value >= limits.min) {
    return 'ACEITÁVEL';
  } else {
    return 'REPROVADO';
  }
}

export function classifyHipot(value: number, limits: TestLimit): TestResult {
  if (value >= limits.good) {
    return 'BOM';
  } else if (value >= limits.min) {
    return 'ACEITÁVEL';
  } else {
    return 'REPROVADO';
  }
}

export function classifyTest(testType: TestType, value: number, limits: TestLimit): TestResult {
  switch (testType) {
    case 'megger':
      return classifyMegger(value, limits);
    case 'hipot':
      return classifyHipot(value, limits);
    default:
      return 'REPROVADO';
  }
}

// Funções de geração de valores aleatórios
export function generateRandomMeggerValue(_category: EquipmentCategory): number {
  const random = Math.random();
  
  // Distribuição de probabilidade conforme documentação
  if (random < 0.60) {
    // 60% - BOM: valores entre 500 e 10.000 MΩ
    return Math.random() * (10000 - 500) + 500;
  } else if (random < 0.85) {
    // 25% - ACEITÁVEL: valores entre 50 e 500 MΩ
    return Math.random() * (500 - 50) + 50;
  } else {
    // 15% - REPROVADO: valores entre 0.1 e 50 MΩ
    return Math.random() * (50 - 0.1) + 0.1;
  }
}

export function generateRandomHipotValue(_category: EquipmentCategory): number {
  const random = Math.random();
  
  // Distribuição de probabilidade conforme documentação
  if (random < 0.60) {
    // 60% - BOM: valores entre 2000 e 5000 V
    return Math.random() * (5000 - 2000) + 2000;
  } else if (random < 0.85) {
    // 25% - ACEITÁVEL: valores entre 1000 e 2000 V
    return Math.random() * (2000 - 1000) + 1000;
  } else {
    // 15% - REPROVADO: valores entre 500 e 1000 V
    return Math.random() * (1000 - 500) + 500;
  }
}

export function generateRandomTestValue(testType: TestType, category: EquipmentCategory): number {
  switch (testType) {
    case 'megger':
      return generateRandomMeggerValue(category);
    case 'hipot':
      return generateRandomHipotValue(category);
    default:
      return 0;
  }
}

// Funções de validação
export function validateEquipment(equipment: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (!equipment.tag || equipment.tag.trim().length === 0) {
    errors.push({ field: 'tag', message: 'Tag é obrigatória' });
  }

  if (!equipment.category) {
    errors.push({ field: 'category', message: 'Categoria é obrigatória' });
  }

  if (!equipment.description || equipment.description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Descrição é obrigatória' });
  }

  if (!equipment.location || equipment.location.trim().length === 0) {
    errors.push({ field: 'location', message: 'Localização é obrigatória' });
  }

  if (!equipment.manufacturer || equipment.manufacturer.trim().length === 0) {
    errors.push({ field: 'manufacturer', message: 'Fabricante é obrigatório' });
  }

  if (!equipment.model || equipment.model.trim().length === 0) {
    errors.push({ field: 'model', message: 'Modelo é obrigatório' });
  }

  if (!equipment.serialNumber || equipment.serialNumber.trim().length === 0) {
    errors.push({ field: 'serialNumber', message: 'Número de série é obrigatório' });
  }

  if (!equipment.installationDate) {
    errors.push({ field: 'installationDate', message: 'Data de instalação é obrigatória' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateReport(report: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (!report.number || report.number.trim().length === 0) {
    errors.push({ field: 'number', message: 'Número do relatório é obrigatório' });
  }

  if (!report.date) {
    errors.push({ field: 'date', message: 'Data é obrigatória' });
  }

  if (!report.client || report.client.trim().length === 0) {
    errors.push({ field: 'client', message: 'Cliente é obrigatório' });
  }

  if (!report.location || report.location.trim().length === 0) {
    errors.push({ field: 'location', message: 'Local é obrigatório' });
  }

  if (!report.responsible || report.responsible.trim().length === 0) {
    errors.push({ field: 'responsible', message: 'Responsável é obrigatório' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateTest(test: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (!test.reportId) {
    errors.push({ field: 'reportId', message: 'Relatório é obrigatório' });
  }

  if (!test.equipmentId) {
    errors.push({ field: 'equipmentId', message: 'Equipamento é obrigatório' });
  }

  if (!test.testType) {
    errors.push({ field: 'testType', message: 'Tipo de teste é obrigatório' });
  }

  if (test.value === undefined || test.value === null) {
    errors.push({ field: 'value', message: 'Valor é obrigatório' });
  } else if (typeof test.value !== 'number' || test.value < 0) {
    errors.push({ field: 'value', message: 'Valor deve ser um número positivo' });
  }

  if (!test.performedBy || test.performedBy.trim().length === 0) {
    errors.push({ field: 'performedBy', message: 'Responsável pelo teste é obrigatório' });
  }

  if (!test.performedAt) {
    errors.push({ field: 'performedAt', message: 'Data do teste é obrigatória' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Funções de validação de limites
export function validateTestLimits(limits: TestLimit): ValidationResult {
  const errors: ValidationError[] = [];

  if (limits.min === undefined || limits.min === null) {
    errors.push({ field: 'min', message: 'Limite mínimo é obrigatório' });
  } else if (typeof limits.min !== 'number' || limits.min < 0) {
    errors.push({ field: 'min', message: 'Limite mínimo deve ser um número positivo' });
  }

  if (limits.good === undefined || limits.good === null) {
    errors.push({ field: 'good', message: 'Limite bom é obrigatório' });
  } else if (typeof limits.good !== 'number' || limits.good < 0) {
    errors.push({ field: 'good', message: 'Limite bom deve ser um número positivo' });
  }

  if (limits.min !== undefined && limits.good !== undefined && limits.min >= limits.good) {
    errors.push({ field: 'good', message: 'Limite bom deve ser maior que o limite mínimo' });
  }

  if (!limits.unit || limits.unit.trim().length === 0) {
    errors.push({ field: 'unit', message: 'Unidade é obrigatória' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Funções de formatação
export function formatTestValue(value: number, unit: string): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k${unit}`;
  }
  return `${value.toFixed(1)}${unit}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('pt-BR');
}

// Funções de validação de entrada
export function validateNumericInput(value: string, min: number, max: number): boolean {
  const numValue = parseFloat(value);
  return !isNaN(numValue) && numValue >= min && numValue <= max;
}

export function validateRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}
