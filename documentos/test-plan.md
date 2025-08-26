# Plano de Testes - EletriLab Ultra-MVP

## 📋 Visão Geral

Este documento define o plano de testes para o EletriLab Ultra-MVP, sistema especializado na geração rápida de relatórios Megger/IR no formato "cupom".

## 🎯 Objetivos dos Testes

### Funcionais
- **Geração Rápida**: Verificar geração de relatórios sem salvar
- **Salvamento**: Verificar persistência no IndexedDB
- **Exportação**: Verificar geração de PDF e CSV
- **Validações**: Verificar regras de validação flexíveis

### Não Funcionais
- **Performance**: Geração em < 1 segundo
- **Usabilidade**: Interface intuitiva e responsiva
- **Acessibilidade**: Conformidade WCAG 2.1 AA
- **Compatibilidade**: Funcionamento em diferentes navegadores

## 🧪 Tipos de Teste

### 1. Testes Unitários
- **Utilitárias**: Funções de formatação e cálculo
- **Validações**: Regras de validação de entrada
- **Geradores**: Lógica de geração de valores
- **Conversões**: Transformação de dados

### 2. Testes de Integração
- **Banco de Dados**: Operações IndexedDB
- **Exportação**: Geração de PDF/CSV
- **Navegação**: Roteamento entre páginas
- **Estado**: Gerenciamento de estado da aplicação

### 3. Testes de Interface
- **Componentes**: Renderização e interação
- **Formulários**: Validação e submissão
- **Responsividade**: Adaptação a diferentes telas
- **Acessibilidade**: Navegação por teclado e screen readers

### 4. Testes End-to-End
- **Fluxos Completos**: Geração → Preview → Exportação
- **Modos de Trabalho**: Gerar Rápido vs Novo Relatório
- **Persistência**: Salvamento e recuperação de dados
- **Migração**: Conversão de dados antigos

## 📊 Cenários de Teste

### Cenário 1: Geração Rápida
```typescript
describe('Geração Rápida', () => {
  test('deve gerar relatório sem salvar', async () => {
    // 1. Acessar página "Gerar Rápido"
    await page.goto('/gerar-rapido');
    
    // 2. Selecionar categoria
    await page.selectOption('[data-testid="category-select"]', 'cabo');
    
    // 3. Definir tensão
    await page.fill('[data-testid="kv-input"]', '1.00');
    
    // 4. Gerar valores
    await page.click('[data-testid="generate-button"]');
    
    // 5. Verificar preview
    await expect(page.locator('[data-testid="preview"])).toBeVisible();
    
    // 6. Verificar que não foi salvo
    const savedReports = await getSavedReports();
    expect(savedReports).toHaveLength(0);
  });
});
```

### Cenário 2: Novo Relatório (Salvar)
```typescript
describe('Novo Relatório - Modo Salvar', () => {
  test('deve salvar relatório no banco', async () => {
    // 1. Acessar página "Novo Relatório"
    await page.goto('/novo-relatorio');
    
    // 2. Alternar para modo "Salvar"
    await page.click('[data-testid="save-mode-toggle"]');
    
    // 3. Preencher formulário
    await page.selectOption('[data-testid="category-select"]', 'motor');
    await page.fill('[data-testid="kv-input"]', '1.00');
    await page.fill('[data-testid="client-input"]', 'Empresa ABC');
    
    // 4. Gerar valores
    await page.click('[data-testid="generate-button"]');
    
    // 5. Salvar relatório
    await page.click('[data-testid="save-button"]');
    
    // 6. Verificar salvamento
    const savedReports = await getSavedReports();
    expect(savedReports).toHaveLength(1);
    expect(savedReports[0].client).toBe('Empresa ABC');
  });
});
```

### Cenário 3: Exportação PDF
```typescript
describe('Exportação PDF', () => {
  test('deve gerar PDF no formato cupom', async () => {
    // 1. Gerar relatório
    await generateReport({ category: 'cabo', kv: 1.00 });
    
    // 2. Exportar PDF
    await page.click('[data-testid="export-pdf-button"]');
    
    // 3. Verificar download
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    
    // 4. Verificar conteúdo
    const pdfContent = await download.createReadStream();
    expect(pdfContent).toContain('RELATÓRIO IR');
    expect(pdfContent).toContain('00:15');
    expect(pdfContent).toContain('01:00');
  });
});
```

