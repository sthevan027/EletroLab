# EletriLab — Atualização Ultra-MVP Revisada

## 📋 Resumo das Mudanças

Esta atualização transforma o EletriLab de um sistema complexo de gestão de relatórios para um gerador rápido de relatórios Megger/IR no formato "cupom", com foco em simulação e ensaio rápido.

## 🎯 Objetivos Principais

1. **Geração Rápida**: Relatórios Megger/IR no padrão "cupom"
2. **Duas Modalidades**: Gerar (sem salvar) e Salvar (com histórico)
3. **Validações Flexíveis**: Campos opcionais não bloqueiam geração
4. **Escala Automática**: Resistência com formatação inteligente (Ω → kΩ → MΩ → GΩ → TΩ)
5. **OVRG**: Limite de 5 TΩ com tratamento especial

## 🔧 Mudanças Técnicas Principais

### 1. Nova Estrutura de Dados

#### Relatório Simplificado (Cupom)
```typescript
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
```

#### Perfis por Categoria
```typescript
interface CategoryProfile {
  baseG: [number, number];   // Faixa inicial em GΩ
  growth: [number, number];  // Multiplicador por passo
  minGoodG: number;          // Mínimo desejado em GΩ
}

const profiles: Record<Category, CategoryProfile> = {
  cabo:  { baseG: [5, 20],   growth: [1.05, 1.18], minGoodG: 20 },
  motor: { baseG: [1, 5],    growth: [1.03, 1.12], minGoodG: 5  },
  bomba: { baseG: [1, 5],    growth: [1.03, 1.12], minGoodG: 5  },
  trafo: { baseG: [10, 50],  growth: [1.05, 1.18], minGoodG: 50 },
  outro: { baseG: [0.5, 5],  growth: [1.02, 1.10], minGoodG: 5  }
};
```

### 2. Novas Utilitárias

#### Formatação de Resistência
```typescript
// utils/units.ts
export function formatResistance(valueOhms: number, limitTOhms = 5): string {
  const limit = limitTOhms * 1e12; // 5 TΩ
  if (valueOhms >= limit) return "0.99 OVRG";

  if (valueOhms < 1e3)  return `${valueOhms.toFixed(0)}Ω`;
  if (valueOhms < 1e6)  return `${(valueOhms/1e3).toFixed(2)}kΩ`;
  if (valueOhms < 1e9)  return `${(valueOhms/1e6).toFixed(2)}MΩ`;
  if (valueOhms < 1e12) return `${(valueOhms/1e9).toFixed(2)}GΩ`;
  return `${(valueOhms/1e12).toFixed(2)}TΩ`;
}
```

#### Gerador de Série IR
```typescript
// utils/generator.ts
export function gerarSerieIR(opts: {
  category: Category;
  kv?: number;
  limitTOhm?: number;
}): { readings: Reading[], dai: string } {
  // Implementação do gerador com perfis por categoria
  // Série fixa: 00:15, 00:30, 00:45, 01:00
  // Cálculo do DAI = R60/R30 (ou "Undefined" se OVRG)
}
```

### 3. Interface de Usuário Atualizada

#### Dashboard Simplificado
- **KPIs**: Total salvos, % bom/aceitável/reprovado
- **Botões**: "Gerar Rápido" e "Novo Relatório"
- **Remoção**: Gráficos complexos (mantidos apenas para relatórios salvos)

#### Toggle de Modo
```typescript
// Componente de toggle no topo da página
type Mode = 'generate' | 'save';

interface ModeToggleProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}
```

#### Formulário Flexível
- **Campos Obrigatórios**: Apenas Categoria e kV
- **Campos Opcionais**: Tag, cliente, site, operador, fabricante, modelo
- **Validação**: Não bloqueia geração se campos opcionais estiverem vazios

### 4. Fluxo de Trabalho

#### Modo "Gerar Rápido"
1. Usuário seleciona categoria e kV
2. Clica "Gerar Valores"
3. Sistema mostra preview do cupom
4. Opções: Exportar PDF/CSV
5. **Não salva** no IndexedDB

#### Modo "Novo Relatório"
1. Usuário preenche campos (obrigatórios + opcionais)
2. Clica "Gerar Valores"
3. Sistema mostra preview do cupom
4. Opções: Salvar (IndexedDB) + Exportar PDF/CSV

### 5. Exportação Atualizada

#### PDF (Formato Cupom)
- **Tamanho**: A7 portrait
- **Layout**: Compacto, estilo cupom
- **Conteúdo**: Série de tempos + DAI + dados básicos

#### CSV
- **Formato**: 4 linhas de série + DAI
- **Estrutura**: Time, kV, Resistance, DAI

## 🗄️ Mudanças no Banco de Dados

### Simplificação do Schema
```typescript
// Remover tabelas complexas
// Manter apenas:
interface IRReport {
  // ... estrutura simplificada
}

// IndexedDB simplificado
export class EletriLabDB extends Dexie {
  irReports!: Table<IRReport>;
  parameters!: Table<Parameter>; // Para configurações
}
```

### Parâmetros Editáveis
```typescript
interface Parameter {
  id: string;
  key: string;
  value: any;
  category?: string;
}

// Exemplos:
// - OVRG limit (default: 5 TΩ)
// - Perfis por categoria (base, growth, minGood)
// - Configurações de exportação
```

