# Plano de Testes - EletriLab

## 📋 Visão Geral

Este documento define os cenários de teste para o sistema EletriLab, cobrindo funcionalidades de geração de dados, salvamento e exportação de relatórios.

## 🎯 Objetivos dos Testes

- **Validar** funcionalidades principais do sistema
- **Garantir** qualidade dos dados gerados
- **Verificar** integridade do banco de dados
- **Testar** exportação de relatórios
- **Validar** regras de classificação
- **Verificar** responsividade e usabilidade

## 🧪 Tipos de Teste

### 1. Testes Unitários
- Funções de geração de valores
- Validações de entrada
- Regras de classificação
- Utilitários de exportação

### 2. Testes de Integração
- Interação com IndexedDB
- Fluxo de criação de relatórios
- Exportação de dados

### 3. Testes E2E (End-to-End)
- Fluxo completo de criação
- Exportação de relatórios
- Gestão de equipamentos

### 4. Testes de Performance
- Geração de múltiplos relatórios
- Exportação de dados grandes
- Responsividade da interface

## 📊 Cenários de Teste

### 🎲 Geração de Dados

#### TC001: Geração de Valores Aleatórios - Megger
**Objetivo**: Verificar se os valores gerados seguem a distribuição correta

**Pré-condições**:
- Sistema inicializado
- Parâmetros configurados para Megger

**Passos**:
1. Acessar página "Novo Relatório"
2. Selecionar equipamento tipo "Motor"
3. Configurar teste Megger
4. Clicar em "Gerar Valor Aleatório"
5. Repetir 100 vezes
6. Analisar distribuição dos resultados

**Resultado Esperado**:
- 60% dos valores > 500 MΩ (BOM)
- 25% entre 50-500 MΩ (ACEITÁVEL)
- 15% < 50 MΩ (REPROVADO)
- Todos os valores dentro do range válido (0.1 - 10.000 MΩ)

#### TC002: Geração de Valores Aleatórios - Hipot AC
**Objetivo**: Verificar distribuição para testes Hipot AC

**Pré-condições**:
- Sistema inicializado
- Parâmetros configurados para Hipot AC

**Passos**:
1. Acessar página "Novo Relatório"
2. Selecionar equipamento tipo "Cabo"
3. Configurar teste Hipot AC
4. Clicar em "Gerar Valor Aleatório"
5. Repetir 100 vezes
6. Analisar distribuição dos resultados

**Resultado Esperado**:
- 60% dos valores ≤ 1 mA (BOM)
- 25% entre 1-5 mA (ACEITÁVEL)
- 15% > 5 mA (REPROVADO)
- Todos os valores dentro do range válido (0.01 - 100 mA)

#### TC003: Geração de Valores Aleatórios - Hipot DC
**Objetivo**: Verificar distribuição para testes Hipot DC

**Pré-condições**:
- Sistema inicializado
- Parâmetros configurados para Hipot DC

**Passos**:
1. Acessar página "Novo Relatório"
2. Selecionar equipamento tipo "Transformador"
3. Configurar teste Hipot DC
4. Clicar em "Gerar Valor Aleatório"
5. Repetir 100 vezes
6. Analisar distribuição dos resultados

**Resultado Esperado**:
- 60% dos valores ≤ 1.5 mA (BOM)
- 25% entre 1.5-7.5 mA (ACEITÁVEL)
- 15% > 7.5 mA (REPROVADO)
- Todos os valores dentro do range válido (0.001 - 50 mA)

#### TC004: Geração de Múltiplos Testes
**Objetivo**: Verificar geração simultânea de vários testes

**Pré-condições**:
- Sistema inicializado
- Múltiplos equipamentos cadastrados

**Passos**:
1. Acessar página "Novo Relatório"
2. Selecionar 5 equipamentos diferentes
3. Configurar testes variados (Megger, Hipot AC, Hipot DC)
4. Clicar em "Gerar Todos Aleatórios"
5. Verificar resultados

**Resultado Esperado**:
- Todos os testes gerados com valores válidos
- Classificações corretas aplicadas
- Interface responsiva durante geração

### 💾 Salvamento de Dados

#### TC005: Criação de Relatório Completo
**Objetivo**: Verificar salvamento de relatório com todos os dados

**Pré-condições**:
- Sistema inicializado
- Equipamentos cadastrados

**Passos**:
1. Acessar "Novo Relatório"
2. Preencher informações básicas:
   - Cliente: "Empresa ABC"
   - Local: "Fábrica XYZ"
   - Operador: "João Silva"
   - Data: "15/01/2024"
   - Observações: "Teste de rotina"
3. Selecionar 3 equipamentos
4. Configurar testes variados
5. Gerar valores aleatórios
6. Salvar relatório

**Resultado Esperado**:
- Relatório salvo no IndexedDB
- Número único gerado automaticamente
- Todos os dados preservados
- Status "Concluído"
- Redirecionamento para Dashboard