### Cenário 4: Validações Flexíveis
```typescript
describe('Validações Flexíveis', () => {
  test('deve permitir geração com campos opcionais vazios', async () => {
    // 1. Preencher apenas campos obrigatórios
    await page.selectOption('[data-testid="category-select"]', 'trafo');
    await page.fill('[data-testid="kv-input"]', '1.00');
    
    // 2. Tentar gerar (deve funcionar)
    await page.click('[data-testid="generate-button"]');
    
    // 3. Verificar que não há erros
    await expect(page.locator('[data-testid="error-message"])).not.toBeVisible();
    
    // 4. Verificar preview
    await expect(page.locator('[data-testid="preview"])).toBeVisible();
  });
});
```

## 🔧 Testes Unitários

### Utilitárias de Formatação
```typescript
describe('formatResistance', () => {
  test('deve formatar valores em Ω', () => {
    expect(formatResistance(500)).toBe('500Ω');
    expect(formatResistance(1234)).toBe('1.23kΩ');
  });
  
  test('deve formatar valores em GΩ', () => {
    expect(formatResistance(1.5e9)).toBe('1.50GΩ');
    expect(formatResistance(25e9)).toBe('25.00GΩ');
  });
  
  test('deve retornar OVRG para valores altos', () => {
    expect(formatResistance(6e12)).toBe('0.99 OVRG');
    expect(formatResistance(10e12)).toBe('0.99 OVRG');
  });
});
```

### Cálculo do DAI
```typescript
describe('calculateDAI', () => {
  test('deve calcular DAI corretamente', () => {
    const readings = [
      { time: '00:15', kv: '1.00', resistance: '1.00GΩ' },
      { time: '00:30', kv: '1.00', resistance: '1.10GΩ' },
      { time: '00:45', kv: '1.00', resistance: '1.20GΩ' },
      { time: '01:00', kv: '1.00', resistance: '1.30GΩ' }
    ];
    
    const dai = calculateDAI(readings);
    expect(dai).toBe('1.18');
  });
  
  test('deve retornar Undefined com OVRG', () => {
    const readings = [
      { time: '00:15', kv: '1.00', resistance: '1.00GΩ' },
      { time: '00:30', kv: '1.00', resistance: '0.99 OVRG' },
      { time: '00:45', kv: '1.00', resistance: '1.20GΩ' },
      { time: '01:00', kv: '1.00', resistance: '1.30GΩ' }
    ];
    
    const dai = calculateDAI(readings);
    expect(dai).toBe('Undefined');
  });
});
```

### Gerador de Série IR
```typescript
describe('gerarSerieIR', () => {
  test('deve gerar série para cabo', () => {
    const result = gerarSerieIR({ category: 'cabo', kv: 1.00 });
    
    expect(result.readings).toHaveLength(4);
    expect(result.readings[0].time).toBe('00:15');
    expect(result.readings[3].time).toBe('01:00');
    
    // Verificar que todos os valores são >= 5GΩ
    result.readings.forEach(reading => {
      const value = parseResistance(reading.resistance);
      expect(value).toBeGreaterThanOrEqual(5e9);
    });
  });
  
  test('deve gerar série para motor', () => {
    const result = gerarSerieIR({ category: 'motor', kv: 1.00 });
    
    expect(result.readings).toHaveLength(4);
    expect(result.dai).toMatch(/^\d+\.\d+$|^Undefined$/);
  });
});
```

## 🗄️ Testes de Banco de Dados

### Operações CRUD
```typescript
describe('IndexedDB Operations', () => {
  beforeEach(async () => {
    await clearDatabase();
  });
  
  test('deve salvar relatório', async () => {
    const report = createTestReport();
    await saveReport(report);
    
    const saved = await getReport(report.id);
    expect(saved).toEqual(report);
  });
  
  test('deve listar relatórios salvos', async () => {
    const reports = [
      createTestReport({ category: 'cabo' }),
      createTestReport({ category: 'motor' }),
      createTestReport({ category: 'trafo' })
    ];
    
    await Promise.all(reports.map(r => saveReport(r)));
    
    const saved = await getSavedReports();
    expect(saved).toHaveLength(3);
  });
  
  test('deve filtrar por categoria', async () => {
    // Criar relatórios de diferentes categorias
    await saveReport(createTestReport({ category: 'cabo' }));
    await saveReport(createTestReport({ category: 'motor' }));
    await saveReport(createTestReport({ category: 'cabo' }));
    
    const cabos = await getReportsByCategory('cabo');
    expect(cabos).toHaveLength(2);
  });
});
```

