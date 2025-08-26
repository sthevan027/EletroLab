# Plano de Testes - EletriLab Ultra-MVP com IA

## Visão Geral

Este plano de testes abrange todas as funcionalidades do EletriLab Ultra-MVP com IA, incluindo geração simples, multi-fase, sistema de IA e validações inteligentes.

## Estratégia de Testes

### Abordagem
- **Testes unitários**: Validação de funções individuais
- **Testes de integração**: Fluxos completos de geração
- **Testes de interface**: Validação de UX e responsividade
- **Testes de IA**: Validação de correlações e aprendizado

### Cobertura
- **Código**: Mínimo 80% de cobertura
- **Funcionalidades**: 100% das features principais
- **Interface**: Todos os fluxos de usuário
- **Performance**: Tempo de resposta < 2s

## Cenários de Teste

### 1. Geração Simples

#### 1.1 Geração Básica
```typescript
describe('Geração Simples - Básica', () => {
  it('deve gerar relatório com categoria e kV', () => {
    const result = gerarSerieIR({
      category: 'cabo',
      kv: 1.0
    });
    
    expect(result.lines).toHaveLength(4);
    expect(result.lines[0].time).toBe('00:15');
    expect(result.lines[3].time).toBe('01:00');
    expect(result.dai).toMatch(/^\d+\.\d{2}$|^Undefined$/);
  });
  
  it('deve aplicar regra de cabos >= 5 GΩ', () => {
    const result = gerarSerieIR({
      category: 'cabo',
      kv: 1.0
    });
    
    result.lines.forEach(line => {
      const value = parseResistance(line.ohms);
      if (value !== undefined) {
        expect(value).toBeGreaterThanOrEqual(5e9); // 5 GΩ
      }
    });
  });
});
```

#### 1.2 Validação de Campos
```typescript
describe('Geração Simples - Validação', () => {
  it('deve aceitar campos opcionais vazios', () => {
    const result = gerarSerieIR({
      category: 'motor',
      kv: 1.0,
      model: '',
      unit_id: undefined
    });
    
    expect(result).toBeDefined();
    expect(result.header.model).toBeUndefined();
    expect(result.header.unit_id).toBeUndefined();
  });
  
  it('deve rejeitar kV inválido', () => {
    expect(() => {
      gerarSerieIR({
        category: 'cabo',
        kv: -1
      });
    }).toThrow('Tensão deve estar entre 0.1 e 50 kV');
  });
});
```

#### 1.3 Formatação de Resistência
```typescript
describe('Formatação de Resistência', () => {
  it('deve formatar valores corretamente', () => {
    expect(formatResistance(500)).toBe('500Ω');
    expect(formatResistance(1500)).toBe('1.50kΩ');
    expect(formatResistance(1.5e6)).toBe('1.50MΩ');
    expect(formatResistance(5.23e9)).toBe('5.23GΩ');
    expect(formatResistance(2.15e12)).toBe('2.15TΩ');
  });
  
  it('deve aplicar OVRG para valores >= 5 TΩ', () => {
    expect(formatResistance(5e12)).toBe('0.99 OVRG');
    expect(formatResistance(6e12)).toBe('0.99 OVRG');
  });
});
```

### 2. Geração Multi-Fase

#### 2.1 Configuração de Fases
```typescript
describe('Multi-Fase - Configuração', () => {
  it('deve validar nomes de fases únicos', () => {
    const config = {
      phases: { names: ['R', 'S', 'T'], count: 3 },
      testTypes: {
        phaseToPhase: { enabled: true, combinations: [['R', 'S'], ['S', 'T']] },
        phaseToGround: { enabled: true, groundName: 'M' }
      }
    };
    
    const validation = validatePhaseConfiguration(config);
    expect(validation.isValid).toBe(true);
  });
  
  it('deve rejeitar fases duplicadas', () => {
    const config = {
      phases: { names: ['R', 'R', 'T'], count: 3 },
      testTypes: {
        phaseToPhase: { enabled: true, combinations: [] },
        phaseToGround: { enabled: true, groundName: 'M' }
      }
    };
    
    const validation = validatePhaseConfiguration(config);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContainEqual(
      expect.objectContaining({
        field: 'phases',
        message: 'Nomes das fases devem ser únicos'
      })
    );
  });
});
```

