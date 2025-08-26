# Regras de Validação - EletriLab Ultra-MVP com IA

## Visão Geral

O sistema EletriLab Ultra-MVP com IA implementa validações flexíveis e inteligentes para geração de relatórios Megger/IR, incluindo suporte a geração multi-fase e validação com correlações.

## Princípios de Validação

### Flexibilidade
- **Campos opcionais**: Apenas `category` e `kV` são obrigatórios
- **Geração sem bloqueio**: Campos como fabricante/modelo não impedem geração
- **Validação progressiva**: Validações aplicadas conforme necessário

### Precisão
- **Escala automática**: Formatação correta de resistência (Ω → TΩ)
- **OVRG**: Tratamento especial para valores ≥ 5 TΩ
- **DAI**: Cálculo preciso ou "Undefined" quando apropriado

### Inteligência
- **Correlações**: Validação de relacionamentos entre fases
- **Consistência**: Verificação de valores fase/massa
- **Aprendizado**: Validação baseada em histórico

## Validações de Entrada

### Categoria
```typescript
// Validação de categoria
function validateCategory(category: string): ValidationResult {
  const validCategories = ['cabo', 'motor', 'bomba', 'trafo', 'outro'];
  return {
    isValid: validCategories.includes(category),
    errors: validCategories.includes(category) ? [] : [
      { field: 'category', message: 'Categoria deve ser: cabo, motor, bomba, trafo, outro' }
    ]
  };
}
```

### Tensão (kV)
```typescript
// Validação de tensão
function validateVoltage(kv: number): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (typeof kv !== 'number' || isNaN(kv)) {
    errors.push({ field: 'kv', message: 'Tensão deve ser um número válido' });
  } else if (kv < 0.1 || kv > 50) {
    errors.push({ field: 'kv', message: 'Tensão deve estar entre 0.1 e 50 kV' });
  }
  
  return { isValid: errors.length === 0, errors };
}
```

### Tag (Opcional)
```typescript
// Validação de tag
function validateTag(tag?: string): ValidationResult {
  if (!tag) return { isValid: true, errors: [] };
  
  const errors: ValidationError[] = [];
  if (tag.length > 50) {
    errors.push({ field: 'tag', message: 'Tag deve ter no máximo 50 caracteres' });
  }
  if (!/^[a-zA-Z0-9\-\_\s]+$/.test(tag)) {
    errors.push({ field: 'tag', message: 'Tag deve conter apenas letras, números, hífens e underscores' });
  }
  
  return { isValid: errors.length === 0, errors };
}
```

### Campos Opcionais
```typescript
// Validação de campos opcionais
function validateOptionalFields(fields: {
  client?: string;
  site?: string;
  operator?: string;
  manufacturer?: string;
  model?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validações de comprimento
  Object.entries(fields).forEach(([key, value]) => {
    if (value && value.length > 100) {
      errors.push({ field: key, message: `${key} deve ter no máximo 100 caracteres` });
    }
  });
  
  return { isValid: errors.length === 0, errors };
}
```

## Validações de Geração

### Série de Tempos
```typescript
// Validação da série de tempos fixa
function validateTimeSeries(readings: any[]): ValidationResult {
  const expectedTimes = ['00:15', '00:30', '00:45', '01:00'];
  const errors: ValidationError[] = [];
  
  if (readings.length !== 4) {
    errors.push({ field: 'readings', message: 'Deve ter exatamente 4 leituras' });
  }
  
  readings.forEach((reading, index) => {
    if (reading.time !== expectedTimes[index]) {
      errors.push({ 
        field: 'readings', 
        message: `Tempo ${index + 1} deve ser ${expectedTimes[index]}` 
      });
    }
  });
  
  return { isValid: errors.length === 0, errors };
}
```

