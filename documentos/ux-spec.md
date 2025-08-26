# Especificação de UX - EletriLab Ultra-MVP com IA

## Visão Geral

O EletriLab Ultra-MVP com IA oferece uma experiência de usuário simplificada e inteligente para geração de relatórios Megger/IR, com suporte a geração multi-fase e assistente de configuração.

## Princípios de Design

### Tema Visual
- **Tema**: Dark mode predominante
- **Cor Primária**: Azul (#3B82F6)
- **Cor Secundária**: Verde (#10B981)
- **Cor de Aviso**: Amarelo (#F59E0B)
- **Cor de Erro**: Vermelho (#EF4444)
- **Background**: Cinza escuro (#1F2937)
- **Superfície**: Cinza médio (#374151)
- **Texto**: Branco (#F9FAFB)

### Simplicidade
- **Interface limpa**: Foco no essencial, sem distrações
- **Fluxo linear**: Processo passo a passo claro
- **Feedback imediato**: Validação e preview em tempo real

### Inteligência
- **Assistente contextual**: Guia o usuário através da configuração
- **Validação inteligente**: Detecta problemas e sugere correções
- **Aprendizado**: Interface adapta-se ao uso do usuário

### Flexibilidade
- **Múltiplos modos**: Geração simples e multi-fase
- **Configuração personalizada**: Fases e combinações flexíveis
- **Exportação variada**: PDF e CSV para diferentes necessidades

## Fluxo de Usuário

### 1. Dashboard Principal

**Objetivo**: Ponto de entrada central com acesso rápido às funcionalidades

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ EletriLab - Gerador de Relatórios Megger/IR            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 KPIs Principais                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ Total   │ │ Salvos  │ │ Multi-  │ │ IA      │       │
│  │ Relat.  │ │ Hoje    │ │ Fase    │ │ Aprend. │       │
│  │ 1,234   │ │ 45      │ │ 89      │ │ 92%     │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│                                                         │
│  🚀 Ações Rápidas                                       │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [Gerar Rápido] [Gerar Multi-Fase] [Parâmetros]     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  📋 Relatórios Recentes                                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ R/S - Test 1458 | 23/08/2023 | 5.23GΩ | DAI: 1.29  │ │
│  │ S/T - Test 1459 | 23/08/2023 | 5.89GΩ | DAI: 1.29  │ │
│  │ R/T - Test 1460 | 23/08/2023 | 6.70GΩ | DAI: 1.29  │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Funcionalidades**:
- **KPIs em tempo real**: Estatísticas de uso e qualidade
- **Ações rápidas**: Acesso direto às funcionalidades principais
- **Histórico recente**: Últimos relatórios gerados
- **Indicadores de IA**: Confiança e aprendizado do sistema

### 2. Geração Simples (Gerar Rápido)

**Objetivo**: Geração rápida de relatório único sem salvamento

**Fluxo**:
```
1. Seleção de Categoria e Tensão
   ┌─────────────────────────────────────┐
   │ Configuração Básica                 │
   ├─────────────────────────────────────┤
   │ Categoria: [Cabo ▼]                 │
   │ Tensão: [1.00] kV                   │
   │                                     │
   │ Campos Opcionais:                   │
   │ Fabricante: [___________]           │
   │ Modelo: [___________]               │
   │ Unit ID: [___________]              │
   │                                     │
   │ [Gerar Valores]                     │
   └─────────────────────────────────────┘

2. Preview do Relatório
   ┌─────────────────────────────────────┐
   │ RELATÓRIO IR - PREVIEW              │
   │                                     │
   │ Fabricante: WEG                     │
   │ Modelo: Motor 10HP                  │
   │ Unit ID: MTR-001                    │
   │                                     │
   │ Tempo    kV     Ohms                │
   │ 00:15    1.00   5.23GΩ              │
   │ 00:30    1.00   5.89GΩ              │
   │ 00:45    1.00   6.70GΩ              │
   │ 01:00    1.00   7.58GΩ              │
   │                                     │
   │ DAI: 1.29                           │
   │                                     │
   │ [Exportar PDF] [Exportar CSV]       │
   └─────────────────────────────────────┘
```

**Características**:
- **Formulário mínimo**: Apenas campos essenciais
- **Preview imediato**: Visualização instantânea do resultado
- **Exportação rápida**: PDF e CSV sem salvamento
- **Validação em tempo real**: Feedback imediato de erros

### 3. Geração Multi-Fase com IA

**Objetivo**: Geração inteligente de múltiplos relatórios com assistente

#### Step 1: Configuração de Equipamento
```
┌─────────────────────────────────────────────────────────┐
│ Assistente de Configuração - Passo 1/3                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📋 Informações do Equipamento                          │
│                                                         │
│ Tipo de Equipamento: [Cabo ▼]                          │
│                                                         │
│ Nomes das Fases: [R,S,T]                               │
│ (separados por vírgula)                                │
│                                                         │
│ Exemplos: R,S,T | A,B,C | L1,L2,L3 | F1,F2,F3         │
│                                                         │
│ 💡 Dica: Use nomes que façam sentido para seu          │
│    equipamento (R=Red, S=Blue, T=Yellow)               │
│                                                         │
│ [Anterior] [Próximo]                                   │
└─────────────────────────────────────────────────────────┘
```

#### Step 2: Tipos de Teste
```
┌─────────────────────────────────────────────────────────┐
│ Assistente de Configuração - Passo 2/3                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🔌 Tipos de Teste                                      │
│                                                         │
│ ☑ Fase/Fase (R/S, S/T, R/T)                           │
│   Combinações:                                          │
│   ☑ R/S  ☑ S/T  ☑ R/T                                 │
│   ☐ R/A  ☐ S/A  ☐ T/A                                 │
│                                                         │
│ ☑ Fase/Massa                                           │
│   Nome da Massa: [M]                                   │
│   (M, GND, TERRA, etc.)                                │
│                                                         │
│ 💡 Dica: Fase/Fase testa isolamento entre fases        │
│    Fase/Massa testa isolamento para terra              │
│                                                         │
│ [Anterior] [Próximo]                                   │
└─────────────────────────────────────────────────────────┘
```

#### Step 3: Condições e Qualidade
```
┌─────────────────────────────────────────────────────────┐
│ Assistente de Configuração - Passo 3/3                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🌡️ Condições do Teste                                  │
│                                                         │
│ Tensão Aplicada: [1.00] kV                            │
│ Temperatura: [25] °C                                  │
│ Umidade: [60] %                                       │
│                                                         │
│ Qualidade Esperada: [Boa ▼]                           │
│ (Excelente | Boa | Aceitável)                         │
│                                                         │
│ 💡 Dica: Condições afetam os valores gerados.          │
│    Qualidade determina a faixa de resistência.         │
│                                                         │
│ [Anterior] [Gerar Todos os Relatórios]                │
└─────────────────────────────────────────────────────────┘
```

#### Resultado: Múltiplos Relatórios
```
┌─────────────────────────────────────────────────────────┐
│ Relatórios Gerados com IA                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📊 Resumo da Geração                                   │
│ • Equipamento: Cabo 3 fases (R, S, T)                 │
│ • Testes: Fase/Fase (R/S, S/T, R/T) + Fase/Massa      │
│ • Total: 6 relatórios                                  │
│ • Confiança IA: 94%                                    │
│                                                         │
│ 📄 Relatórios Gerados                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📋 R/S - Test No: 1458 | DAI: 1.29 | 5.23GΩ       │ │
│ │ 📋 S/T - Test No: 1459 | DAI: 1.29 | 5.89GΩ       │ │
│ │ 📋 R/T - Test No: 1460 | DAI: 1.29 | 6.70GΩ       │ │
│ │ 📋 R/M - Test No: 1461 | DAI: 1.28 | 4.18GΩ       │ │
│ │ 📋 S/M - Test No: 1462 | DAI: 1.28 | 4.71GΩ       │ │
│ │ 📋 T/M - Test No: 1463 | DAI: 1.28 | 4.44GΩ       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ 💡 Comentários IA:                                     │
│ • Valores correlacionados entre fases                  │
│ • Fase/massa ~80% da fase individual                   │
│ • Crescimento consistente ao longo do tempo            │
│                                                         │
│ [Exportar Todos PDF] [Exportar CSV] [Salvar Config.]   │
└─────────────────────────────────────────────────────────┘
```

### 4. Página de Parâmetros

**Objetivo**: Configuração de perfis e limites do sistema

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ Parâmetros do Sistema                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🔧 Configurações Gerais                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Limite OVRG: [5] TΩ                                │ │
│ │ Tensão Padrão: [1.00] kV                           │ │
│ │ Qualidade Padrão: [Boa ▼]                          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ 📊 Perfis por Categoria                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Categoria: [Cabo ▼]                                 │ │
│ │                                                      │ │
│ │ Base (GΩ): [5] a [20]                              │ │
│ │ Crescimento: [1.05] a [1.18]                       │ │
│ │ Mínimo Bom: [20] GΩ                                │ │
│ │                                                      │ │
│ │ [Salvar Perfil] [Restaurar Padrão]                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ 🤖 Configurações de IA                                 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Aprendizado: ☑ Habilitado                          │ │
│ │ Threshold Correlação: [0.8]                        │ │
│ │ Threshold Confiança: [0.7]                         │ │
│ │                                                      │ │
│ │ [Limpar Histórico] [Exportar Dados IA]             │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Componentes de Interface

### Botões e Ações

#### Botões Primários
```css
.btn-primary {
  background: #3b82f6;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}
```

#### Botões Secundários
```css
.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}
```

### Campos de Entrada

#### Input Padrão
```css
.input {
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

#### Select
```css
.select {
  appearance: none;
  background-image: url("data:image/svg+xml,...");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1.5em 1.5em;
}
```

### Cards e Containers

#### Card Principal
```css
.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}
```

#### Card de Preview
```css
.preview-card {
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
}
```

## Estados da Interface

### Estados de Loading
```typescript
// Loading simples
<div className="loading-spinner">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  <span>Gerando relatórios...</span>
</div>

// Loading com progresso
<div className="loading-progress">
  <div className="progress-bar">
    <div className="progress-fill" style={{width: '75%'}}></div>
  </div>
  <span>Processando fase R/S... (3/6)</span>
</div>
```

### Estados de Erro
```typescript
// Erro de validação
<div className="error-message">
  <div className="error-icon">⚠️</div>
  <div className="error-content">
    <h4>Erro de Validação</h4>
    <p>Tensão deve estar entre 0.1 e 50 kV</p>
  </div>
</div>

// Erro de IA
<div className="ai-error-message">
  <div className="ai-icon">🤖</div>
  <div className="ai-content">
    <h4>Baixa Confiança da IA</h4>
    <p>Confiança: 65% (threshold: 70%)</p>
    <p>Sugestão: Ajuste os parâmetros ou use valores manuais</p>
  </div>
</div>
```

### Estados de Sucesso
```typescript
// Sucesso de geração
<div className="success-message">
  <div className="success-icon">✅</div>
  <div className="success-content">
    <h4>Relatórios Gerados com Sucesso!</h4>
    <p>6 relatórios criados com confiança de 94%</p>
  </div>
</div>
```

## Responsividade

### Breakpoints
```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### Layout Adaptativo

#### Mobile (< 640px)
```
┌─────────────────┐
│ EletriLab       │
├─────────────────┤
│ [Gerar Rápido]  │
│ [Multi-Fase]    │
│ [Parâmetros]    │
│                 │
│ KPIs:           │
│ • Total: 1,234  │
│ • Salvos: 45    │
└─────────────────┘
```

#### Tablet (640px - 1024px)
```
┌─────────────────────────────────┐
│ EletriLab - Gerador Megger/IR   │
├─────────────────────────────────┤
│                                 │
│ 📊 KPIs                         │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │
│ │Total│ │Salvo│ │Multi│ │IA   │ │
│ │1,234│ │45   │ │89   │ │92%  │ │
│ └─────┘ └─────┘ └─────┘ └─────┘ │
│                                 │
│ 🚀 Ações                        │
│ [Gerar Rápido] [Multi-Fase]     │
└─────────────────────────────────┘
```

#### Desktop (> 1024px)
```
┌─────────────────────────────────────────────────────────┐
│ EletriLab - Sistema de Geração de Relatórios Megger/IR │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📊 KPIs Principais                                     │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│ │ Total   │ │ Salvos  │ │ Multi-  │ │ IA      │       │
│ │ Relat.  │ │ Hoje    │ │ Fase    │ │ Aprend. │       │
│ │ 1,234   │ │ 45      │ │ 89      │ │ 92%     │       │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│                                                         │
│ 🚀 Ações Rápidas                                       │
│ [Gerar Rápido] [Gerar Multi-Fase] [Parâmetros]         │
└─────────────────────────────────────────────────────────┘
```

## Acessibilidade

### Navegação por Teclado
- **Tab**: Navegação sequencial entre elementos
- **Enter/Space**: Ativação de botões e links
- **Escape**: Fecha modais e cancela ações
- **Arrow Keys**: Navegação em listas e selects

### Leitores de Tela
```html
<!-- Labels explícitos -->
<label for="category">Categoria do Equipamento</label>
<select id="category" aria-describedby="category-help">
  <option value="cabo">Cabo</option>
  <option value="motor">Motor</option>
</select>
<div id="category-help">Selecione o tipo de equipamento para teste</div>

<!-- Estados ARIA -->
<button aria-expanded="false" aria-controls="config-panel">
  Configurações
</button>
<div id="config-panel" aria-hidden="true">
  <!-- Conteúdo do painel -->
</div>

<!-- Alertas de status -->
<div role="alert" aria-live="polite">
  Relatórios gerados com sucesso!
</div>
```

### Contraste e Cores
- **Contraste mínimo**: 4.5:1 para texto normal
- **Contraste alto**: 7:1 para texto pequeno
- **Indicadores visuais**: Além de cor, usar ícones e padrões
- **Modo escuro**: Suporte completo com cores adaptadas

## Microinterações

### Feedback Visual
```css
/* Hover effects */
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* Focus states */
.input:focus {
  transform: scale(1.02);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

/* Loading animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Transições Suaves
```css
/* Transições padrão */
* {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Transições específicas */
.card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}
```

## Padrões de Design

### Hierarquia Visual
1. **Títulos principais**: 24px, peso 700
2. **Subtítulos**: 18px, peso 600
3. **Labels**: 14px, peso 500
4. **Texto corpo**: 14px, peso 400
5. **Texto pequeno**: 12px, peso 400

### Espaçamento
```css
/* Sistema de espaçamento */
.space-xs { margin: 0.25rem; }
.space-sm { margin: 0.5rem; }
.space-md { margin: 1rem; }
.space-lg { margin: 1.5rem; }
.space-xl { margin: 2rem; }
```

### Cores
```css
/* Paleta de cores */
:root {
  --primary-50: #eff6ff;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  
  --success-500: #10b981;
  --warning-500: #f59e0b;
  --error-500: #ef4444;
  
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-500: #6b7280;
  --gray-900: #111827;
}
```

---

**Nota**: Esta especificação de UX garante uma experiência consistente e intuitiva, com foco na eficiência e na inteligência do sistema.