#### 2.2 Geração de Combinações
```typescript
describe('Multi-Fase - Combinações', () => {
  it('deve gerar todas as combinações fase/fase', () => {
    const result = generateMultiPhaseReport({
      phases: { names: ['R', 'S', 'T'], count: 3 },
      testTypes: {
        phaseToPhase: { enabled: true, combinations: [['R', 'S'], ['S', 'T'], ['R', 'T']] },
        phaseToGround: { enabled: true, groundName: 'M' }
      },
      voltage: 1.0
    });
    
    expect(result.reports).toHaveLength(6); // 3 fase/fase + 3 fase/massa
    expect(result.reports.find(r => r.id === 'R/S')).toBeDefined();
    expect(result.reports.find(r => r.id === 'S/T')).toBeDefined();
    expect(result.reports.find(r => r.id === 'R/T')).toBeDefined();
  });
  
  it('deve gerar combinações fase/massa', () => {
    const result = generateMultiPhaseReport({
      phases: { names: ['R', 'S', 'T'], count: 3 },
      testTypes: {
        phaseToPhase: { enabled: false, combinations: [] },
        phaseToGround: { enabled: true, groundName: 'M' }
      },
      voltage: 1.0
    });
    
    expect(result.reports).toHaveLength(3);
    expect(result.reports.find(r => r.id === 'R/M')).toBeDefined();
    expect(result.reports.find(r => r.id === 'S/M')).toBeDefined();
    expect(result.reports.find(r => r.id === 'T/M')).toBeDefined();
  });
});
```

#### 2.3 Correlações entre Fases
```typescript
describe('Multi-Fase - Correlações', () => {
  it('deve manter correlações entre fases', () => {
    const result = generateMultiPhaseReport({
      phases: { names: ['R', 'S', 'T'], count: 3 },
      testTypes: {
        phaseToPhase: { enabled: true, combinations: [['R', 'S']] },
        phaseToGround: { enabled: false, groundName: 'M' }
      },
      voltage: 1.0
    });
    
    const rReport = result.reports.find(r => r.id === 'R/S');
    const rValues = rReport.readings.map(r => parseResistance(r.resistance));
    
    // Verificar que valores são correlacionados
    const correlation = calculateCorrelation(rValues);
    expect(correlation).toBeGreaterThan(0.8);
  });
  
  it('deve validar consistência fase/massa', () => {
    const result = generateMultiPhaseReport({
      phases: { names: ['R', 'S'], count: 2 },
      testTypes: {
        phaseToPhase: { enabled: false, combinations: [] },
        phaseToGround: { enabled: true, groundName: 'M' }
      },
      voltage: 1.0
    });
    
    const rMReport = result.reports.find(r => r.id === 'R/M');
    const rMValues = rMReport.readings.map(r => parseResistance(r.resistance));
    
    // Fase/massa deve ser ~80% da fase individual
    const expectedRatio = 0.8;
    const actualRatio = rMValues[0] / (rMValues[0] * 1.25); // Aproximação
    expect(Math.abs(actualRatio - expectedRatio)).toBeLessThan(0.2);
  });
});
```

### 3. Sistema de IA

#### 3.1 Validação Inteligente
```typescript
describe('IA - Validação', () => {
  it('deve detectar valores anômalos', () => {
    const readings = [
      { time: '00:15', resistance: '5.23GΩ' },
      { time: '00:30', resistance: '0.5GΩ' }, // Anômalo
      { time: '00:45', resistance: '6.70GΩ' },
      { time: '01:00', resistance: '7.58GΩ' }
    ];
    
    const validation = validateWithAI(readings, { category: 'cabo' });
    expect(validation.isAnomalous).toBe(true);
    expect(validation.suggestions).toContain('Valor em 00:30 está abaixo do esperado para cabos');
  });
  
  it('deve calcular confiança da predição', () => {
    const confidence = calculateAIConfidence({
      category: 'cabo',
      history: 50,
      correlation: 0.95
    });
    
    expect(confidence).toBeGreaterThan(0.7);
  });
});
```

#### 3.2 Aprendizado Local
```typescript
describe('IA - Aprendizado', () => {
  it('deve aprender com histórico de testes', () => {
    const history = [
      { category: 'cabo', values: [5.2e9, 5.8e9, 6.7e9, 7.5e9] },
      { category: 'cabo', values: [5.1e9, 5.7e9, 6.4e9, 7.2e9] },
      { category: 'cabo', values: [5.0e9, 5.6e9, 6.3e9, 7.0e9] }
    ];
    
    const learnedProfile = learnFromHistory(history);
    expect(learnedProfile.baseG[0]).toBeCloseTo(5.0, 1);
    expect(learnedProfile.baseG[1]).toBeCloseTo(5.3, 1);
  });
  
  it('deve ajustar perfis baseado em resultados', () => {
    const oldProfile = { baseG: [5, 20], growth: [1.05, 1.18] };
    const newResults = [5.1e9, 5.7e9, 6.4e9, 7.2e9];
    
    const adjustedProfile = adjustProfile(oldProfile, newResults);
    expect(adjustedProfile.baseG[0]).toBeLessThanOrEqual(5.1);
    expect(adjustedProfile.baseG[1]).toBeGreaterThanOrEqual(5.1);
  });
});
```

