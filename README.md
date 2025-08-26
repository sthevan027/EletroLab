# EletriLab - Gerador Rápido de Relatórios Megger/IR

Sistema para geração rápida de relatórios de Megger/IR no formato "cupom", com suporte a simulação e histórico local.

## Funcionalidades

### Geração Rápida
- **Modo Simulação**: Gera relatórios sem salvar para testes rápidos
- **Modo Histórico**: Salva relatórios no IndexedDB para consulta posterior
- **Geração Multi-Fase**: Cria múltiplos relatórios para fase/fase e fase/massa automaticamente
- **Configuração Flexível**: Permite personalizar nomes das fases (R,S,T ou A,B,C, etc.)

### Geração Inteligente com IA
- **Assistente de Configuração**: Interface passo a passo para configuração de testes
- **Fases Personalizáveis**: Usuário define nomes das fases (R,S,T, L1,L2,L3, etc.)
- **Combinações Flexíveis**: Escolha quais combinações fase/fase testar
- **Valores Correlacionados**: IA gera valores realistas e correlacionados entre fases
- **Comentários Automáticos**: Identifica tipo de teste (Fase/Fase, Fase/Massa)

### Escala Automática
- **Formatação Inteligente**: Ω → kΩ → MΩ → GΩ → TΩ automaticamente
- **OVRG**: Exibe "0.99 OVRG" quando resistência ≥ 5 TΩ
- **DAI**: Calcula R60/R30 ou "Undefined" se houver OVRG

### Perfis por Categoria
- **Cabo**: Sempre ≥ 5 GΩ, crescimento 1.05-1.18
- **Motor**: Base 1-5 GΩ, crescimento 1.03-1.12
- **Bomba**: Base 1-5 GΩ, crescimento 1.03-1.12
- **Trafo**: Base 10-50 GΩ, crescimento 1.05-1.18
- **Outro**: Base 0.5-5 GΩ, crescimento 1.02-1.10

### Exportação
- **PDF**: Formato A7 portrait estilo cupom
- **CSV**: Dados estruturados para análise
- **Multi-Export**: Exporta todos os relatórios de uma vez

## Tecnologias

- **Frontend**: React 19 + Vite + TypeScript
- **Estilização**: Tailwind CSS
- **Banco Local**: IndexedDB (Dexie.js)
- **PDF**: html2pdf.js
- **IA Local**: Sistema de aprendizado e correlações

## Estrutura do Projeto

```
src/
├── components/          # Componentes React
├── pages/              # Páginas da aplicação
│   ├── Dashboard.tsx
│   ├── GenerateReport.tsx      # Geração simples
│   └── GenerateMultiReport.tsx # Geração multi-fase com IA
├── utils/              # Utilitários
│   ├── generator.ts           # Gerador básico
│   ├── multi-generator.ts     # Gerador multi-fase
│   ├── units.ts              # Formatação de unidades
│   └── export.ts             # Exportação
├── ai/                 # Sistema de IA
│   ├── config-wizard.ts      # Assistente de configuração
│   ├── phase-calculator.ts   # Cálculo de correlações
│   └── validation.ts         # Validação inteligente
├── db/                 # Banco de dados
└── types/              # Tipos TypeScript
```

## Fluxo de Trabalho

### Geração Simples
1. Acesse "Gerar Rápido" no Dashboard
2. Configure categoria e tensão
3. Preencha campos opcionais
4. Clique "Gerar Valores"
5. Visualize preview e exporte

### Geração Multi-Fase com IA
1. Acesse "Gerar Multi-Fase" no Dashboard
2. **Step 1**: Configure equipamento e nomes das fases
3. **Step 2**: Escolha combinações fase/fase e fase/massa
4. **Step 3**: Defina condições e qualidade esperada
5. Clique "Gerar Todos" para criar múltiplos relatórios
6. Exporte todos os relatórios de uma vez

## Série de Tempos Fixa

Todos os relatórios seguem a série temporal padrão:
- **00:15** - Primeira leitura
- **00:30** - Segunda leitura
- **00:45** - Terceira leitura
- **01:00** - Quarta leitura

## Perfis por Categoria

Cada categoria possui parâmetros específicos para geração:

```typescript
const profiles = {
  cabo:  { baseG: [5, 20],   growth: [1.05, 1.18], minGoodG: 20 },
  motor: { baseG: [1, 5],    growth: [1.03, 1.12], minGoodG: 5  },
  bomba: { baseG: [1, 5],    growth: [1.03, 1.12], minGoodG: 5  },
  trafo: { baseG: [10, 50],  growth: [1.05, 1.18], minGoodG: 50 },
  outro: { baseG: [0.5, 5],  growth: [1.02, 1.10], minGoodG: 5  }
};
```

## Escala de Resistência

Formatação automática baseada no valor:
- **< 1 kΩ**: Ω (ex: 500Ω)
- **1 kΩ - < 1 MΩ**: kΩ (ex: 2.50kΩ)
- **1 MΩ - < 1 GΩ**: MΩ (ex: 15.30MΩ)
- **1 GΩ - < 1 TΩ**: GΩ (ex: 5.23GΩ)
- **≥ 1 TΩ**: TΩ (ex: 2.15TΩ)
- **≥ 5 TΩ**: "0.99 OVRG"

## Sistema de IA

### Validação Inteligente
- Detecta valores anômalos
- Valida correlações entre fases
- Sugere correções quando necessário

### Geração Correlacionada
- Valores fase/fase baseados nas fases individuais
- Valores fase/massa relacionados às fases
- Mantém consistência física

### Aprendizado Local
- Aprende com histórico de testes
- Ajusta perfis baseado em resultados anteriores
- Melhora precisão com uso

## Migração

O sistema suporta migração de dados da versão anterior:
- Conversão automática de relatórios antigos
- Preservação de configurações existentes
- Compatibilidade com dados salvos

## Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Executar em desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Preview da build
pnpm preview
```

## Licença

Este projeto é desenvolvido para uso interno e educacional.
