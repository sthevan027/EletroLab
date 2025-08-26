# Modelo de Dados - EletriLab

## 📊 Visão Geral do Banco de Dados

O EletriLab utiliza **IndexedDB** como banco de dados principal, implementado através da biblioteca **Dexie.js**. O sistema também possui fallback para **localStorage** em caso de indisponibilidade do IndexedDB.

## 🗄️ Schema do IndexedDB

### Tabela: `equipment`

Armazena informações sobre equipamentos elétricos.

```typescript
interface Equipment {
  id: string;                    // UUID único
  category: string;              // Categoria (motor, cabo, transformador, etc.)
  tag: string;                   // Tag/identificação do equipamento
  serialNumber?: string;         // Número de série (opcional)
  inServiceTime?: number;        // Tempo em serviço em meses (opcional)
  createdAt: Date;               // Data de criação
  updatedAt: Date;               // Data da última atualização
}
```

**Índices:**
- `id` (primary key)
- `category` (para filtros por categoria)
- `tag` (para busca por tag)

### Tabela: `report`

Armazena relatórios de teste.

```typescript
interface Report {
  id: string;                    // UUID único
  number: string;                // Número do relatório
  client?: string;               // Cliente (opcional)
  site?: string;                 // Local do teste (opcional)
  operator?: string;             // Operador responsável (opcional)
  date: Date;                    // Data do relatório
  notes?: string;                // Observações (opcional)
  tests: string[];               // Array de IDs dos testes
  status: 'draft' | 'completed'; // Status do relatório
  createdAt: Date;               // Data de criação
  updatedAt: Date;               // Data da última atualização
}
```

**Índices:**
- `id` (primary key)
- `number` (unique, para busca por número)
- `date` (para filtros por data)
- `client` (para filtros por cliente)
- `status` (para filtros por status)

### Tabela: `test`

Armazena dados individuais de cada teste.

```typescript
interface Test {
  id: string;                    // UUID único
  reportId: string;              // ID do relatório (foreign key)
  equipmentId: string;           // ID do equipamento (foreign key)
  testType: 'megger' | 'hipot';  // Tipo de teste
  mode?: string;                 // Modo do teste (opcional)
  kv: number;                    // Tensão aplicada (kV)
  duration: number;              // Duração do teste (minutos)
  value: number;                 // Valor medido
  unit: string;                  // Unidade de medida (MΩ, mA, etc.)
  result: 'BOM' | 'ACEITAVEL' | 'REPROVADO'; // Resultado da classificação
  createdAt: Date;               // Data de criação
}
```

**Índices:**
- `id` (primary key)
- `reportId` (foreign key)
- `equipmentId` (foreign key)
- `testType` (para filtros por tipo)
- `result` (para filtros por resultado)

## 🔧 Configuração do Dexie

```typescript
// src/db/database.ts
import Dexie, { Table } from 'dexie';

export class EletriLabDB extends Dexie {
  equipment!: Table<Equipment>;
  report!: Table<Report>;
  test!: Table<Test>;

  constructor() {
    super('EletriLabDB');
    
    this.version(1).stores({
      equipment: 'id, category, tag',
      report: 'id, number, date, client, status',
      test: 'id, reportId, equipmentId, testType, result'
    });
  }
}

export const db = new EletriLabDB();
```

## 📋 JSON Limits (Parâmetros de Classificação)

Os limites para classificação dos testes são armazenados em JSON local editável.

### Estrutura do JSON

```json
{
  "megger": {
    "motor": {
      "min": 50,
      "good": 500,
      "units": "MΩ",
      "description": "Motores elétricos"
    },
    "cabo": {
      "min": 100,
      "good": 1000,
      "units": "MΩ",
      "description": "Cabos de potência"
    },
    "transformador": {
      "min": 200,
      "good": 2000,
      "units": "MΩ",
      "description": "Transformadores"
    },
    "painel": {
      "min": 20,
      "good": 200,
      "units": "MΩ",
      "description": "Painéis elétricos"
    }
  },
  "hipot_ac": {
    "motor": {
      "max": 10,
      "good": 2,
      "units": "mA",
      "description": "Motores elétricos"
    },
    "cabo": {
      "max": 5,
      "good": 1,
      "units": "mA",
      "description": "Cabos de potência"
    },
    "transformador": {
      "max": 15,
      "good": 3,
      "units": "mA",
      "description": "Transformadores"
    },
    "painel": {
      "max": 8,
      "good": 1.5,
      "units": "mA",
      "description": "Painéis elétricos"
    }
  },
  "hipot_dc": {
    "motor": {
      "max": 5,
      "good": 1,
      "units": "mA",
      "description": "Motores elétricos"
    },
    "cabo": {
      "max": 2.5,
      "good": 0.5,
      "units": "mA",
      "description": "Cabos de potência"
    },
    "transformador": {
      "max": 7.5,
      "good": 1.5,
      "units": "mA",
      "description": "Transformadores"
    },
    "painel": {
      "max": 4,
      "good": 0.75,
      "units": "mA",
      "description": "Painéis elétricos"
    }
  }
}
```

