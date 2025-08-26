# Regras de Validação - EletriLab Ultra-MVP

## 📋 Visão Geral

Este documento define as regras de validação para o sistema EletriLab Ultra-MVP, focado na geração rápida de relatórios Megger/IR no formato "cupom".

## 🎯 Princípios de Validação

### Flexibilidade
- **Campos Obrigatórios**: Apenas categoria e kV são obrigatórios
- **Campos Opcionais**: Não bloqueiam a geração de relatórios
- **Validação Suave**: Avisos em vez de erros bloqueantes

### Precisão
- **Escala Automática**: Formatação inteligente de resistência
- **OVRG**: Tratamento especial para valores acima do limite
- **DAI**: Cálculo automático com validação de OVRG

## 🔧 Validações de Entrada

### Campos Obrigatórios

#### Categoria
```typescript
type Category = 'cabo' | 'motor' | 'bomba' | 'trafo' | 'outro';

// Validação
function validateCategory(category: string): boolean {
  const validCategories = ['cabo', 'motor', 'bomba', 'trafo', 'outro'];
  return validCategories.includes(category);
}
```

#### Tensão (kV)
```typescript
// Validação
function validateKV(kv: number): boolean {
  return kv >= 0.1 && kv <= 50.0;
}

// Valor padrão
const DEFAULT_KV = 1.00;
```

### Campos Opcionais

#### Tag
```typescript
// Validação (se preenchido)
function validateTag(tag: string): boolean {
  return tag.length <= 50; // Máximo 50 caracteres
}
```

#### Cliente
```typescript
// Validação (se preenchido)
function validateClient(client: string): boolean {
  return client.length <= 100; // Máximo 100 caracteres
}
```

#### Site
```typescript
// Validação (se preenchido)
function validateSite(site: string): boolean {
  return site.length <= 100; // Máximo 100 caracteres
}
```

#### Operador
```typescript
// Validação (se preenchido)
function validateOperator(operator: string): boolean {
  return operator.length <= 50; // Máximo 50 caracteres
}
```

#### Fabricante
```typescript
// Validação (se preenchido)
function validateManufacturer(manufacturer: string): boolean {
  return manufacturer.length <= 50; // Máximo 50 caracteres
}
```

#### Modelo
```typescript
// Validação (se preenchido)
function validateModel(model: string): boolean {
  return model.length <= 50; // Máximo 50 caracteres
}
```

## 📊 Validações de Geração

### Série de Tempos
```typescript
// Série fixa obrigatória
const REQUIRED_TIMES = ['00:15', '00:30', '00:45', '01:00'];

function validateTimeSeries(readings: Reading[]): boolean {
  if (readings.length !== 4) return false;
  
  return readings.every((reading, index) => 
    reading.time === REQUIRED_TIMES[index]
  );
}
```

### Formatação de Resistência
```typescript
// Escala automática
function formatResistance(valueOhms: number, limitTOhms = 5): string {
  const limit = limitTOhms * 1e12; // 5 TΩ
  
  // OVRG
  if (valueOhms >= limit) return "0.99 OVRG";
  
  // Escala automática
  if (valueOhms < 1e3)  return `${valueOhms.toFixed(0)}Ω`;
  if (valueOhms < 1e6)  return `${(valueOhms/1e3).toFixed(2)}kΩ`;
  if (valueOhms < 1e9)  return `${(valueOhms/1e6).toFixed(2)}MΩ`;
  if (valueOhms < 1e12) return `${(valueOhms/1e9).toFixed(2)}GΩ`;
  return `${(valueOhms/1e12).toFixed(2)}TΩ`;
}
```

### Validação de Resistência
```typescript
function validateResistance(resistance: string): boolean {
  // Padrões válidos
  const patterns = [
    /^\d+(\.\d+)?Ω$/,           // 123Ω ou 123.45Ω
    /^\d+(\.\d+)?kΩ$/,          // 123kΩ ou 123.45kΩ
    /^\d+(\.\d+)?MΩ$/,          // 123MΩ ou 123.45MΩ
    /^\d+(\.\d+)?GΩ$/,          // 123GΩ ou 123.45GΩ
    /^\d+(\.\d+)?TΩ$/,          // 123TΩ ou 123.45TΩ
    /^0\.99 OVRG$/              // 0.99 OVRG
  ];
  
  return patterns.some(pattern => pattern.test(resistance));
}
```