### Formatação de Resistência
```typescript
// Validação da formatação de resistência
function validateResistanceFormat(resistance: string): ValidationResult {
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
      message: 'Formato de resistência inválido. Use: 500Ω, 2.50kΩ, 15.30MΩ, 5.23GΩ, 2.15TΩ ou 0.99 OVRG' 
    });
  }
  
  return { isValid: errors.length === 0, errors };
}
```

### Validação de Resistência
```typescript
// Validação de valores de resistência
function validateResistanceValue(resistance: string, category: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (resistance === '0.99 OVRG') {
    return { isValid: true, errors: [] };
  }
  
  const value = parseResistance(resistance);
  if (value === undefined) {
    errors.push({ field: 'resistance', message: 'Não foi possível interpretar o valor de resistência' });
    return { isValid: false, errors };
  }
  
  // Validações específicas por categoria
  if (category === 'cabo') {
    const valueG = value / 1e9;
    if (valueG < 5) {
      errors.push({ 
        field: 'resistance', 
        message: 'Para cabos, resistência deve ser ≥ 5 GΩ' 
      });
    }
  }
  
  return { isValid: errors.length === 0, errors };
}
```

## Cálculo do DAI

### Regras do DAI
```typescript
// Cálculo e validação do DAI
function calculateAndValidateDAI(readings: any[]): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (readings.length < 4) {
    errors.push({ field: 'dai', message: 'Precisa de 4 leituras para calcular DAI' });
    return { isValid: false, errors };
  }
  
  const r30 = parseResistance(readings[1].resistance); // 00:30
  const r60 = parseResistance(readings[3].resistance); // 01:00
  
  let dai: string;
  if (r30 === undefined || r60 === undefined) {
    dai = 'Undefined';
  } else if (r30 === 0) {
    dai = 'Undefined';
    errors.push({ field: 'dai', message: 'R30 não pode ser zero' });
  } else {
    dai = (r60 / r30).toFixed(2);
  }
  
  return { 
    isValid: errors.length === 0, 
    errors,
    value: dai 
  };
}
```

### Conversão de Resistência
```typescript
// Função para converter resistência formatada para número
function parseResistance(resistance: string): number | undefined {
  if (resistance.includes('OVRG')) return undefined;
  
  const patterns = [
    { regex: /^(\d+)Ω$/, multiplier: 1 },
    { regex: /^(\d+\.\d{2})kΩ$/, multiplier: 1e3 },
    { regex: /^(\d+\.\d{2})MΩ$/, multiplier: 1e6 },
    { regex: /^(\d+\.\d{2})GΩ$/, multiplier: 1e9 },
    { regex: /^(\d+\.\d{2})TΩ$/, multiplier: 1e12 }
  ];
  
  for (const pattern of patterns) {
    const match = resistance.match(pattern.regex);
    if (match) {
      return parseFloat(match[1]) * pattern.multiplier;
    }
  }
  
  return undefined;
}
```

## Validações Multi-Fase

### Configuração de Fases
```typescript
// Validação da configuração de fases
function validatePhaseConfiguration(config: MultiPhaseConfig): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validar nomes das fases
  if (!config.phases.names || config.phases.names.length < 2) {
    errors.push({ field: 'phases', message: 'Deve ter pelo menos 2 fases' });
  }
  
  if (config.phases.names.length > 20) {
    errors.push({ field: 'phases', message: 'Máximo de 20 fases permitido' });
  }
  
  // Validar nomes únicos
  const uniqueNames = new Set(config.phases.names);
  if (uniqueNames.size !== config.phases.names.length) {
    errors.push({ field: 'phases', message: 'Nomes das fases devem ser únicos' });
  }
  
  // Validar formato dos nomes
  config.phases.names.forEach((name, index) => {
    if (!/^[A-Za-z0-9]+$/.test(name)) {
      errors.push({ 
        field: 'phases', 
        message: `Nome da fase ${index + 1} deve conter apenas letras e números` 
      });
    }
  });
  
  return { isValid: errors.length === 0, errors };
}
```

