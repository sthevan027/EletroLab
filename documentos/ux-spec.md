# Especificação UX - EletriLab

## 📋 Visão Geral

Esta especificação define a experiência do usuário para o EletriLab Ultra-MVP, um sistema especializado na geração rápida de relatórios Megger/IR no formato "cupom".

## 🎯 Princípios de Design

### Tema Visual
- **Tema**: Dark mode predominante
- **Cor Primária**: Azul (#3B82F6)
- **Cor Secundária**: Verde (#10B981)
- **Cor de Aviso**: Amarelo (#F59E0B)
- **Cor de Erro**: Vermelho (#EF4444)
- **Background**: Cinza escuro (#1F2937)
- **Superfície**: Cinza médio (#374151)
- **Texto**: Branco (#F9FAFB)

### Flexibilidade
- **Duas Modalidades**: Gerar rápido (sem salvar) e Novo relatório (com histórico)
- **Campos Opcionais**: Não bloqueiam a geração
- **Validação Suave**: Avisos em vez de erros bloqueantes

### Eficiência
- **Geração Rápida**: Relatórios em segundos
- **Exportação Direta**: PDF e CSV com um clique
- **Navegação Intuitiva**: Acesso rápido às funcionalidades

## 📱 Estrutura de Navegação

### Menu Principal
```
Dashboard
├── Gerar Rápido
├── Novo Relatório
├── Histórico
└── Parâmetros
```

### Fluxo de Páginas
1. **Dashboard** → Ponto de entrada com KPIs e ações rápidas
2. **Gerar Rápido** → Formulário mínimo para simulação
3. **Novo Relatório** → Formulário completo com toggle de modo
4. **Histórico** → Lista de relatórios salvos
5. **Parâmetros** → Configurações do sistema

## 🏠 Dashboard

### Layout
```
┌─────────────────────────────────────┐
│ Header: Logo + Título + Tema        │
├─────────────────────────────────────┤
│ KPIs Cards (3 colunas)              │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │ Total   │ │ Bom %   │ │ Salvos  │ │
│ │ Relatórios│ │ Aceitável│ │ Hoje │ │
│ └─────────┘ └─────────┘ └─────────┘ │
├─────────────────────────────────────┤
│ Ações Rápidas                       │
│ ┌─────────────┐ ┌─────────────┐     │
│ │ Gerar Rápido│ │ Novo Relatório│   │
│ │ (Preview)   │ │ (Salvar)    │     │
│ └─────────────┘ └─────────────┘     │
├─────────────────────────────────────┤
│ Últimos Relatórios (5 itens)        │
│ ┌─────────────────────────────────┐ │
│ │ REL-2024-0001 | Cabo | 15/01    │ │
│ │ REL-2024-0002 | Motor | 14/01   │ │
│ │ ...                             │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Elementos
- **Header**: Logo, título "EletriLab", toggle de tema (claro/escuro)
- **KPIs**: Cards com estatísticas principais
- **Ações Rápidas**: Botões grandes e destacados
- **Histórico**: Lista compacta dos últimos relatórios

## ⚡ Gerar Rápido

### Layout
```
┌─────────────────────────────────────┐
│ Header: Breadcrumb + Título         │
├─────────────────────────────────────┤
│ Formulário Mínimo                   │
│ ┌─────────────────────────────────┐ │
│ │ Categoria *                     │ │
│ │ [Dropdown: Cabo/Motor/Bomba/    │ │
│ │  Trafo/Outro]                   │ │
│ │                                 │ │
│ │ Tensão (kV) *                   │ │
│ │ [Input: 1.00]                   │ │
│ │                                 │ │
│ │ Tag (opcional)                  │ │
│ │ [Input: vazio]                  │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Botão de Ação                       │
│ ┌─────────────────────────────────┐ │
│ │        [Gerar Valores]          │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Preview do Cupom (quando gerado)    │
│ ┌─────────────────────────────────┐ │
│ │ RELATÓRIO IR - PREVIEW          │ │
│ │ Categoria: Cabo                 │ │
│ │ Tensão: 1.00 kV                 │ │
│ │                                 │ │
│ │ Tempo | kV | Resistência        │ │
│ │ 00:15  | 1.00 | 15.23GΩ        │ │
│ │ 00:30  | 1.00 | 17.45GΩ        │ │
│ │ 00:45  | 1.00 | 19.67GΩ        │ │
│ │ 01:00  | 1.00 | 21.89GΩ        │ │
│ │                                 │ │
│ │ DAI: 1.25                       │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Ações de Exportação                 │
│ ┌─────────────┐ ┌─────────────┐     │
│ │ Exportar PDF│ │ Exportar CSV│     │
│ └─────────────┘ └─────────────┘     │
└─────────────────────────────────────┘
```

### Estados
1. **Estado Inicial**: Formulário vazio, botão desabilitado
2. **Validação**: Campos obrigatórios preenchidos, botão habilitado
3. **Geração**: Loading no botão, preview aparece
4. **Resultado**: Preview visível, botões de exportação habilitados

## 📝 Novo Relatório

### Layout
```
┌─────────────────────────────────────┐
│ Header: Breadcrumb + Título         │
├─────────────────────────────────────┤
│ Toggle de Modo                      │
│ ┌─────────────────────────────────┐ │
│ │ [Gerar] ←→ [Salvar]             │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Formulário Completo                 │
│ ┌─────────────────────────────────┐ │
│ │ Categoria *                     │ │
│ │ [Dropdown]                      │ │
│ │                                 │ │
│ │ Tensão (kV) *                   │ │
│ │ [Input: 1.00]                   │ │
│ │                                 │ │
│ │ Tag (opcional)                  │ │
│ │ [Input]                         │ │
│ │                                 │ │
│ │ Cliente (opcional)              │ │
│ │ [Input]                         │ │
│ │                                 │ │
│ │ Site (opcional)                 │ │
│ │ [Input]                         │ │
│ │                                 │ │
│ │ Operador (opcional)             │ │
│ │ [Input]                         │ │
│ │                                 │ │
│ │ Fabricante (opcional)           │ │
│ │ [Input]                         │ │
│ │                                 │ │
│ │ Modelo (opcional)               │ │
│ │ [Input]                         │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Botão de Ação                       │
│ ┌─────────────────────────────────┐ │
│ │        [Gerar Valores]          │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Preview do Cupom                    │
│ ┌─────────────────────────────────┐ │
│ │ RELATÓRIO IR                    │ │
│ │ Número: REL-2024-0001           │ │
│ │ Data: 15/01/2024                │ │
│ │ Categoria: Cabo                 │ │
│ │ Cliente: Empresa ABC            │ │
│ │ Site: Planta Principal          │ │
│ │ Operador: João Silva            │ │
│ │                                 │ │
│ │ Tempo | kV | Resistência        │ │
│ │ 00:15  | 1.00 | 15.23GΩ        │ │
│ │ 00:30  | 1.00 | 17.45GΩ        │ │
│ │ 00:45  | 1.00 | 19.67GΩ        │ │
│ │ 01:00  | 1.00 | 21.89GΩ        │ │
│ │                                 │ │
│ │ DAI: 1.25                       │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Ações (dependem do modo)            │
│ ┌─────────────┐ ┌─────────────┐     │
│ │   Salvar    │ │ Exportar PDF│     │
│ └─────────────┘ └─────────────┘     │
│ ┌─────────────┐                     │
│ │ Exportar CSV│                     │
│ └─────────────┘                     │
└─────────────────────────────────────┘
```

### Toggle de Modo
- **Gerar**: Apenas preview, não salva no banco
- **Salvar**: Preview + botão salvar + histórico

## 📊 Histórico

### Layout
```
┌─────────────────────────────────────┐
│ Header: Breadcrumb + Título         │
├─────────────────────────────────────┤
│ Filtros                             │
│ ┌─────────────────────────────────┐ │
│ │ Categoria: [Todos ▼]            │ │
│ │ Período: [Últimos 30 dias ▼]    │ │
│ │ Buscar: [Input]                 │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Lista de Relatórios                 │
│ ┌─────────────────────────────────┐ │
│ │ REL-2024-0001 | Cabo | 15/01   │ │
│ │ Cliente: Empresa ABC            │ │
│ │ [Ver] [Exportar PDF] [Exportar CSV]│
│ ├─────────────────────────────────┤ │
│ │ REL-2024-0002 | Motor | 14/01  │ │
│ │ Cliente: Empresa XYZ            │ │
│ │ [Ver] [Exportar PDF] [Exportar CSV]│
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Paginação                           │
│ ┌─────────────────────────────────┐ │
│ │ [Anterior] 1 2 3 [Próximo]      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Funcionalidades
- **Filtros**: Por categoria, período, busca por texto
- **Ações**: Ver detalhes, exportar PDF/CSV
- **Paginação**: 10 itens por página

## ⚙️ Parâmetros

### Layout
```
┌─────────────────────────────────────┐
│ Header: Breadcrumb + Título         │
├─────────────────────────────────────┤
│ Abas                                │
│ ┌─────────────────────────────────┐ │
│ │ [Perfis] [OVRG] [Exportação]    │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Conteúdo da Aba                     │
│ ┌─────────────────────────────────┐ │
│ │ Perfis por Categoria            │ │
│ │                                 │ │
│ │ Cabo                            │ │
│ │ Base (GΩ): [5] - [20]           │ │
│ │ Growth: [1.05] - [1.18]         │ │
│ │ Mínimo Bom: [20] GΩ             │ │
│ │                                 │ │
│ │ Motor                           │ │
│ │ Base (GΩ): [1] - [5]            │ │
│ │ Growth: [1.03] - [1.12]         │ │
│ │ Mínimo Bom: [5] GΩ              │ │
│ │                                 │ │
│ │ [Salvar Configurações]          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Abas
1. **Perfis**: Configuração dos perfis por categoria
2. **OVRG**: Limite OVRG (default: 5 TΩ)
3. **Exportação**: Configurações de PDF/CSV

## 🎨 Design System

### Cores
```css
/* Primárias */
--primary: #3b82f6;      /* Azul */
--primary-dark: #2563eb; /* Azul escuro */
--primary-light: #60a5fa; /* Azul claro */

/* Neutras */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;

/* Estados */
--success: #10b981;      /* Verde */
--warning: #f59e0b;      /* Amarelo */
--error: #ef4444;        /* Vermelho */
--info: #3b82f6;         /* Azul */
```

### Tipografia
```css
/* Família */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Tamanhos */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

### Componentes

#### Botões
```css
/* Primário */
.btn-primary {
  background: var(--primary);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
}

/* Secundário */
.btn-secondary {
  background: var(--gray-100);
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
}

/* Tamanhos */
.btn-sm { padding: 0.25rem 0.5rem; }
.btn-lg { padding: 0.75rem 1.5rem; }
```

#### Inputs
```css
.input {
  border: 1px solid var(--gray-300);
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: var(--text-sm);
}

.input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

#### Cards
```css
.card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

## 📱 Responsividade

### Breakpoints
```css
/* Mobile First */
--sm: 640px;   /* Tablet pequeno */
--md: 768px;   /* Tablet */
--lg: 1024px;  /* Desktop pequeno */
--xl: 1280px;  /* Desktop */
--2xl: 1536px; /* Desktop grande */
```

### Layouts Adaptativos

#### Mobile (< 768px)
- **Dashboard**: Cards empilhados, botões full-width
- **Formulários**: Campos empilhados, labels acima
- **Tabelas**: Cards horizontais
- **Navegação**: Menu hambúrguer

#### Tablet (768px - 1024px)
- **Dashboard**: 2 colunas de KPIs
- **Formulários**: 2 colunas quando possível
- **Tabelas**: Scroll horizontal
- **Navegação**: Menu lateral colapsável

#### Desktop (> 1024px)
- **Dashboard**: 3 colunas de KPIs
- **Formulários**: Layout em grid
- **Tabelas**: Layout completo
- **Navegação**: Menu lateral fixo

## 🔄 Estados e Transições

### Loading States
```css
.loading {
  opacity: 0.6;
  pointer-events: none;
}

.spinner {
  border: 2px solid var(--gray-200);
  border-top: 2px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

### Feedback Visual
- **Sucesso**: Toast verde com ícone de check
- **Erro**: Toast vermelho com ícone de X
- **Aviso**: Toast amarelo com ícone de alerta
- **Info**: Toast azul com ícone de info

### Animações
```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Slide In */
@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
```

## ♿ Acessibilidade

### Navegação por Teclado
- **Tab**: Navegação sequencial
- **Enter/Space**: Ativar botões
- **Escape**: Fechar modais
- **Arrow Keys**: Navegar dropdowns

### Screen Readers
- **Labels**: Todos os inputs têm labels
- **ARIA**: Roles e estados apropriados
- **Alt Text**: Imagens com descrições
- **Focus**: Indicadores visuais de foco

### Contraste
- **Texto**: Mínimo 4.5:1
- **Botões**: Mínimo 3:1
- **Links**: Sublinhados ou contraste adicional

## 📋 Wireframes

### Dashboard Mobile
```
┌─────────────────┐
│ EletriLab       │
├─────────────────┤
│ ┌─────────────┐ │
│ │ Total: 45   │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ Bom: 67%    │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ Salvos: 3   │ │
│ └─────────────┘ │
├─────────────────┤
│ ┌─────────────┐ │
│ │ Gerar Rápido│ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ Novo Relatório│
│ └─────────────┘ │
├─────────────────┤
│ Últimos:        │
│ • REL-2024-0001 │
│ • REL-2024-0002 │
└─────────────────┘
```

### Formulário Desktop
```
┌─────────────────────────────────────┐
│ Novo Relatório                      │
├─────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────┐ │
│ │ Categoria * │ │ Tensão (kV) *   │ │
│ │ [Dropdown]  │ │ [1.00]          │ │
│ └─────────────┘ └─────────────────┘ │
│ ┌─────────────┐ ┌─────────────────┐ │
│ │ Tag         │ │ Cliente         │ │
│ │ [Input]     │ │ [Input]         │ │
│ └─────────────┘ └─────────────────┘ │
│ ┌─────────────┐ ┌─────────────────┐ │
│ │ Site        │ │ Operador        │ │
│ │ [Input]     │ │ [Input]         │ │
│ └─────────────┘ └─────────────────┘ │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │        [Gerar Valores]          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 🎯 Métricas de UX

### Performance
- **Tempo de Carregamento**: < 2 segundos
- **Geração de Relatório**: < 1 segundo
- **Exportação**: < 3 segundos

### Usabilidade
- **Taxa de Conclusão**: > 95%
- **Tempo para Primeiro Relatório**: < 30 segundos
- **Satisfação**: > 4.5/5

### Acessibilidade
- **WCAG 2.1 AA**: Conformidade completa
- **Navegação por Teclado**: 100% funcional
- **Screen Reader**: Compatibilidade total

---

**Nota**: Esta especificação UX garante uma experiência intuitiva e eficiente para geração rápida de relatórios Megger/IR.