#### TC006: Salvamento de Rascunho
**Objetivo**: Verificar salvamento parcial durante criação

**Pré-condições**:
- Sistema inicializado

**Passos**:
1. Acessar "Novo Relatório"
2. Preencher apenas informações básicas
3. Clicar em "Salvar Rascunho"
4. Verificar no Dashboard
5. Continuar edição posteriormente

**Resultado Esperado**:
- Rascunho salvo com status "Rascunho"
- Dados parciais preservados
- Possibilidade de continuar edição
- Visível na lista de relatórios

#### TC007: Validação de Dados Obrigatórios
**Objetivo**: Verificar validação antes do salvamento

**Pré-condições**:
- Sistema inicializado

**Passos**:
1. Acessar "Novo Relatório"
2. Tentar salvar sem preencher dados obrigatórios
3. Verificar mensagens de erro
4. Preencher dados obrigatórios
5. Tentar salvar novamente

**Resultado Esperado**:
- Validação impede salvamento incompleto
- Mensagens de erro claras
- Salvamento bem-sucedido após correção

#### TC008: Concorrência de Salvamento
**Objetivo**: Verificar comportamento com múltiplos salvamentos

**Pré-condições**:
- Sistema inicializado
- Relatório em edição

**Passos**:
1. Abrir relatório em duas abas
2. Editar dados em ambas as abas
3. Salvar em ambas simultaneamente
4. Verificar integridade dos dados

**Resultado Esperado**:
- Último salvamento prevalece
- Dados não corrompidos
- Feedback adequado ao usuário

### 📤 Exportação de Dados

#### TC009: Exportação PDF - Relatório Simples
**Objetivo**: Verificar geração de PDF com dados básicos

**Pré-condições**:
- Relatório criado com dados completos

**Passos**:
1. Acessar relatório existente
2. Clicar em "Exportar PDF"
3. Aguardar geração
4. Verificar arquivo baixado

**Resultado Esperado**:
- PDF gerado com layout correto
- Todos os dados do relatório incluídos
- Cabeçalho com logo e informações
- Tabela de testes formatada
- Rodapé com data e hora

#### TC010: Exportação PDF - Relatório Complexo
**Objetivo**: Verificar PDF com múltiplos testes e dados extensos

**Pré-condições**:
- Relatório com 10+ testes
- Observações longas
- Múltiplos equipamentos

**Passos**:
1. Acessar relatório complexo
2. Clicar em "Exportar PDF"
3. Verificar paginação
4. Validar formatação

**Resultado Esperado**:
- PDF com múltiplas páginas se necessário
- Formatação consistente
- Dados completos preservados
- Tamanho de arquivo razoável (< 5MB)

#### TC011: Exportação CSV - Dados Completos
**Objetivo**: Verificar exportação CSV com todos os relatórios

**Pré-condições**:
- Múltiplos relatórios criados

**Passos**:
1. Acessar Dashboard
2. Clicar em "Exportar CSV"
3. Selecionar período (últimos 30 dias)
4. Baixar arquivo

**Resultado Esperado**:
- CSV com cabeçalhos corretos
- Todos os relatórios do período
- Dados separados por vírgula
- Encoding UTF-8
- Compatível com Excel

#### TC012: Exportação CSV - Filtros Aplicados
**Objetivo**: Verificar exportação com filtros específicos

**Pré-condições**:
- Relatórios com diferentes clientes e resultados

**Passos**:
1. Aplicar filtro por cliente
2. Aplicar filtro por resultado (BOM)
3. Clicar em "Exportar CSV"
4. Verificar dados exportados

**Resultado Esperado**:
- Apenas dados filtrados no CSV
- Cabeçalhos mantidos
- Formato consistente

#### TC013: Backup Completo do Sistema
**Objetivo**: Verificar backup de todos os dados

**Pré-condições**:
- Sistema com dados de teste

**Passos**:
1. Acessar "Exportar" no menu
2. Clicar em "Backup Completo"
3. Aguardar geração do arquivo JSON
4. Verificar conteúdo

**Resultado Esperado**:
- JSON com estrutura completa
- Todos os equipamentos incluídos
- Todos os relatórios incluídos
- Todos os testes incluídos
- Configurações de limites incluídas
- Metadata de exportação

#### TC014: Restauração de Backup
**Objetivo**: Verificar restauração de dados

**Pré-condições**:
- Backup JSON válido gerado

**Passos**:
1. Limpar dados do sistema
2. Acessar "Importar" no menu
3. Selecionar arquivo de backup
4. Confirmar restauração
5. Verificar dados restaurados

**Resultado Esperado**:
- Todos os dados restaurados
- Relacionamentos preservados
- Configurações restauradas
- Sistema funcional após restauração

### 🔍 Validações Específicas

#### TC015: Validação de Limites de Entrada
**Objetivo**: Verificar validação de valores de entrada

