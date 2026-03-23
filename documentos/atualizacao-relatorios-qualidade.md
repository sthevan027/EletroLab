# EletriLab — Atualização: Gerador de Relatórios de Qualidade Elétrica

## Resumo das Mudanças

Esta atualização transforma o EletriLab em um **gerador de relatórios de qualidade da disciplina elétrica**, unificando Megger, Microhmímetro, Hipot, Lançamento de Cabo e Testes de Disjuntor. Todos os relatórios suportam **entrada manual de valores** (dados reais do teste) e **cálculo automático** (simulação/estudo), com exportação em **PDF e Excel**.

## Objetivos Principais

1. **Relatórios para todos os tipos**: Megger, Microhm, Hipot, Cabo, Disjuntor
2. **Entrada manual**: Usuário pode digitar os valores medidos
3. **Cálculo automático**: Botão "Calcular" preenche valores
4. **Exportação PDF e Excel**: Para todos os relatórios
5. **Documentos de referência**: Estrutura para PDFs e Excel de treinamento

## Tipos de Relatório

| Tipo | Descrição | Modo Manual | Modo Auto |
|------|-----------|-------------|-----------|
| Megger | Resistência de isolamento | Leituras editáveis | IA gera |
| Microhm | R=V/I, mau contato | V, I, R_ref | Calcula |
| Hipot | Vteste isolamento | Vnom, Vteste | Fórmula |
| Cabo | Dimensionamento | Potência, distância, seção | NBR5410 |
| Disjuntor | Coordenação | Icarga, In, Icabo | Curva B/C/D |

## Mudanças Técnicas

### Novos Módulos de Relatório
- `src/utils/reports/microhm.ts` — generateMicrohmReport()
- `src/utils/reports/hipot.ts` — generateHipotReport()
- `src/utils/reports/breaker.ts` — generateBreakerReport()

### Nova Exportação Excel
- `src/utils/export-excel.ts` — Funções para cada tipo
- Dependência: xlsx (SheetJS) ou exceljs

### Estrutura de Documentos
- `documentos/referencias/` — PDFs e Excel de referência
- `documentos/referencias/README.md` — Formato esperado

### Banco de Dados
- Tabela `qualityReports` ou campo `reportType` em irReports
- Migração para dados existentes

## Fluxo de Usuário por Relatório

1. Usuário acessa a página (Megger, Microhm, Hipot, Cabo ou Disjuntor)
2. **Opção A:** Digita valores manualmente (teste real)
3. **Opção B:** Clica "Calcular" para preenchimento automático
4. Visualiza preview
5. Clica "Gerar Relatório"
6. Exporta PDF e/ou Excel

## Cronograma (por PR)

- PR 1: Excel + Megger editável
- PR 2: Estrutura documentos/referencias
- PR 3–6: Relatórios Microhm, Hipot, Cabo, Disjuntor
- PR 7: Unificação e navegação
- PR 8: Banco e migração

## Compatibilidade

- Mantém relatórios Megger/IR e Multi-Fase existentes
- Migração automática de dados
- Firebase opcional preservado

---

**Versão:** Relatórios de Qualidade Elétrica
**Data:** 2025
