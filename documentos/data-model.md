# Modelo de Dados - EletriLab Ultra-MVP com IA

## Visão Geral

O EletriLab Ultra-MVP utiliza um modelo de dados simplificado focado em relatórios de Megger/IR, com suporte a geração multi-fase e sistema de IA local para validação e correlações.

## Schema do Banco de Dados

### Tabelas Principais

```typescript
// Tabela de relatórios IR
interface IRReport {
  id: string;
  number?: string;           // Apenas quando salvo
  category: 'cabo' | 'motor' | 'bomba' | 'trafo' | 'outro';
  tag?: string;              // Opcional
  kv: number;                // Tensão aplicada (default 1.00)
  
  // Dados opcionais (não bloqueiam geração)
  client?: string;
  site?: string;
  operator?: string;
  manufacturer?: string;
  model?: string;
  
  // Série de tempos fixa
  readings: {
    time: string;            // "00:15", "00:30", "00:45", "01:00"
    kv: string;              // Formato "1.00"
    resistance: string;      // Formato "5.23GΩ" ou "0.99 OVRG"
  }[];
  
  dai: string;               // "1.15" ou "Undefined"
  createdAt: Date;
  isSaved: boolean;          // true = salvo no IndexedDB, false = apenas preview
}

// Tabela de parâmetros do sistema
interface Parameter {
  id: string;
  key: string;
  value: any;
  category?: string;
}
```

### Novas Estruturas para Multi-Fase

```typescript
// Configuração de teste multi-fase
interface MultiPhaseConfig {
  id: string;
  equipmentType: 'cabo' | 'motor' | 'trafo' | 'outro';
  
  // Fases personalizáveis
  phases: {
    names: string[];        // ['R', 'S', 'T'] ou ['A', 'B', 'C']
    count: number;          // 3, 4, 5, etc.
  };
  
  // Tipos de teste
  testTypes: {
    phaseToPhase: {
      enabled: boolean;
      combinations: string[][];  // [['R', 'S'], ['S', 'T'], ['R', 'T']]
    };
    phaseToGround: {
      enabled: boolean;
      groundName: string;        // 'M', 'GND', 'TERRA'
    };
  };
  
  voltage: number;
  environment: {
    temperature: number;
    humidity: number;
    quality: 'excellent' | 'good' | 'acceptable';
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// Relatório multi-fase
interface MultiPhaseReport {
  id: string;
  configId: string;         // Referência à configuração
  
  equipment: {
    model?: string;
    unitId?: string;
    timestamp: string;
  };
  
  reports: {
    id: string;              // "R/S", "S/T", "R/M", etc.
    testNo: number;          // Sequencial: 1458, 1459, 1460...
    type: 'phase-phase' | 'phase-ground';
    description: string;     // "Fase R para Fase S"
    phases: string[];        // ['R', 'S'] ou ['R', 'M']
    readings: {
      time: string;
      kv: string;
      resistance: string;
    }[];
    dai: string;
    comments: string;        // "Fase/Fase" ou "Fase/Massa"
  }[];
  
  summary: {
    phaseToPhase: string;    // "R/S, S/T, R/T"
    phaseToGround: string;   // "R/M, S/M, T/M"
    totalReports: number;
  };
  
  createdAt: Date;
  isSaved: boolean;
}

// Histórico de aprendizado da IA
interface AILearningHistory {
  id: string;
  category: string;
  phaseCount: number;
  phaseNames: string[];
  
  // Dados de aprendizado
  baseValues: number[];
  correlations: {
    phaseToPhase: number[][];
    phaseToGround: number[];
  };
  
  // Métricas de qualidade
  accuracy: number;          // 0-1
  confidence: number;        // 0-1
  
  createdAt: Date;
  usedCount: number;
}
```

## Configuração do Dexie

```typescript
export class EletriLabDB extends Dexie {
  irReports!: Table<IRReport>;
  parameters!: Table<Parameter>;
  multiPhaseConfigs!: Table<MultiPhaseConfig>;
  multiPhaseReports!: Table<MultiPhaseReport>;
  aiLearningHistory!: Table<AILearningHistory>;

  constructor() {
    super('EletriLabDB');
    this.version(3).stores({
      irReports: '++id, category, createdAt, isSaved',
      parameters: '++id, key, category',
      multiPhaseConfigs: '++id, equipmentType, createdAt',
      multiPhaseReports: '++id, configId, createdAt, isSaved',
      aiLearningHistory: '++id, category, phaseCount, createdAt'
    });
  }
}
```

## Parâmetros Padrão

### Perfis de Categoria
```typescript
const profiles: Record<Category, CategoryProfile> = {
  cabo:  { baseG: [5, 20],   growth: [1.05, 1.18], minGoodG: 20 },
  motor: { baseG: [1, 5],    growth: [1.03, 1.12], minGoodG: 5  },
  bomba: { baseG: [1, 5],    growth: [1.03, 1.12], minGoodG: 5  },
  trafo: { baseG: [10, 50],  growth: [1.05, 1.18], minGoodG: 50 },
  outro: { baseG: [0.5, 5],  growth: [1.02, 1.10], minGoodG: 5  }
};
```

### Configurações do Sistema
```typescript
const systemConfigs = {
  ovrgLimit: 5,              // Limite OVRG em TΩ
  defaultKV: 1.00,           // Tensão padrão
  exportSettings: {
    pdfFormat: 'a7',
    pdfOrientation: 'portrait',
    csvDelimiter: ','
  },
  aiSettings: {
    learningEnabled: true,
    correlationThreshold: 0.8,
    confidenceThreshold: 0.7
  }
};
```