**Cenários de Teste**:
- Tensão negativa → Deve rejeitar
- Tensão > 50 kV → Deve rejeitar
- Duração = 0 → Deve rejeitar
- Duração > 60 min → Deve rejeitar
- Valor Megger < 0.1 MΩ → Deve rejeitar
- Valor Hipot < 0.001 mA → Deve rejeitar

#### TC016: Validação de Classificação
**Objetivo**: Verificar regras de classificação

**Cenários de Teste**:
- Megger 600 MΩ → Deve classificar como BOM
- Megger 300 MΩ → Deve classificar como ACEITÁVEL
- Megger 30 MΩ → Deve classificar como REPROVADO
- Hipot 1.5 mA → Deve classificar como BOM
- Hipot 3.5 mA → Deve classificar como ACEITÁVEL
- Hipot 8.0 mA → Deve classificar como REPROVADO

#### TC017: Performance de Geração
**Objetivo**: Verificar performance com grandes volumes

**Passos**:
1. Criar 100 relatórios com 5 testes cada
2. Medir tempo de geração
3. Verificar responsividade da interface
4. Testar exportação de todos os dados

**Resultado Esperado**:
- Geração em < 30 segundos
- Interface responsiva
- Exportação em < 60 segundos
- Sem erros de memória

### 📱 Testes de Interface

#### TC018: Responsividade Mobile
**Objetivo**: Verificar funcionamento em dispositivos móveis

**Passos**:
1. Acessar sistema em smartphone
2. Navegar por todas as páginas
3. Criar relatório completo
4. Exportar PDF/CSV
5. Verificar usabilidade

**Resultado Esperado**:
- Interface adaptada para mobile
- Navegação funcional
- Formulários utilizáveis
- Exportação funcionando

#### TC019: Navegação por Teclado
**Objetivo**: Verificar acessibilidade

**Passos**:
1. Navegar usando apenas teclado
2. Preencher formulários
3. Acessar todas as funcionalidades
4. Verificar feedback visual

**Resultado Esperado**:
- Navegação completa por teclado
- Focus visível em todos os elementos
- Atalhos funcionando
- Screen reader compatível

## 🛠️ Ferramentas de Teste

### Testes Automatizados
- **Jest**: Testes unitários
- **React Testing Library**: Testes de componentes
- **Cypress**: Testes E2E
- **Playwright**: Testes de performance

### Testes Manuais
- **Checklist**: Validação de funcionalidades
- **Exploratório**: Descoberta de bugs
- **Usabilidade**: Feedback de usuários

## 📊 Critérios de Aceitação

### Funcionalidade
- ✅ Todas as funcionalidades principais funcionando
- ✅ Validações aplicadas corretamente
- ✅ Exportações gerando arquivos válidos
- ✅ Dados salvos com integridade

### Performance
- ✅ Tempo de resposta < 2 segundos
- ✅ Geração de relatórios < 30 segundos
- ✅ Exportação < 60 segundos
- ✅ Interface responsiva

### Qualidade
- ✅ Sem erros críticos
- ✅ Mensagens de erro claras
- ✅ Dados consistentes
- ✅ Interface intuitiva

## 🚨 Cenários de Erro

### TC020: Tratamento de Erros de Banco
**Cenário**: IndexedDB indisponível
**Ação**: Sistema deve usar localStorage como fallback
**Resultado**: Funcionalidade mantida com alerta ao usuário

### TC021: Tratamento de Erros de Exportação
**Cenário**: Falha na geração de PDF
**Ação**: Mostrar erro específico e opção de retry
**Resultado**: Usuário informado e pode tentar novamente

### TC022: Tratamento de Dados Corrompidos
**Cenário**: JSON de backup inválido
**Ação**: Validar estrutura antes de importar
**Resultado**: Rejeitar importação com mensagem clara

## 📈 Métricas de Qualidade

### Cobertura de Testes
- **Unitários**: > 80%
- **Integração**: > 70%
- **E2E**: > 60%

### Performance
- **Tempo de Carregamento**: < 3s
- **Tempo de Resposta**: < 2s
- **Uso de Memória**: < 100MB

### Qualidade de Código
- **Bugs Críticos**: 0
- **Bugs Maiores**: < 5
- **Code Coverage**: > 80%

## 🔄 Processo de Teste

### 1. Preparação
- Ambiente de teste configurado
- Dados de teste preparados
- Ferramentas de teste instaladas

### 2. Execução
- Testes automatizados executados
- Testes manuais realizados
- Bugs documentados

### 3. Análise
- Resultados analisados
- Relatórios gerados
- Decisões tomadas

### 4. Correção
- Bugs corrigidos
- Testes re-executados
- Validação final

---

**Nota**: Este plano de testes deve ser atualizado conforme o desenvolvimento do projeto e descoberta de novos cenários de teste.
