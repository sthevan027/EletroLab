# Especificação UX - EletriLab

## 📋 Visão Geral

Esta especificação define a experiência do usuário (UX) do sistema EletriLab, incluindo o fluxo de navegação, design das telas e interações principais.

## 🎨 Design System

### Tema Visual
- **Tema**: Dark mode predominante
- **Cor Primária**: Azul (#3B82F6)
- **Cor Secundária**: Verde (#10B981)
- **Cor de Aviso**: Amarelo (#F59E0B)
- **Cor de Erro**: Vermelho (#EF4444)
- **Background**: Cinza escuro (#1F2937)
- **Superfície**: Cinza médio (#374151)
- **Texto**: Branco (#F9FAFB)

### Tipografia
- **Fonte Principal**: Inter ou system-ui
- **Títulos**: Font-weight 600-700
- **Corpo**: Font-weight 400-500
- **Legendas**: Font-weight 300

### Componentes Base
- **Botões**: Bordas arredondadas, padding adequado
- **Cards**: Sombra sutil, bordas arredondadas
- **Inputs**: Estados focus, error, disabled bem definidos
- **Gráficos**: Cores consistentes com o tema

## 📱 Estrutura de Navegação

### Layout Principal
```
┌─────────────────────────────────────┐
│ Header (Logo + Menu + User)         │
├─────────────────────────────────────┤
│ Sidebar (Navegação)                 │ │
│                                     │ │
│ ┌─────────────────────────────────┐ │ │
│ │ Content Area                    │ │ │
│ │                                 │ │ │
│ │                                 │ │ │
│ └─────────────────────────────────┘ │ │
└─────────────────────────────────────┘ │
```

### Menu de Navegação
- **Dashboard** - Visão geral
- **Novo Relatório** - Criar relatório
- **Relatórios** - Lista de relatórios
- **Equipamentos** - Gestão de equipamentos
- **Parâmetros** - Configurações
- **Exportar** - Backup/restore

## 🏠 Dashboard

### Layout da Tela
```
┌─────────────────────────────────────────────────────────┐
│ Dashboard - Visão Geral                                 │
├─────────────────────────────────────────────────────────┤
│ KPIs Cards (4 colunas)                                  │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │Total    │ │BOM      │ │Aceitável│ │Reprovado│        │
│ │Relatórios│ │(60%)    │ │(25%)    │ │(15%)    │        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
├─────────────────────────────────────────────────────────┤
│ Gráficos (2 colunas)                                    │
│ ┌─────────────────┐ ┌─────────────────┐                │
│ │ Pizza: Resultados│ │ Barras: Categorias│                │
│ │                 │ │                 │                │
│ └─────────────────┘ └─────────────────┘                │
├─────────────────────────────────────────────────────────┤
│ Ações Rápidas                                           │
│ [Novo Relatório] [Ver Todos] [Exportar Dados]          │
└─────────────────────────────────────────────────────────┘
```

### Elementos Interativos
- **Cards de KPI**: Clicáveis para filtrar dados
- **Gráficos**: Interativos com tooltips
- **Botão Novo Relatório**: Destaque visual
- **Filtros**: Por período, cliente, resultado

### Estados
- **Loading**: Skeleton cards durante carregamento
- **Empty**: Mensagem quando não há dados
- **Error**: Tratamento de erros com retry

## 📝 Novo Relatório

### Layout da Tela
```
┌─────────────────────────────────────────────────────────┐
│ Novo Relatório - Passo 1/3                              │
├─────────────────────────────────────────────────────────┤
│ Informações Básicas                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Cliente: [________________]                         │ │
│ │ Local:   [________________]                         │ │
│ │ Operador: [________________]                        │ │
│ │ Data:    [__/__/____]                               │ │
│ │ Observações:                                        │ │
│ │ [________________________________]                  │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ [Anterior] [Próximo] [Salvar Rascunho]                 │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de Criação (3 Passos)

#### Passo 1: Informações Básicas
- Cliente (opcional)
- Local do teste (opcional)
- Operador responsável (opcional)
- Data do relatório
- Observações (opcional)

#### Passo 2: Seleção de Equipamentos
```
┌─────────────────────────────────────────────────────────┐
│ Selecionar Equipamentos                                 │
├─────────────────────────────────────────────────────────┤
│ Filtros: [Categoria ▼] [Buscar: _____]                 │
├─────────────────────────────────────────────────────────┤
│ Lista de Equipamentos                                   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ☐ Motor M-001 (Tag: M001)                          │ │
│ │ ☐ Cabo C-002 (Tag: C002)                           │ │
│ │ ☐ Transformador T-003 (Tag: T003)                  │ │
│ │ ☐ Painel P-004 (Tag: P004)                         │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ [+ Adicionar Equipamento]                              │
└─────────────────────────────────────────────────────────┘
```

#### Passo 3: Configuração de Testes
```
┌─────────────────────────────────────────────────────────┐
│ Configurar Testes                                       │
├─────────────────────────────────────────────────────────┤
│ Equipamento: Motor M-001                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Tipo: [Megger ▼]                                    │ │
│ │ Tensão: [1.0] kV                                    │ │
│ │ Duração: [5] min                                     │ │
│ │ Valor: [Gerar Aleatório] [500] MΩ                   │ │
│ │ Resultado: 🟢 BOM                                    │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ [+ Adicionar Teste] [Gerar Todos Aleatórios]           │
└─────────────────────────────────────────────────────────┘
```

### Interações Especiais
- **Geração Aleatória**: Botão com ícone de dados
- **Validação em Tempo Real**: Feedback visual imediato
- **Auto-save**: Salva progresso automaticamente
- **Preview**: Visualização do relatório antes de salvar

## 📊 Detalhe do Relatório

### Layout da Tela
```
┌─────────────────────────────────────────────────────────┐
│ Relatório #2024-001 - Cliente XYZ                      │
├─────────────────────────────────────────────────────────┤
│ Informações do Relatório                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Cliente: Cliente XYZ                                │ │
│ │ Local: Fábrica ABC                                  │ │
│ │ Operador: João Silva                                │ │
│ │ Data: 15/01/2024                                    │ │
│ │ Status: ✅ Concluído                                │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Testes Realizados                                       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Motor M-001 - Megger - 500 MΩ - 🟢 BOM             │ │
│ │ Cabo C-002 - Hipot AC - 2.5 mA - 🟡 ACEITÁVEL     │ │
│ │ Transformador T-003 - Megger - 1500 MΩ - 🟢 BOM    │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Ações: [Editar] [Exportar PDF] [Exportar CSV] [Excluir] │
└─────────────────────────────────────────────────────────┘
```

### Funcionalidades
- **Visualização Completa**: Todos os dados do relatório
- **Edição**: Modificar dados se necessário
- **Exportação**: PDF e CSV
- **Histórico**: Ver versões anteriores

## 🔧 Equipamentos

### Layout da Tela
```
┌─────────────────────────────────────────────────────────┐
│ Gestão de Equipamentos                                  │
├─────────────────────────────────────────────────────────┤
│ Filtros: [Categoria ▼] [Buscar: _____] [+ Novo]        │
├─────────────────────────────────────────────────────────┤
│ Lista de Equipamentos                                   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Motor M-001 │ Tag: M001 │ Série: SN001 │ [Editar]  │ │
│ │ Cabo C-002  │ Tag: C002 │ Série: SN002 │ [Editar]  │ │
│ │ Transf T-003│ Tag: T003 │ Série: SN003 │ [Editar]  │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Modal de Criação/Edição
```
┌─────────────────────────────────────────────────────────┐
│ [X] Novo Equipamento                                    │
├─────────────────────────────────────────────────────────┤
│ Categoria: [Motor ▼]                                    │
│ Tag: [M-001]                                            │
│ Número de Série: [SN001] (opcional)                     │
│ Tempo em Serviço: [12] meses (opcional)                 │
├─────────────────────────────────────────────────────────┤
│ [Cancelar] [Salvar]                                     │
└─────────────────────────────────────────────────────────┘
```

## ⚙️ Parâmetros

### Layout da Tela
```
┌─────────────────────────────────────────────────────────┐
│ Configuração de Parâmetros                              │
├─────────────────────────────────────────────────────────┤
│ Tipo de Teste: [Megger ▼]                               │
│ Categoria: [Motor ▼]                                    │
├─────────────────────────────────────────────────────────┤
│ Limites de Classificação                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Mínimo: [50] MΩ                                      │ │
│ │ Bom:    [500] MΩ                                     │ │
│ │ Unidade: [MΩ]                                        │ │
│ │ Descrição: [Motores elétricos]                       │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ [Restaurar Padrões] [Salvar] [Exportar Config]          │
└─────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Usuário Principal

### 1. Primeiro Acesso
```
Usuário acessa → Dashboard vazio → Tutorial → Configurar parâmetros
```

### 2. Criação de Relatório
```
Dashboard → Novo Relatório → Preencher dados → Selecionar equipamentos → 
Configurar testes → Gerar valores → Salvar → Dashboard atualizado
```

### 3. Visualização de Resultados
```
Dashboard → Clicar em relatório → Detalhes → Exportar → Compartilhar
```

### 4. Gestão de Equipamentos
```
Menu → Equipamentos → Lista → Adicionar/Editar → Salvar → Atualizar lista
```

### 5. Configuração de Parâmetros
```
Menu → Parâmetros → Selecionar tipo/categoria → Editar limites → Salvar
```

## 🎯 Micro-interações

### Feedback Visual
- **Hover**: Cards elevam ligeiramente
- **Click**: Feedback tátil (ripple effect)
- **Loading**: Spinners contextuais
- **Success**: Toast notifications verdes
- **Error**: Toast notifications vermelhas
- **Warning**: Toast notifications amarelas

### Animações
- **Transições**: 200ms ease-in-out
- **Entrada**: Fade in + slide up
- **Saída**: Fade out + slide down
- **Loading**: Pulse animation
- **Progress**: Barra de progresso animada

### Estados de Botões
- **Default**: Azul com hover
- **Loading**: Spinner + disabled
- **Success**: Verde temporário
- **Error**: Vermelho temporário
- **Disabled**: Cinza + cursor not-allowed

## 📱 Responsividade

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Adaptações Mobile
- **Sidebar**: Collapsible menu
- **Cards**: Stack vertical
- **Forms**: Full width inputs
- **Tables**: Scroll horizontal
- **Modals**: Full screen

### Adaptações Tablet
- **Layout**: 2 colunas quando possível
- **Navigation**: Sidebar sempre visível
- **Forms**: 2 colunas em telas maiores

## ♿ Acessibilidade

### Navegação por Teclado
- **Tab**: Navegação sequencial
- **Enter/Space**: Ativar elementos
- **Escape**: Fechar modais
- **Arrow keys**: Navegar em listas

### Screen Readers
- **Labels**: Todos os inputs têm labels
- **ARIA**: Roles e states apropriados
- **Alt text**: Imagens descritivas
- **Headings**: Hierarquia clara

### Contraste
- **WCAG AA**: Mínimo 4.5:1
- **Text**: Alto contraste
- **Interactive**: Estados visuais claros

## 🚀 Performance UX

### Loading States
- **Skeleton**: Durante carregamento inicial
- **Progressive**: Carrega dados essenciais primeiro
- **Lazy**: Carrega dados sob demanda
- **Cache**: Dados recentes em memória

### Otimizações
- **Debounce**: Inputs de busca
- **Throttle**: Scroll events
- **Virtualization**: Listas grandes
- **Preload**: Dados prováveis

## 📊 Analytics UX

### Eventos Rastreados
- **Page Views**: Todas as páginas
- **Button Clicks**: Ações principais
- **Form Submissions**: Criação/edição
- **Export Actions**: PDF/CSV
- **Error Events**: Falhas de validação

### Métricas Importantes
- **Time to Complete**: Criação de relatório
- **Error Rate**: Validações falhadas
- **Export Success**: Taxa de sucesso
- **User Flow**: Caminhos mais usados

---

**Nota**: Esta especificação UX deve ser revisada e atualizada conforme o desenvolvimento do projeto e feedback dos usuários.