### Migração de Dados
```typescript
describe('Data Migration', () => {
  test('deve migrar dados da versão 1 para 2', async () => {
    // 1. Criar dados da versão 1
    const v1Data = createV1TestData();
    await insertV1Data(v1Data);
    
    // 2. Executar migração
    await migrateV1ToV2();
    
    // 3. Verificar conversão
    const v2Reports = await getSavedReports();
    expect(v2Reports).toHaveLength(v1Data.reports.length);
    
    // 4. Verificar formato
    v2Reports.forEach(report => {
      expect(report).toHaveProperty('readings');
      expect(report.readings).toHaveLength(4);
      expect(report).toHaveProperty('dai');
    });
  });
});
```

## 🎨 Testes de Interface

### Componentes
```typescript
describe('Components', () => {
  test('ModeToggle deve alternar entre modos', () => {
    render(<ModeToggle mode="generate" onModeChange={mockFn} />);
    
    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);
    
    expect(mockFn).toHaveBeenCalledWith('save');
  });
  
  test('CategorySelect deve mostrar opções válidas', () => {
    render(<CategorySelect value="cabo" onChange={mockFn} />);
    
    expect(screen.getByText('Cabo')).toBeInTheDocument();
    expect(screen.getByText('Motor')).toBeInTheDocument();
    expect(screen.getByText('Bomba')).toBeInTheDocument();
    expect(screen.getByText('Trafo')).toBeInTheDocument();
    expect(screen.getByText('Outro')).toBeInTheDocument();
  });
  
  test('ResistanceDisplay deve formatar valores', () => {
    render(<ResistanceDisplay value="1.50GΩ" />);
    
    expect(screen.getByText('1.50GΩ')).toBeInTheDocument();
  });
});
```

### Formulários
```typescript
describe('Forms', () => {
  test('QuickGenerateForm deve validar campos obrigatórios', async () => {
    render(<QuickGenerateForm onSubmit={mockFn} />);
    
    const submitButton = screen.getByText('Gerar Valores');
    expect(submitButton).toBeDisabled();
    
    // Preencher categoria
    fireEvent.change(screen.getByTestId('category-select'), {
      target: { value: 'cabo' }
    });
    
    // Preencher kV
    fireEvent.change(screen.getByTestId('kv-input'), {
      target: { value: '1.00' }
    });
    
    expect(submitButton).toBeEnabled();
  });
  
  test('NewReportForm deve permitir campos opcionais vazios', async () => {
    render(<NewReportForm onSubmit={mockFn} />);
    
    // Preencher apenas obrigatórios
    fireEvent.change(screen.getByTestId('category-select'), {
      target: { value: 'motor' }
    });
    fireEvent.change(screen.getByTestId('kv-input'), {
      target: { value: '1.00' }
    });
    
    // Submeter (deve funcionar)
    fireEvent.click(screen.getByText('Gerar Valores'));
    
    expect(mockFn).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'motor',
        kv: 1.00,
        client: undefined,
        site: undefined
      })
    );
  });
});
```

## 📱 Testes de Responsividade

### Breakpoints
```typescript
describe('Responsive Design', () => {
  test('deve adaptar layout para mobile', () => {
    // Simular tela mobile
    window.innerWidth = 375;
    window.innerHeight = 667;
    fireEvent(window, new Event('resize'));
    
    render(<Dashboard />);
    
    // Verificar layout mobile
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });
  
  test('deve adaptar layout para desktop', () => {
    // Simular tela desktop
    window.innerWidth = 1920;
    window.innerHeight = 1080;
    fireEvent(window, new Event('resize'));
    
    render(<Dashboard />);
    
    // Verificar layout desktop
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
  });
});
```

## ♿ Testes de Acessibilidade

### Navegação por Teclado
```typescript
describe('Keyboard Navigation', () => {
  test('deve navegar por tab', () => {
    render(<QuickGenerateForm />);
    
    const categorySelect = screen.getByTestId('category-select');
    const kvInput = screen.getByTestId('kv-input');
    const submitButton = screen.getByText('Gerar Valores');
    
    categorySelect.focus();
    expect(categorySelect).toHaveFocus();
    
    userEvent.tab();
    expect(kvInput).toHaveFocus();
    
    userEvent.tab();
    expect(submitButton).toHaveFocus();
  });
  
  test('deve ativar botões com Enter', () => {
    const mockFn = jest.fn();
    render(<button onClick={mockFn}>Test Button</button>);
    
    const button = screen.getByText('Test Button');
    button.focus();
    userEvent.keyboard('{Enter}');
    
    expect(mockFn).toHaveBeenCalled();
  });
});
```