### Tipos TypeScript para Limits

```typescript
interface TestLimit {
  min?: number;        // Valor mínimo (para Megger)
  max?: number;        // Valor máximo (para Hipot)
  good: number;        // Valor considerado bom
  units: string;       // Unidade de medida
  description: string; // Descrição do limite
}

interface TestLimits {
  megger: Record<string, TestLimit>;
  hipot_ac: Record<string, TestLimit>;
  hipot_dc: Record<string, TestLimit>;
}
```

## 🔄 Operações de Banco

### Inicialização

```typescript
// src/db/init.ts
export async function initializeDatabase() {
  try {
    // Verificar se já existe dados
    const equipmentCount = await db.equipment.count();
    
    if (equipmentCount === 0) {
      // Inserir dados padrão
      await insertDefaultData();
    }
    
    // Carregar limites padrão se não existirem
    await loadDefaultLimits();
    
  } catch (error) {
    console.error('Erro ao inicializar banco:', error);
    // Fallback para localStorage
    await initializeLocalStorage();
  }
}
```

### Backup e Restauração

```typescript
// src/db/backup.ts
export async function exportDatabase() {
  const data = {
    equipment: await db.equipment.toArray(),
    report: await db.report.toArray(),
    test: await db.test.toArray(),
    limits: getLimits(),
    exportDate: new Date().toISOString()
  };
  
  return JSON.stringify(data, null, 2);
}

export async function importDatabase(jsonData: string) {
  const data = JSON.parse(jsonData);
  
  await db.transaction('rw', [db.equipment, db.report, db.test], async () => {
    await db.equipment.clear();
    await db.report.clear();
    await db.test.clear();
    
    await db.equipment.bulkAdd(data.equipment);
    await db.report.bulkAdd(data.report);
    await db.test.bulkAdd(data.test);
  });
  
  setLimits(data.limits);
}
```

## 📊 Relacionamentos

### Relacionamento 1:N (Report → Test)
- Um relatório pode ter múltiplos testes
- Cada teste pertence a um relatório específico

### Relacionamento N:1 (Test → Equipment)
- Múltiplos testes podem ser realizados no mesmo equipamento
- Cada teste é associado a um equipamento específico

### Relacionamento 1:N (Equipment → Test)
- Um equipamento pode ter múltiplos testes ao longo do tempo
- Permite histórico de testes por equipamento

## 🔍 Queries Comuns

```typescript
// Buscar relatórios por período
const reportsByDate = await db.report
  .where('date')
  .between(startDate, endDate)
  .toArray();

// Buscar testes por equipamento
const testsByEquipment = await db.test
  .where('equipmentId')
  .equals(equipmentId)
  .toArray();

// Buscar relatórios por cliente
const reportsByClient = await db.report
  .where('client')
  .equals(clientName)
  .toArray();

// Estatísticas por resultado
const statsByResult = await db.test
  .groupBy('result')
  .count();
```

## 🛡️ Validações

### Constraints do Banco

- **Unicidade**: Número do relatório deve ser único
- **Integridade Referencial**: Testes devem referenciar relatórios e equipamentos válidos
- **Campos Obrigatórios**: ID, tipo de teste, valor, unidade são obrigatórios

### Validações de Negócio

- Valores de teste devem ser positivos
- Tensão (kV) deve estar entre 0.1 e 50 kV
- Duração deve estar entre 1 e 60 minutos
- Classificação deve ser calculada automaticamente

## 📈 Performance

### Otimizações

- **Índices**: Criados para campos frequentemente consultados
- **Paginação**: Implementada para listas grandes
- **Lazy Loading**: Dados carregados sob demanda
- **Cache**: Dados frequentemente acessados em memória

### Limites

- **Tamanho do Banco**: Limitado pela capacidade do IndexedDB (~50MB)
- **Número de Registros**: Recomendado até 10.000 registros por tabela
- **Tamanho do JSON**: Limits JSON limitado a 1MB

## 🔧 Manutenção

### Limpeza de Dados

```typescript
// Limpar dados antigos (mais de 2 anos)
const twoYearsAgo = new Date();
twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

await db.report
  .where('date')
  .below(twoYearsAgo)
  .delete();
```

### Compactação

```typescript
// Compactar banco (Dexie faz automaticamente)
await db.open();
```

---

**Nota**: Este modelo de dados é flexível e pode ser expandido conforme necessário. Todas as operações são transacionais para garantir consistência dos dados.