### 4. Interface de Usuário

#### 4.1 Fluxo de Configuração
```typescript
describe('Interface - Configuração', () => {
  it('deve validar entrada de fases', () => {
    render(<PhaseConfiguration />);
    
    const input = screen.getByLabelText('Nomes das Fases');
    fireEvent.change(input, { target: { value: 'R,S,T' } });
    
    expect(screen.getByText('3 fases configuradas')).toBeInTheDocument();
  });
  
  it('deve mostrar erros de validação', () => {
    render(<PhaseConfiguration />);
    
    const input = screen.getByLabelText('Nomes das Fases');
    fireEvent.change(input, { target: { value: 'R,R,T' } });
    
    expect(screen.getByText('Fases duplicadas detectadas')).toBeInTheDocument();
  });
});
```

#### 4.2 Preview de Relatórios
```typescript
describe('Interface - Preview', () => {
  it('deve mostrar preview de relatório simples', () => {
    const report = {
      lines: [
        { time: '00:15', kv: '1.00', ohms: '5.23GΩ' },
        { time: '00:30', kv: '1.00', ohms: '5.89GΩ' },
        { time: '00:45', kv: '1.00', ohms: '6.70GΩ' },
        { time: '01:00', kv: '1.00', ohms: '7.58GΩ' }
      ],
      dai: '1.29'
    };
    
    render(<ReportPreview report={report} />);
    
    expect(screen.getByText('5.23GΩ')).toBeInTheDocument();
    expect(screen.getByText('DAI: 1.29')).toBeInTheDocument();
  });
  
  it('deve mostrar múltiplos relatórios', () => {
    const multiReport = {
      reports: [
        { id: 'R/S', testNo: 1458, dai: '1.29' },
        { id: 'S/T', testNo: 1459, dai: '1.29' },
        { id: 'R/T', testNo: 1460, dai: '1.29' }
      ]
    };
    
    render(<MultiReportPreview report={multiReport} />);
    
    expect(screen.getByText('R/S - Test 1458')).toBeInTheDocument();
    expect(screen.getByText('S/T - Test 1459')).toBeInTheDocument();
    expect(screen.getByText('R/T - Test 1460')).toBeInTheDocument();
  });
});
```

### 5. Exportação

#### 5.1 Exportação PDF
```typescript
describe('Exportação - PDF', () => {
  it('deve gerar PDF de relatório simples', async () => {
    const report = generateSampleReport();
    const pdfBlob = await exportCupomPDF(report);
    
    expect(pdfBlob.type).toBe('application/pdf');
    expect(pdfBlob.size).toBeGreaterThan(1000);
  });
  
  it('deve gerar PDF multi-fase', async () => {
    const multiReport = generateSampleMultiReport();
    const pdfBlob = await exportMultiPhasePDF(multiReport);
    
    expect(pdfBlob.type).toBe('application/pdf');
    expect(pdfBlob.size).toBeGreaterThan(5000);
  });
});
```

#### 5.2 Exportação CSV
```typescript
describe('Exportação - CSV', () => {
  it('deve gerar CSV com dados corretos', () => {
    const report = generateSampleReport();
    const csvContent = exportCupomCSV(report);
    
    expect(csvContent).toContain('mm:ss,kV,Ohms');
    expect(csvContent).toContain('00:15,1.00,5.23GΩ');
    expect(csvContent).toContain('DAI,1.29');
  });
  
  it('deve gerar CSV multi-fase', () => {
    const multiReport = generateSampleMultiReport();
    const csvContent = exportMultiPhaseCSV(multiReport);
    
    expect(csvContent).toContain('Report ID,Type,DAI');
    expect(csvContent).toContain('R/S,phase-phase,1.29');
    expect(csvContent).toContain('R/M,phase-ground,1.28');
  });
});
```

### 6. Banco de Dados

#### 6.1 Operações CRUD
```typescript
describe('Banco de Dados - CRUD', () => {
  it('deve salvar relatório simples', async () => {
    const report = generateSampleReport();
    const id = await db.irReports.add(report);
    
    expect(id).toBeDefined();
    
    const saved = await db.irReports.get(id);
    expect(saved.category).toBe(report.category);
    expect(saved.readings).toHaveLength(4);
  });
  
  it('deve salvar configuração multi-fase', async () => {
    const config = generateSampleConfig();
    const id = await db.multiPhaseConfigs.add(config);
    
    expect(id).toBeDefined();
    
    const saved = await db.multiPhaseConfigs.get(id);
    expect(saved.phases.names).toEqual(['R', 'S', 'T']);
  });
});
```

