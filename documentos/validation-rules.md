# Regras de Validação e Classificação - EletriLab

## 📋 Visão Geral

O sistema EletriLab utiliza regras de validação e classificação automática para determinar o resultado dos testes elétricos. As regras são baseadas em padrões da indústria e podem ser configuradas pelo usuário.

## 🎯 Tipos de Classificação

### Resultados Possíveis

- **🟢 BOM**: Equipamento em excelente condição
- **🟡 ACEITÁVEL**: Equipamento em condição aceitável, mas requer atenção
- **🔴 REPROVADO**: Equipamento com problemas que requerem intervenção

## ⚡ Lógica de Geração Aleatória

### Distribuição de Probabilidades

O sistema gera valores aleatórios seguindo uma distribuição que simula cenários reais:

#### Megger (Resistência de Isolamento)
- **60%** valores > `good` → **BOM**
- **25%** entre `min` e `good` → **ACEITÁVEL**
- **15%** abaixo de `min` → **REPROVADO**

#### Hipot (Tensão Aplicada)
- **60%** valores ≤ `good` → **BOM**
- **25%** entre `good` e `max` → **ACEITÁVEL**
- **15%** > `max` → **REPROVADO**

## 🔧 Regras de Classificação por Tipo de Teste

### 1. Teste Megger (Resistência de Isolamento)

#### Princípio
Mede a resistência de isolamento entre condutores e terra ou entre condutores.

#### Regras de Classificação
```typescript
function classifyMegger(value: number, limits: TestLimit): TestResult {
  if (value >= limits.good) {
    return 'BOM';
  } else if (value >= limits.min) {
    return 'ACEITÁVEL';
  } else {
    return 'REPROVADO';
  }
}
```

#### Validações
- **Valor mínimo**: 0.1 MΩ
- **Valor máximo**: 10.000 MΩ
- **Tensão aplicada**: 0.5 kV a 10 kV
- **Duração**: 1 a 10 minutos

#### Limites por Categoria

| Categoria | Mínimo (MΩ) | Bom (MΩ) | Descrição |
|-----------|-------------|----------|-----------|
| Motor | 50 | 500 | Motores elétricos |
| Cabo | 100 | 1000 | Cabos de potência |
| Transformador | 200 | 2000 | Transformadores |
| Painel | 20 | 200 | Painéis elétricos |

### 2. Teste Hipot AC (Tensão Alternada)

#### Princípio
Aplica tensão alternada elevada para verificar a integridade do isolamento.

#### Regras de Classificação
```typescript
function classifyHipotAC(value: number, limits: TestLimit): TestResult {
  if (value <= limits.good) {
    return 'BOM';
  } else if (value <= limits.max) {
    return 'ACEITÁVEL';
  } else {
    return 'REPROVADO';
  }
}
```

#### Validações
- **Valor mínimo**: 0.01 mA
- **Valor máximo**: 100 mA
- **Tensão aplicada**: 1 kV a 50 kV
- **Duração**: 1 a 60 minutos

#### Limites por Categoria

| Categoria | Máximo (mA) | Bom (mA) | Descrição |
|-----------|-------------|----------|-----------|
| Motor | 10 | 2 | Motores elétricos |
| Cabo | 5 | 1 | Cabos de potência |
| Transformador | 15 | 3 | Transformadores |
| Painel | 8 | 1.5 | Painéis elétricos |

### 3. Teste Hipot DC (Tensão Contínua)

#### Princípio
Aplica tensão contínua elevada para verificar a integridade do isolamento.

#### Regras de Classificação
```typescript
function classifyHipotDC(value: number, limits: TestLimit): TestResult {
  if (value <= limits.good) {
    return 'BOM';
  } else if (value <= limits.max) {
    return 'ACEITÁVEL';
  } else {
    return 'REPROVADO';
  }
}
```

#### Validações
- **Valor mínimo**: 0.001 mA
- **Valor máximo**: 50 mA
- **Tensão aplicada**: 1 kV a 50 kV
- **Duração**: 1 a 60 minutos

#### Limites por Categoria

| Categoria | Máximo (mA) | Bom (mA) | Descrição |
|-----------|-------------|----------|-----------|
| Motor | 5 | 1 | Motores elétricos |
| Cabo | 2.5 | 0.5 | Cabos de potência |
| Transformador | 7.5 | 1.5 | Transformadores |
| Painel | 4 | 0.75 | Painéis elétricos |

## 🔍 Validações de Entrada

### Validações Gerais

```typescript
interface ValidationRules {
  // Tensão aplicada
  voltage: {
    min: 0.1;    // kV
    max: 50;     // kV
  };
  
  // Duração do teste
  duration: {
    min: 1;      // minutos
    max: 60;     // minutos
  };
  
  // Valores de teste
  testValues: {
    megger: {
      min: 0.1;      // MΩ
      max: 10000;    // MΩ
    };
    hipot: {
      min: 0.001;    // mA
      max: 100;      // mA
    };
  };
}
```

### Validações Específicas por Tipo

