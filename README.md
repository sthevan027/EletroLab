# EletroLab - Gerador de Relatórios de Qualidade da Disciplina Elétrica

![Status](https://img.shields.io/badge/status-em%20produ%C3%A7%C3%A3o-success)

Sistema para geração de relatórios de qualidade elétrica: Megger, Microhmímetro, Hipot, Lançamento de Cabo e Testes de Disjuntor. Suporta **entrada manual de valores** (dados reais do teste) e **cálculo automático** (simulação/estudo), com exportação em **PDF e Excel**.

## Tipos de Relatório

| Tipo | Descrição | Entrada Manual | Cálculo Automático |
|------|-----------|----------------|-------------------|
| **Megger** | Resistência de isolamento (IR) | Leituras 00:15, 00:30, 00:45, 01:00 editáveis | IA gera valores correlacionados |
| **Microhmímetro** | Teste de resistência de contato (R=V/I) | V, I, R_ref ou R medido | Sistema calcula e detecta mau contato |
| **Hipot** | Tensão de teste de isolamento | Vnominal, Vteste aplicado | Fórmula 2·V+1000 ou 1.5·V |
| **Lançamento de Cabo** | Dimensionamento (corrente, queda, seção) | Potência, distância, seção | NBR5410, ampacidade |
| **Testes de Disjuntor (DJ)** | Coordenação e curva | Icarga, In, Icabo | Sugere disjuntor conforme curva B/C/D |

## Duas Formas de Entrada

Em **todos** os relatórios:

- **Modo Manual:** Usuário digita os valores medidos no equipamento (teste real em campo)
- **Modo Automático:** Botão "Calcular" preenche valores (estudo, prática, demonstração)
- **Gerar Relatório:** Usa os valores do formulário (manuais ou calculados)

## Funcionalidades

### Geração de Relatórios
- **Megger/IR:** Série 00:15, 00:30, 00:45, 01:00 | DAI | OVRG | Multi-fase com IA
- **Microhmímetro:** R=V/I | Detecção de mau contato (desvio > 50%)
- **Hipot:** Vteste = 2·Vnom+1000 ou 1.5·Vnom
- **Cabo:** Corrente, queda de tensão, seção mínima, disjuntor sugerido
- **Disjuntor:** In ≥ Icarga | Idj ≤ Icabo | Curvas B, C, D

### Exportação
- **PDF:** Formato A7 (cupom) para Megger/IR; A4 para demais
- **Excel:** Planilha estruturada para análise e arquivamento
- **Multi-Export:** Exporta todos os relatórios de uma vez

### Persistência
- **IndexedDB:** Histórico local de relatórios
- **Firebase:** Sincronização opcional (variáveis `VITE_FB_*`)

## Tecnologias

- **Frontend:** React 18 + Vite + TypeScript
- **Estilização:** Tailwind CSS
- **Banco Local:** IndexedDB (Dexie.js)
- **PDF:** html2pdf.js
- **Excel:** xlsx (SheetJS) ou exceljs
- **Nuvem:** Firebase Firestore (opcional)

## Estrutura do Projeto

```
src/
├── components/          # Layout, AIInsights
├── pages/               # Dashboard, GenerateReport, MultiPhase, Cable, Breaker, Tools, Panel, Reports...
├── utils/
│   ├── calculations/    # megger, cable, breaker, microhm, hipot
│   ├── reports/         # megger, cable, panel, microhm, hipot, breaker
│   ├── norms.ts         # NBR5410, IEC60364
│   ├── generator.ts     # Gerador IR com IA
│   ├── export.ts        # PDF
│   └── export-excel.ts  # Excel
├── db/                  # Dexie + cloud (Firebase)
└── types/               # Tipos TypeScript
```

## Documentos de Referência

Pasta `documentos/referencias/` preparada para PDFs e planilhas Excel de apoio ao treinamento e automação. Consulte `documentos/referencias/README.md` para formato esperado.

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