## 🔍 Cálculo do DAI

### Regras do DAI
```typescript
function calculateDAI(readings: Reading[]): string {
  // Encontrar R30 e R60
  const r30Reading = readings.find(r => r.time === '00:30');
  const r60Reading = readings.find(r => r.time === '01:00');
  
  if (!r30Reading || !r60Reading) return "Undefined";
  
  // Verificar se há OVRG
  if (r30Reading.resistance === "0.99 OVRG" || 
      r60Reading.resistance === "0.99 OVRG") {
    return "Undefined";
  }
  
  // Converter para valores numéricos
  const r30 = parseResistance(r30Reading.resistance);
  const r60 = parseResistance(r60Reading.resistance);
  
  if (r30 === null || r60 === null) return "Undefined";
  
  // Calcular DAI
  const dai = r60 / r30;
  return dai.toFixed(2);
}
```

### Conversão de Resistência
```typescript
function parseResistance(resistance: string): number | null {
  if (resistance === "0.99 OVRG") return null;
  
  const match = resistance.match(/^(\d+(?:\.\d+)?)(Ω|kΩ|MΩ|GΩ|TΩ)$/);
  if (!match) return null;
  
  const value = parseFloat(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'Ω': return value;
    case 'kΩ': return value * 1e3;
    case 'MΩ': return value * 1e6;
    case 'GΩ': return value * 1e9;
    case 'TΩ': return value * 1e12;
    default: return null;
  }
}
```

## 🎯 Perfis por Categoria

### Validação de Perfis
```typescript
interface CategoryProfile {
  baseG: [number, number];   // Faixa inicial em GΩ
  growth: [number, number];  // Multiplicador por passo
  minGoodG: number;          // Mínimo desejado em GΩ
}

function validateProfile(profile: CategoryProfile): boolean {
  // Validar baseG
  if (profile.baseG[0] < 0 || profile.baseG[1] < profile.baseG[0]) {
    return false;
  }
  
  // Validar growth
  if (profile.growth[0] < 1 || profile.growth[1] < profile.growth[0]) {
    return false;
  }
  
  // Validar minGoodG
  if (profile.minGoodG < 0) return false;
  
  return true;
}
```

### Regras Específicas por Categoria

#### Cabo (fase-fase)
```typescript
// Cabos devem sempre gerar >= 5 GΩ
function validateCaboReadings(readings: Reading[]): boolean {
  return readings.every(reading => {
    const value = parseResistance(reading.resistance);
    return value === null || value >= 5e9; // 5 GΩ
  });
}
```

## 📈 Validações de Exportação

### PDF
```typescript
function validatePDFExport(report: IRReport): boolean {
  // Verificar se o relatório tem dados mínimos
  if (!report.category || !report.kv) return false;
  if (!report.readings || report.readings.length !== 4) return false;
  
  // Verificar se todos os readings são válidos
  return report.readings.every(reading => 
    validateResistance(reading.resistance)
  );
}
```

### CSV
```typescript
function validateCSVExport(report: IRReport): boolean {
  // Mesmas validações do PDF
  return validatePDFExport(report);
}
```

## 🗄️ Validações de Banco de Dados

### Salvamento
```typescript
function validateForSave(report: IRReport): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validações obrigatórias
  if (!validateCategory(report.category)) {
    errors.push('Categoria inválida');
  }
  
  if (!validateKV(report.kv)) {
    errors.push('Tensão (kV) deve estar entre 0.1 e 50.0');
  }
  
  if (!validateTimeSeries(report.readings)) {
    errors.push('Série de tempos inválida');
  }
  
  // Validações de readings
  report.readings.forEach((reading, index) => {
    if (!validateResistance(reading.resistance)) {
      errors.push(`Resistência ${index + 1} inválida`);
    }
  });
  
  // Avisos para campos opcionais
  if (report.tag && !validateTag(report.tag)) {
    warnings.push('Tag muito longa (máximo 50 caracteres)');
  }
  
  if (report.client && !validateClient(report.client)) {
    warnings.push('Cliente muito longo (máximo 100 caracteres)');
  }
  
  return { errors, warnings, isValid: errors.length === 0 };
}
```