## Operações do Banco de Dados

### Inicialização
```typescript
export async function initializeDatabase(): Promise<void> {
  try {
    await db.open();
    
    // Inserir parâmetros padrão se não existirem
    const existingParams = await db.parameters.count();
    if (existingParams === 0) {
      await insertDefaultParameters();
    }
    
    console.log('Banco de dados inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar banco:', error);
    throw error;
  }
}
```

### Backup e Restore
```typescript
export async function exportDatabase(): Promise<Blob> {
  const data = {
    irReports: await db.irReports.toArray(),
    parameters: await db.parameters.toArray(),
    multiPhaseConfigs: await db.multiPhaseConfigs.toArray(),
    multiPhaseReports: await db.multiPhaseReports.toArray(),
    aiLearningHistory: await db.aiLearningHistory.toArray(),
    exportDate: new Date().toISOString()
  };
  
  return new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
}

export async function importDatabase(backup: Blob): Promise<void> {
  const text = await backup.text();
  const data = JSON.parse(text);
  
  await db.transaction('rw', [
    db.irReports, 
    db.parameters, 
    db.multiPhaseConfigs,
    db.multiPhaseReports,
    db.aiLearningHistory
  ], async () => {
    await db.irReports.clear();
    await db.parameters.clear();
    await db.multiPhaseConfigs.clear();
    await db.multiPhaseReports.clear();
    await db.aiLearningHistory.clear();
    
    await db.irReports.bulkAdd(data.irReports || []);
    await db.parameters.bulkAdd(data.parameters || []);
    await db.multiPhaseConfigs.bulkAdd(data.multiPhaseConfigs || []);
    await db.multiPhaseReports.bulkAdd(data.multiPhaseReports || []);
    await db.aiLearningHistory.bulkAdd(data.aiLearningHistory || []);
  });
}
```

## Queries Principais

### Relatórios Simples
```typescript
// Buscar relatórios salvos
export async function getSavedReports(): Promise<IRReport[]> {
  return await db.irReports
    .where('isSaved')
    .equals(true)
    .reverse()
    .sortBy('createdAt');
}

// Buscar por categoria
export async function getReportsByCategory(category: Category): Promise<IRReport[]> {
  return await db.irReports
    .where('category')
    .equals(category)
    .and(report => report.isSaved)
    .toArray();
}
```

### Relatórios Multi-Fase
```typescript
// Buscar configurações salvas
export async function getSavedMultiPhaseConfigs(): Promise<MultiPhaseConfig[]> {
  return await db.multiPhaseConfigs
    .orderBy('createdAt')
    .reverse()
    .toArray();
}

// Buscar relatórios multi-fase salvos
export async function getSavedMultiPhaseReports(): Promise<MultiPhaseReport[]> {
  return await db.multiPhaseReports
    .where('isSaved')
    .equals(true)
    .reverse()
    .sortBy('createdAt');
}

// Buscar histórico de aprendizado
export async function getAILearningHistory(category: string): Promise<AILearningHistory[]> {
  return await db.aiLearningHistory
    .where('category')
    .equals(category)
    .orderBy('createdAt')
    .reverse()
    .toArray();
}
```

## Validações e Constraints

### Constraints de Negócio
- **Relatórios**: Apenas `category` e `kv` são obrigatórios
- **Multi-Fase**: `phases.names` deve ter pelo menos 2 elementos
- **Combinações**: Não pode haver combinações duplicadas
- **Test Numbers**: Devem ser únicos por sessão

### Validações de IA
- **Correlações**: Valores fase/fase devem ser correlacionados
- **Consistência**: Valores fase/massa devem ser consistentes
- **Confiança**: Apenas usar predições com confiança > 0.7

## Performance e Limites

### Otimizações
- **Indexação**: Índices em `category`, `createdAt`, `isSaved`
- **Paginação**: Limite de 100 registros por consulta
- **Cache**: Cache local para configurações frequentes

### Limites
- **Relatórios**: Máximo 1000 por categoria
- **Multi-Fase**: Máximo 20 fases por configuração
- **Histórico IA**: Máximo 1000 registros de aprendizado

## Manutenção

### Limpeza de Dados
```typescript
// Limpar relatórios não salvos antigos (mais de 24h)
export async function cleanupUnsavedReports(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return await db.irReports
    .where('isSaved')
    .equals(false)
    .and(report => report.createdAt < cutoff)
    .delete();
}

// Limpar histórico de IA antigo (mais de 30 dias)
export async function cleanupOldAILearning(): Promise<number> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  return await db.aiLearningHistory
    .where('createdAt')
    .below(cutoff)
    .delete();
}
```

### Migração de Versão
```typescript
export async function migrateV2ToV3(): Promise<void> {
  // Migração para suporte multi-fase
  await db.transaction('rw', [db.irReports, db.parameters], async () => {
    // Adicionar novos campos se necessário
    // Converter dados existentes
  });
}
```

## Notas de Implementação

- **Compatibilidade**: Mantém compatibilidade com dados da versão anterior
- **Escalabilidade**: Suporte a diferentes números de fases
- **Flexibilidade**: Configurações personalizáveis por usuário
- **Inteligência**: Sistema de aprendizado local sem dependências externas