#### Megger
```typescript
function validateMeggerTest(test: TestData): ValidationResult {
  const errors: string[] = [];
  
  // Validar tensão
  if (test.kv < 0.5 || test.kv > 10) {
    errors.push('Tensão deve estar entre 0.5 e 10 kV para teste Megger');
  }
  
  // Validar duração
  if (test.duration < 1 || test.duration > 10) {
    errors.push('Duração deve estar entre 1 e 10 minutos para teste Megger');
  }
  
  // Validar valor
  if (test.value < 0.1 || test.value > 10000) {
    errors.push('Valor deve estar entre 0.1 e 10.000 MΩ');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

#### Hipot
```typescript
function validateHipotTest(test: TestData): ValidationResult {
  const errors: string[] = [];
  
  // Validar tensão
  if (test.kv < 1 || test.kv > 50) {
    errors.push('Tensão deve estar entre 1 e 50 kV para teste Hipot');
  }
  
  // Validar duração
  if (test.duration < 1 || test.duration > 60) {
    errors.push('Duração deve estar entre 1 e 60 minutos para teste Hipot');
  }
  
  // Validar valor
  if (test.value < 0.001 || test.value > 100) {
    errors.push('Valor deve estar entre 0.001 e 100 mA');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## 🎲 Algoritmo de Geração Aleatória

### Implementação

```typescript
function generateRandomValue(testType: TestType, category: string): number {
  const limits = getLimitsForCategory(testType, category);
  const random = Math.random();
  
  if (testType === 'megger') {
    return generateMeggerValue(random, limits);
  } else {
    return generateHipotValue(random, limits);
  }
}

function generateMeggerValue(random: number, limits: TestLimit): number {
  if (random < 0.15) {
    // 15% - REPROVADO (abaixo do mínimo)
    return limits.min * (0.1 + Math.random() * 0.9);
  } else if (random < 0.40) {
    // 25% - ACEITÁVEL (entre min e good)
    return limits.min + Math.random() * (limits.good - limits.min);
  } else {
    // 60% - BOM (acima do good)
    return limits.good + Math.random() * (limits.good * 2);
  }
}

function generateHipotValue(random: number, limits: TestLimit): number {
  if (random < 0.60) {
    // 60% - BOM (abaixo ou igual ao good)
    return limits.good * (0.1 + Math.random() * 1);
  } else if (random < 0.85) {
    // 25% - ACEITÁVEL (entre good e max)
    return limits.good + Math.random() * (limits.max - limits.good);
  } else {
    // 15% - REPROVADO (acima do max)
    return limits.max + Math.random() * (limits.max * 0.5);
  }
}
```

## 🔧 Configuração de Limites

### Interface de Configuração

```typescript
interface LimitConfiguration {
  testType: 'megger' | 'hipot_ac' | 'hipot_dc';
  category: string;
  limits: {
    min?: number;
    max?: number;
    good: number;
    units: string;
    description: string;
  };
}
```

### Validação de Configuração

```typescript
function validateLimitConfiguration(config: LimitConfiguration): ValidationResult {
  const errors: string[] = [];
  
  // Validar valores numéricos
  if (config.limits.good <= 0) {
    errors.push('Valor "bom" deve ser maior que zero');
  }
  
  if (config.testType === 'megger') {
    if (config.limits.min && config.limits.min >= config.limits.good) {
      errors.push('Valor mínimo deve ser menor que o valor bom para Megger');
    }
  } else {
    if (config.limits.max && config.limits.max <= config.limits.good) {
      errors.push('Valor máximo deve ser maior que o valor bom para Hipot');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## 📊 Estatísticas de Classificação

### Cálculo de Percentuais

```typescript
function calculateClassificationStats(tests: Test[]): ClassificationStats {
  const total = tests.length;
  const stats = {
    bom: 0,
    aceitavel: 0,
    reprovado: 0
  };
  
  tests.forEach(test => {
    switch (test.result) {
      case 'BOM':
        stats.bom++;
        break;
      case 'ACEITAVEL':
        stats.aceitavel++;
        break;
      case 'REPROVADO':
        stats.reprovado++;
        break;
    }
  });
  
  return {
    total,
    bom: {
      count: stats.bom,
      percentage: (stats.bom / total) * 100
    },
    aceitavel: {
      count: stats.aceitavel,
      percentage: (stats.aceitavel / total) * 100
    },
    reprovado: {
      count: stats.reprovado,
      percentage: (stats.reprovado / total) * 100
    }
  };
}
```

## 🚨 Tratamento de Erros

### Cenários de Erro

1. **Limites não configurados**
   - Usar valores padrão
   - Alertar usuário para configurar

2. **Valores fora do range**
   - Rejeitar entrada
   - Mostrar mensagem de erro específica

3. **Categoria não encontrada**
   - Usar categoria genérica
   - Sugerir criação da categoria

### Implementação de Fallback

```typescript
function getLimitsWithFallback(testType: TestType, category: string): TestLimit {
  const limits = getLimits(testType, category);
  
  if (!limits) {
    // Fallback para categoria genérica
    const genericLimits = getGenericLimits(testType);
    console.warn(`Limites não encontrados para ${category}, usando valores genéricos`);
    return genericLimits;
  }
  
  return limits;
}
```

## 🔄 Atualização de Regras

### Versionamento

```typescript
interface ValidationRulesVersion {
  version: string;
  date: Date;
  changes: string[];
  rules: ValidationRules;
}
```

### Migração de Regras

```typescript
function migrateValidationRules(currentVersion: string, targetVersion: string): boolean {
  // Implementar lógica de migração
  // Atualizar limites padrão se necessário
  // Manter compatibilidade com dados existentes
  return true;
}
```

---

**Nota**: As regras de validação são flexíveis e podem ser ajustadas conforme necessidades específicas do projeto. Sempre teste as regras com dados reais antes de implementar em produção.