### Combinações Fase/Fase
```typescript
// Validação de combinações fase/fase
function validatePhaseCombinations(
  combinations: string[][], 
  phaseNames: string[]
): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (combinations.length === 0) {
    errors.push({ field: 'combinations', message: 'Deve ter pelo menos uma combinação' });
  }
  
  // Validar cada combinação
  combinations.forEach((combination, index) => {
    if (combination.length !== 2) {
      errors.push({ 
        field: 'combinations', 
        message: `Combinação ${index + 1} deve ter exatamente 2 fases` 
      });
    }
    
    combination.forEach(phase => {
      if (!phaseNames.includes(phase)) {
        errors.push({ 
          field: 'combinations', 
          message: `Fase '${phase}' não existe na configuração` 
        });
      }
    });
    
    // Validar que não é a mesma fase
    if (combination[0] === combination[1]) {
      errors.push({ 
        field: 'combinations', 
        message: `Combinação ${index + 1} não pode ter a mesma fase duas vezes` 
      });
    }
  });
  
  // Validar combinações únicas
  const uniqueCombinations = new Set(
    combinations.map(c => c.sort().join('/'))
  );
  if (uniqueCombinations.size !== combinations.length) {
    errors.push({ field: 'combinations', message: 'Combinações devem ser únicas' });
  }
  
  return { isValid: errors.length === 0, errors };
}
```

### Nome da Massa
```typescript
// Validação do nome da massa
function validateGroundName(groundName: string, phaseNames: string[]): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!groundName || groundName.trim() === '') {
    errors.push({ field: 'groundName', message: 'Nome da massa é obrigatório' });
  }
  
  if (groundName.length > 10) {
    errors.push({ field: 'groundName', message: 'Nome da massa deve ter no máximo 10 caracteres' });
  }
  
  if (!/^[A-Za-z0-9]+$/.test(groundName)) {
    errors.push({ field: 'groundName', message: 'Nome da massa deve conter apenas letras e números' });
  }
  
  if (phaseNames.includes(groundName)) {
    errors.push({ field: 'groundName', message: 'Nome da massa não pode ser igual ao nome de uma fase' });
  }
  
  return { isValid: errors.length === 0, errors };
}
```

## Validações de IA

### Correlações entre Fases
```typescript
// Validação de correlações entre fases
function validatePhaseCorrelations(
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
          message: `Correlação entre fases ${phase1 + 1} e ${phase2 + 1} está fora do esperado` 
        });
      }
    }
  });
  
  return { isValid: errors.length === 0, errors };
}
```

### Consistência Fase/Massa
```typescript
// Validação de consistência fase/massa
function validatePhaseToGroundConsistency(
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
        message: `Valor fase/massa ${index + 1} está inconsistente com valor base` 
      });
    }
  });
  
  return { isValid: errors.length === 0, errors };
}
```

### Confiança da IA
```typescript
// Validação de confiança da IA
function validateAIConfidence(
  confidence: number, 
  threshold: number = 0.7
): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (confidence < threshold) {
    errors.push({ 
      field: 'aiConfidence', 
      message: `Confiança da IA (${confidence.toFixed(2)}) está abaixo do threshold (${threshold})` 
    });
  }
  
  return { isValid: errors.length === 0, errors };
}
```

## Validações de Exportação

### PDF
```typescript
// Validação para exportação PDF
function validatePDFExport(report: IRReport | MultiPhaseReport): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!report) {
    errors.push({ field: 'report', message: 'Relatório é obrigatório para exportação' });
  }
  
  // Validar que tem dados para exportar
  if ('readings' in report && (!report.readings || report.readings.length === 0)) {
    errors.push({ field: 'readings', message: 'Relatório deve ter leituras para exportar' });
  }
  
  if ('reports' in report && (!report.reports || report.reports.length === 0)) {
    errors.push({ field: 'reports', message: 'Relatório multi-fase deve ter sub-relatórios' });
  }
  
  return { isValid: errors.length === 0, errors };
}
```