### Screen Readers
```typescript
describe('Screen Reader Support', () => {
  test('deve ter labels apropriados', () => {
    render(<QuickGenerateForm />);
    
    const categorySelect = screen.getByLabelText('Categoria');
    const kvInput = screen.getByLabelText('Tensão (kV)');
    
    expect(categorySelect).toBeInTheDocument();
    expect(kvInput).toBeInTheDocument();
  });
  
  test('deve anunciar mudanças de estado', () => {
    render(<ModeToggle mode="generate" onModeChange={mockFn} />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });
});
```

## 🚀 Testes de Performance

### Tempo de Carregamento
```typescript
describe('Performance', () => {
  test('deve carregar dashboard em < 2s', async () => {
    const startTime = performance.now();
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard"]');
    
    const loadTime = performance.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
  });
  
  test('deve gerar relatório em < 1s', async () => {
    await page.goto('/gerar-rapido');
    
    const startTime = performance.now();
    
    await page.selectOption('[data-testid="category-select"]', 'cabo');
    await page.fill('[data-testid="kv-input"]', '1.00');
    await page.click('[data-testid="generate-button"]');
    await page.waitForSelector('[data-testid="preview"]');
    
    const generationTime = performance.now() - startTime;
    expect(generationTime).toBeLessThan(1000);
  });
});
```

### Memória
```typescript
describe('Memory Usage', () => {
  test('não deve vazar memória ao gerar múltiplos relatórios', async () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    
    // Gerar 100 relatórios
    for (let i = 0; i < 100; i++) {
      await generateReport({ category: 'cabo', kv: 1.00 });
    }
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Aumento deve ser < 10MB
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});
```

## 🔄 Testes de Integração

### Fluxo Completo
```typescript
describe('Complete Workflow', () => {
  test('fluxo completo: gerar → preview → exportar', async () => {
    // 1. Gerar relatório
    await page.goto('/gerar-rapido');
    await page.selectOption('[data-testid="category-select"]', 'trafo');
    await page.fill('[data-testid="kv-input"]', '1.00');
    await page.click('[data-testid="generate-button"]');
    
    // 2. Verificar preview
    await expect(page.locator('[data-testid="preview"])).toBeVisible();
    await expect(page.locator('text=00:15')).toBeVisible();
    await expect(page.locator('text=01:00')).toBeVisible();
    
    // 3. Exportar PDF
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-pdf-button"]');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
  
  test('fluxo completo: salvar → histórico → recuperar', async () => {
    // 1. Salvar relatório
    await page.goto('/novo-relatorio');
    await page.click('[data-testid="save-mode-toggle"]');
    await page.selectOption('[data-testid="category-select"]', 'motor');
    await page.fill('[data-testid="kv-input"]', '1.00');
    await page.fill('[data-testid="client-input"]', 'Test Client');
    await page.click('[data-testid="generate-button"]');
    await page.click('[data-testid="save-button"]');
    
    // 2. Verificar no histórico
    await page.goto('/historico');
    await expect(page.locator('text=Test Client')).toBeVisible();
    
    // 3. Abrir detalhes
    await page.click('[data-testid="view-button"]');
    await expect(page.locator('[data-testid="report-details"])).toBeVisible();
  });
});
```

## 🧹 Limpeza e Setup

### Helpers de Teste
```typescript
// Utilitários para testes
export const createTestReport = (overrides = {}) => ({
  id: generateId(),
  category: 'cabo',
  kv: 1.00,
  readings: [
    { time: '00:15', kv: '1.00', resistance: '15.23GΩ' },
    { time: '00:30', kv: '1.00', resistance: '17.45GΩ' },
    { time: '00:45', kv: '1.00', resistance: '19.67GΩ' },
    { time: '01:00', kv: '1.00', resistance: '21.89GΩ' }
  ],
  dai: '1.25',
  createdAt: new Date(),
  isSaved: true,
  ...overrides
});

export const clearDatabase = async () => {
  await db.irReports.clear();
  await db.parameters.clear();
};

export const generateReport = async (options) => {
  // Implementação do helper
};
```

### Configuração de Teste
```typescript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*'
  ]
};
```

## 📊 Métricas de Qualidade

### Cobertura de Código
- **Linhas**: > 90%
- **Funções**: > 95%
- **Branches**: > 85%

### Taxa de Sucesso
- **Testes Unitários**: > 95%
- **Testes de Integração**: > 90%
- **Testes E2E**: > 85%

### Performance
- **Tempo de Execução**: < 5 minutos
- **Memória**: < 100MB
- **CPU**: < 50% durante testes

---

**Nota**: Este plano de testes garante a qualidade e confiabilidade do sistema EletriLab Ultra-MVP.