## 📱 Telas Atualizadas

### 1. Dashboard
```typescript
// src/pages/Dashboard.tsx
- KPIs simplificados
- Botões: "Gerar Rápido" e "Novo Relatório"
- Lista dos últimos relatórios salvos
```

### 2. Gerar Rápido
```typescript
// src/pages/QuickGenerate.tsx
- Formulário mínimo (categoria, kV, tag opcional)
- Preview do cupom
- Botões: Exportar PDF/CSV
```

### 3. Novo Relatório
```typescript
// src/pages/NewReport.tsx
- Toggle: Modo Gerar | Salvar
- Formulário completo (campos opcionais)
- Preview do cupom
- Botões: Salvar + Exportar PDF/CSV
```

### 4. Parâmetros
```typescript
// src/pages/Parameters.tsx
- Editar perfis por categoria
- Configurar limite OVRG
- Configurações de exportação
```

## 🔄 Migração de Dados

### Estratégia de Migração
1. **Backup**: Exportar dados existentes
2. **Conversão**: Transformar relatórios antigos para novo formato
3. **Limpeza**: Remover dados não utilizados
4. **Validação**: Verificar integridade dos dados migrados

### Script de Migração
```typescript
// utils/migration.ts
export async function migrateToUltraMVP() {
  // 1. Backup dados existentes
  const backup = await exportCurrentData();
  
  // 2. Converter relatórios Megger para formato IR
  const convertedReports = await convertMeggerReports();
  
  // 3. Limpar tabelas antigas
  await cleanupOldTables();
  
  // 4. Inserir dados convertidos
  await insertConvertedData(convertedReports);
  
  // 5. Configurar parâmetros padrão
  await setupDefaultParameters();
}
```

## 🧪 Testes Atualizados

### Cenários de Teste
1. **Geração Rápida**: Verificar preview sem salvar
2. **Salvamento**: Verificar persistência no IndexedDB
3. **Escala de Resistência**: Verificar formatação automática
4. **OVRG**: Verificar limite de 5 TΩ
5. **DAI**: Verificar cálculo e "Undefined"
6. **Exportação**: Verificar PDF e CSV
7. **Validações**: Verificar campos opcionais

### Testes de Perfil
```typescript
// tests/profiles.test.ts
describe('Category Profiles', () => {
  test('cabo should always generate >= 5GΩ', () => {
    const result = gerarSerieIR({ category: 'cabo', kv: 1.00 });
    result.readings.forEach(reading => {
      const value = parseResistance(reading.resistance);
      expect(value).toBeGreaterThanOrEqual(5e9);
    });
  });
});
```

## 📊 Métricas de Sucesso

### KPIs do Ultra-MVP
1. **Velocidade**: Geração de relatório em < 5 segundos
2. **Usabilidade**: Redução de campos obrigatórios em 70%
3. **Flexibilidade**: 100% dos campos opcionais não bloqueiam geração
4. **Precisão**: Escala automática funcionando em 100% dos casos
5. **Exportação**: PDF e CSV gerados corretamente

## 🚀 Cronograma de Implementação

### Semana 1: Estrutura Base
- [ ] Criar novas utilitárias (formatResistance, gerarSerieIR)
- [ ] Atualizar tipos TypeScript
- [ ] Implementar toggle de modo
- [ ] Criar perfis por categoria

### Semana 2: Interface
- [ ] Atualizar Dashboard
- [ ] Implementar Gerar Rápido
- [ ] Atualizar Novo Relatório
- [ ] Implementar preview do cupom

### Semana 3: Funcionalidades
- [ ] Implementar salvamento no IndexedDB
- [ ] Atualizar exportação PDF/CSV
- [ ] Implementar tela de Parâmetros
- [ ] Testes de validação

### Semana 4: Refinamento
- [ ] Migração de dados existentes
- [ ] Testes completos
- [ ] Documentação atualizada
- [ ] Deploy da versão Ultra-MVP

## 🔧 Configurações Técnicas

### Dependências Atualizadas
```json
{
  "dependencies": {
    "dexie": "^3.2.4",
    "html2pdf.js": "^0.10.1",
    "react": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "tailwindcss": "^3.2.0"
  }
}
```

### Configurações Vite
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['dexie', 'html2pdf.js']
        }
      }
    }
  }
});
```

## 📝 Documentação Atualizada

### Arquivos a Atualizar
1. **README.md**: Visão geral do Ultra-MVP
2. **data-model.md**: Schema simplificado
3. **validation-rules.md**: Regras de escala e OVRG
4. **ux-spec.md**: Fluxo simplificado
5. **test-plan.md**: Cenários de teste atualizados

### Novos Arquivos
1. **ultra-mvp-spec.md**: Especificação detalhada
2. **migration-guide.md**: Guia de migração
3. **api-reference.md**: Referência das novas funções

## 🎯 Próximos Passos

1. **Aprovação**: Revisar e aprovar especificação
2. **Setup**: Configurar ambiente de desenvolvimento
3. **Implementação**: Seguir cronograma estabelecido
4. **Testes**: Validar funcionalidades
5. **Deploy**: Liberar versão Ultra-MVP

---

**Nota**: Esta atualização mantém a compatibilidade com dados existentes através de migração, mas simplifica significativamente o sistema para focar na geração rápida de relatórios Megger/IR no formato cupom.