### CSV
```typescript
// Validação para exportação CSV
function validateCSVExport(report: IRReport | MultiPhaseReport): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!report) {
    errors.push({ field: 'report', message: 'Relatório é obrigatório para exportação' });
  }
  
  // Validar que tem dados estruturados
  if ('readings' in report && (!report.readings || report.readings.length === 0)) {
    errors.push({ field: 'readings', message: 'Relatório deve ter leituras para exportar' });
  }
  
  return { isValid: errors.length === 0, errors };
}
```

## Validações de Banco de Dados

### Salvamento
```typescript
// Validação para salvamento
function validateForSaving(report: IRReport | MultiPhaseReport): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validar campos obrigatórios para salvamento
  if ('category' in report && !report.category) {
    errors.push({ field: 'category', message: 'Categoria é obrigatória para salvar' });
  }
  
  if ('kv' in report && (!report.kv || report.kv <= 0)) {
    errors.push({ field: 'kv', message: 'Tensão deve ser maior que zero para salvar' });
  }
  
  // Validar que tem dados válidos
  if ('readings' in report && (!report.readings || report.readings.length === 0)) {
    errors.push({ field: 'readings', message: 'Relatório deve ter leituras para salvar' });
  }
  
  return { isValid: errors.length === 0, errors };
}
```

### Número de Relatório
```typescript
// Validação de número de relatório
function validateReportNumber(number: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!number || number.trim() === '') {
    errors.push({ field: 'number', message: 'Número do relatório é obrigatório' });
  }
  
  if (number.length > 20) {
    errors.push({ field: 'number', message: 'Número do relatório deve ter no máximo 20 caracteres' });
  }
  
  if (!/^[A-Za-z0-9\-\_]+$/.test(number)) {
    errors.push({ field: 'number', message: 'Número do relatório deve conter apenas letras, números, hífens e underscores' });
  }
  
  return { isValid: errors.length === 0, errors };
}
```

## Validações de Parâmetros

### Limite OVRG
```typescript
// Validação do limite OVRG
function validateOVRGLimit(limit: number): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (typeof limit !== 'number' || isNaN(limit)) {
    errors.push({ field: 'ovrgLimit', message: 'Limite OVRG deve ser um número válido' });
  } else if (limit < 1 || limit > 100) {
    errors.push({ field: 'ovrgLimit', message: 'Limite OVRG deve estar entre 1 e 100 TΩ' });
  }
  
  return { isValid: errors.length === 0, errors };
}
```

### Perfis de Categoria
```typescript
// Validação de perfis de categoria
function validateCategoryProfile(profile: CategoryProfile): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validar baseG
  if (!Array.isArray(profile.baseG) || profile.baseG.length !== 2) {
    errors.push({ field: 'baseG', message: 'baseG deve ser um array com 2 elementos' });
  } else {
    const [min, max] = profile.baseG;
    if (min >= max) {
      errors.push({ field: 'baseG', message: 'baseG[0] deve ser menor que baseG[1]' });
    }
  }
  
  // Validar growth
  if (!Array.isArray(profile.growth) || profile.growth.length !== 2) {
    errors.push({ field: 'growth', message: 'growth deve ser um array com 2 elementos' });
  } else {
    const [min, max] = profile.growth;
    if (min >= max || min < 1) {
      errors.push({ field: 'growth', message: 'growth deve ter valores entre 1 e max, com min < max' });
    }
  }
  
  // Validar minGoodG
  if (typeof profile.minGoodG !== 'number' || profile.minGoodG <= 0) {
    errors.push({ field: 'minGoodG', message: 'minGoodG deve ser um número positivo' });
  }
  
  return { isValid: errors.length === 0, errors };
}
```

## Validações de Estatísticas