### Número de Relatório
```typescript
function validateReportNumber(number: string): boolean {
  // Formato: REL-YYYY-XXXX (ex: REL-2024-0001)
  const pattern = /^REL-\d{4}-\d{4}$/;
  return pattern.test(number);
}
```

## 🔧 Validações de Parâmetros

### Limite OVRG
```typescript
function validateOVRGLimit(limit: number): boolean {
  return limit > 0 && limit <= 100; // Entre 0 e 100 TΩ
}
```

### Perfis de Categoria
```typescript
function validateCategoryProfiles(profiles: Record<string, CategoryProfile>): boolean {
  const requiredCategories = ['cabo', 'motor', 'bomba', 'trafo', 'outro'];
  
  // Verificar se todas as categorias estão presentes
  for (const category of requiredCategories) {
    if (!profiles[category]) return false;
    if (!validateProfile(profiles[category])) return false;
  }
  
  return true;
}
```

## 📊 Validações de Estatísticas

### KPIs
```typescript
function validateKPIs(stats: KPIs): boolean {
  // Total deve ser >= 0
  if (stats.total < 0) return false;
  
  // Percentuais devem somar aproximadamente 100%
  const totalPercent = stats.percentBom + stats.percentAceitavel + stats.percentReprovado;
  if (Math.abs(totalPercent - 100) > 1) return false; // Tolerância de 1%
  
  return true;
}
```

## 🚨 Tratamento de Erros

### Tipos de Erro
```typescript
enum ValidationErrorType {
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  INVALID_VALUE = 'INVALID_VALUE'
}

interface ValidationError {
  type: ValidationErrorType;
  field: string;
  message: string;
  value?: any;
}
```

### Mensagens de Erro
```typescript
const ERROR_MESSAGES = {
  REQUIRED_CATEGORY: 'Categoria é obrigatória',
  REQUIRED_KV: 'Tensão (kV) é obrigatória',
  INVALID_KV: 'Tensão deve estar entre 0.1 e 50.0 kV',
  INVALID_CATEGORY: 'Categoria inválida',
  INVALID_RESISTANCE: 'Formato de resistência inválido',
  INVALID_TIME_SERIES: 'Série de tempos inválida',
  OVRG_LIMIT_EXCEEDED: 'Valor excede limite OVRG'
};
```

## ✅ Testes de Validação

### Cenários de Teste
```typescript
describe('Validation Rules', () => {
  test('should validate valid category', () => {
    expect(validateCategory('cabo')).toBe(true);
    expect(validateCategory('invalid')).toBe(false);
  });
  
  test('should validate valid KV', () => {
    expect(validateKV(1.00)).toBe(true);
    expect(validateKV(0.05)).toBe(false);
    expect(validateKV(100)).toBe(false);
  });
  
  test('should format resistance correctly', () => {
    expect(formatResistance(500)).toBe('500Ω');
    expect(formatResistance(1500)).toBe('1.50kΩ');
    expect(formatResistance(1.5e9)).toBe('1.50GΩ');
    expect(formatResistance(6e12)).toBe('0.99 OVRG');
  });
  
  test('should calculate DAI correctly', () => {
    const readings = [
      { time: '00:15', kv: '1.00', resistance: '1.00GΩ' },
      { time: '00:30', kv: '1.00', resistance: '1.10GΩ' },
      { time: '00:45', kv: '1.00', resistance: '1.20GΩ' },
      { time: '01:00', kv: '1.00', resistance: '1.30GΩ' }
    ];
    
    expect(calculateDAI(readings)).toBe('1.18');
  });
});
```

---

**Nota**: Estas regras de validação garantem a integridade dos dados mantendo a flexibilidade necessária para o uso rápido do sistema.
