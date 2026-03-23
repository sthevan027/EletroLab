# TODO - EletriLab - Gerador de Relatórios de Qualidade Elétrica

## Visão da Nova Versão

O EletriLab está sendo transformado em um gerador de relatórios de qualidade da disciplina elétrica, com suporte a **entrada manual** e **cálculo automático** em todos os tipos, e exportação **PDF e Excel**.

## Próximas Implementações (por PR)

### PR 1: Infraestrutura Excel
- [ ] Adicionar dependência xlsx ou exceljs
- [ ] Criar src/utils/export-excel.ts
- [ ] Megger: leituras editáveis + export Excel

### PR 2: Documentos de Referência
- [ ] Criar documentos/referencias/
- [ ] README com formato esperado (PDF, XLSX)

### PR 3: Relatório Microhmímetro
- [ ] generateMicrohmReport()
- [ ] Campos para entrada manual (V, I, R_ref)
- [ ] Botão Gerar Relatório + PDF + Excel

### PR 4: Relatório Hipot
- [ ] generateHipotReport()
- [ ] Campos para entrada manual (Vnominal, Vteste)
- [ ] Botão Gerar Relatório + PDF + Excel

### PR 5: Relatório Cabo (PDF/Excel)
- [ ] Garantir entrada manual de valores
- [ ] Botões Exportar PDF e Export Excel

### PR 6: Relatório Disjuntor
- [ ] generateBreakerReport()
- [ ] Campos para entrada manual
- [ ] Botão Gerar Relatório + PDF + Excel

### PR 7: Unificação
- [ ] Rebranding "Relatórios de Qualidade"
- [ ] Dashboard e navegação atualizados
- [ ] Reports com filtro por tipo

### PR 8: Banco de Dados
- [ ] Tabela qualityReports ou extensão
- [ ] Migração de dados

## Interface e Design
- [x] Tema escuro/cinza
- [x] Gerar Multi-Fase
- [ ] Página de visualização unificada de relatórios
- [ ] Filtros por tipo (Megger, Microhm, Hipot, Cabo, Disjuntor)

## Exportação
- [x] PDF (Megger, Multi-Fase)
- [ ] Excel (todos os tipos)
- [ ] Exportação em lote (PDF/Excel)

## Testes e Qualidade
- [ ] Testes unitários (cálculos)
- [ ] Testes de integração (fluxos)
- [ ] Testes E2E
- [ ] Validação entrada manual vs. automática

## Ideias Futuras
- [ ] Integração com documentos de referência (PDF/Excel) para treinamento
- [ ] Templates personalizáveis
- [ ] App mobile
- [ ] API REST

## Notas
- Priorizar entrada manual em todos os formulários
- Manter cálculo automático como opção de preenchimento
- Exportação PDF e Excel para todos os tipos