### KPIs
```typescript
// Validação de KPIs
function validateKPIs(stats: DashboardStats): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validar que totais são números não-negativos
  if (stats.totalReports < 0) {
    errors.push({ field: 'totalReports', message: 'Total de relatórios não pode ser negativo' });
  }
  
  if (stats.totalEquipment < 0) {
    errors.push({ field: 'totalEquipment', message: 'Total de equipamentos não pode ser negativo' });
  }
  
  if (stats.totalTests < 0) {
    errors.push({ field: 'totalTests', message: 'Total de testes não pode ser negativo' });
  }
  
  // Validar distribuição de resultados
  const totalResults = stats.resultsDistribution.BOM + 
                      stats.resultsDistribution.ACEITÁVEL + 
                      stats.resultsDistribution.REPROVADO;
  
  if (totalResults !== stats.totalTests) {
    errors.push({ field: 'resultsDistribution', message: 'Soma dos resultados deve igual ao total de testes' });
  }
  
  return { isValid: errors.length === 0, errors };
}
```

## Tratamento de Erros

### Tipos de Erro
```typescript
enum ValidationErrorType {
  REQUIRED = 'required',
  FORMAT = 'format',
  RANGE = 'range',
  CORRELATION = 'correlation',
  CONSISTENCY = 'consistency',
  AI_CONFIDENCE = 'ai_confidence'
}

interface ValidationError {
  field: string;
  message: string;
  type?: ValidationErrorType;
  severity?: 'error' | 'warning' | 'info';
}
```

### Mensagens de Erro
```typescript
// Mensagens de erro padronizadas
const ERROR_MESSAGES = {
  required: (field: string) => `${field} é obrigatório`,
  format: (field: string, format: string) => `${field} deve estar no formato: ${format}`,
  range: (field: string, min: number, max: number) => `${field} deve estar entre ${min} e ${max}`,
  correlation: (phases: string[]) => `Correlação entre fases ${phases.join(' e ')} está fora do esperado`,
  consistency: (field: string) => `${field} está inconsistente com valores relacionados`,
  ai_confidence: (confidence: number, threshold: number) => 
    `Confiança da IA (${confidence.toFixed(2)}) está abaixo do threshold (${threshold})`
};
```

## Testes de Validação

### Exemplos de Testes Unitários
```typescript
// Teste de validação de categoria
describe('validateCategory', () => {
  it('deve aceitar categorias válidas', () => {
    expect(validateCategory('cabo').isValid).toBe(true);
    expect(validateCategory('motor').isValid).toBe(true);
  });
  
  it('deve rejeitar categorias inválidas', () => {
    expect(validateCategory('invalido').isValid).toBe(false);
  });
});

// Teste de validação de tensão
describe('validateVoltage', () => {
  it('deve aceitar tensões válidas', () => {
    expect(validateVoltage(1.0).isValid).toBe(true);
    expect(validateVoltage(10.5).isValid).toBe(true);
  });
  
  it('deve rejeitar tensões fora do range', () => {
    expect(validateVoltage(0.05).isValid).toBe(false);
    expect(validateVoltage(100).isValid).toBe(false);
  });
});

// Teste de validação multi-fase
describe('validatePhaseConfiguration', () => {
  it('deve aceitar configuração válida', () => {
    const config: MultiPhaseConfig = {
      phases: { names: ['R', 'S', 'T'], count: 3 },
      // ... outros campos
    };
    expect(validatePhaseConfiguration(config).isValid).toBe(true);
  });
  
  it('deve rejeitar fases duplicadas', () => {
    const config: MultiPhaseConfig = {
      phases: { names: ['R', 'R', 'T'], count: 3 },
      // ... outros campos
    };
    expect(validatePhaseConfiguration(config).isValid).toBe(false);
  });
});
```

---

**Nota**: Este sistema de validação garante a integridade dos dados e a qualidade dos relatórios gerados, mantendo flexibilidade para diferentes cenários de uso.