#### 6.2 Backup e Restore
```typescript
describe('Banco de Dados - Backup', () => {
  it('deve exportar dados completos', async () => {
    await populateTestData();
    
    const backup = await exportDatabase();
    const data = JSON.parse(await backup.text());
    
    expect(data.irReports).toBeDefined();
    expect(data.multiPhaseConfigs).toBeDefined();
    expect(data.aiLearningHistory).toBeDefined();
  });
  
  it('deve restaurar dados corretamente', async () => {
    const backup = generateTestBackup();
    
    await importDatabase(backup);
    
    const reportsCount = await db.irReports.count();
    const configsCount = await db.multiPhaseConfigs.count();
    
    expect(reportsCount).toBeGreaterThan(0);
    expect(configsCount).toBeGreaterThan(0);
  });
});
```

## Testes de Performance

### 1. Tempo de Resposta
```typescript
describe('Performance - Tempo de Resposta', () => {
  it('deve gerar relatório simples em < 100ms', () => {
    const start = performance.now();
    
    gerarSerieIR({ category: 'cabo', kv: 1.0 });
    
    const end = performance.now();
    expect(end - start).toBeLessThan(100);
  });
  
  it('deve gerar multi-fase em < 500ms', () => {
    const start = performance.now();
    
    generateMultiPhaseReport(generateSampleConfig());
    
    const end = performance.now();
    expect(end - start).toBeLessThan(500);
  });
});
```

### 2. Uso de Memória
```typescript
describe('Performance - Memória', () => {
  it('deve manter uso de memória estável', () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    
    for (let i = 0; i < 100; i++) {
      gerarSerieIR({ category: 'cabo', kv: 1.0 });
    }
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const increase = finalMemory - initialMemory;
    
    expect(increase).toBeLessThan(10 * 1024 * 1024); // < 10MB
  });
});
```

## Testes de Acessibilidade

### 1. Navegação por Teclado
```typescript
describe('Acessibilidade - Teclado', () => {
  it('deve permitir navegação completa por tab', () => {
    render(<GenerateReport />);
    
    const focusableElements = screen.getAllByRole('button', 'input', 'select');
    
    focusableElements.forEach((element, index) => {
      element.focus();
      expect(document.activeElement).toBe(element);
    });
  });
});
```

### 2. Leitores de Tela
```typescript
describe('Acessibilidade - Leitores', () => {
  it('deve ter labels apropriados', () => {
    render(<GenerateReport />);
    
    const categorySelect = screen.getByLabelText('Categoria do Equipamento');
    const voltageInput = screen.getByLabelText('Tensão Aplicada (kV)');
    
    expect(categorySelect).toBeInTheDocument();
    expect(voltageInput).toBeInTheDocument();
  });
});
```

## Testes de Responsividade

### 1. Breakpoints
```typescript
describe('Responsividade - Breakpoints', () => {
  it('deve adaptar layout para mobile', () => {
    window.innerWidth = 375;
    window.innerHeight = 667;
    
    render(<Dashboard />);
    
    const actions = screen.getByText('Ações Rápidas');
    expect(actions).toBeInTheDocument();
    
    // Verificar se botões estão empilhados
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      const styles = window.getComputedStyle(button);
      expect(styles.display).toBe('block');
    });
  });
});
```

## Métricas de Qualidade

### 1. Cobertura de Código
- **Mínimo**: 80% de cobertura
- **Meta**: 90% de cobertura
- **Ferramenta**: Jest + Istanbul

### 2. Performance
- **Tempo de carregamento**: < 2s
- **Tempo de geração**: < 500ms
- **Uso de memória**: < 50MB

### 3. Acessibilidade
- **WCAG 2.1 AA**: Conformidade completa
- **Navegação por teclado**: 100% funcional
- **Contraste**: Mínimo 4.5:1

## Ambiente de Testes

### Configuração
```json
{
  "testEnvironment": "jsdom",
  "setupFilesAfterEnv": ["<rootDir>/src/test/setup.ts"],
  "collectCoverageFrom": [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/test/**/*"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

### Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:accessibility": "axe-core"
  }
}
```

---

**Nota**: Este plano de testes garante a qualidade e confiabilidade do sistema EletriLab Ultra-MVP com IA, cobrindo todas as funcionalidades principais e cenários de uso.
