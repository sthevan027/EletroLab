// === TIPOS ORIGINAIS ===

// Tipos de equipamento originais
export type EquipmentCategoryOriginal = 'motor' | 'transformador' | 'gerador' | 'painel' | 'cabo' | 'outro';

export interface EquipmentOriginal {
  id: string;
  tag: string;
  category: EquipmentCategoryOriginal;
  description: string;
  location: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  installationDate: string;
  lastMaintenance: string;
  status: 'ativo' | 'inativo' | 'manutencao';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos de teste originais
export type TestTypeOriginal = 'megger' | 'hipot';
export type TestResult = 'BOM' | 'ACEITÁVEL' | 'REPROVADO';

export interface TestOriginal {
  id: string;
  reportId: string;
  equipmentId: string;
  testType: TestTypeOriginal;
  value: number;
  unit: string;
  result: TestResult;
  limits: TestLimit;
  notes: string;
  performedBy: string;
  performedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestLimit {
  min: number;
  good: number;
  unit: string;
}

// Tipos de relatório originais
export type ReportStatus = 'rascunho' | 'finalizado' | 'aprovado' | 'reprovado';

export interface ReportOriginal {
  id: string;
  number: string;
  date: string;
  client: string;
  location: string;
  responsible: string;
  status: ReportStatus;
  tests: TestOriginal[];
  observations: string;
  recommendations: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

// Tipos de configuração originais
export interface TestConfiguration {
  megger: {
    motor: TestLimit;
    transformador: TestLimit;
    gerador: TestLimit;
    painel: TestLimit;
    cabo: TestLimit;
    outro: TestLimit;
  };
  hipot: {
    motor: TestLimit;
    transformador: TestLimit;
    gerador: TestLimit;
    painel: TestLimit;
    cabo: TestLimit;
    outro: TestLimit;
  };
}

// === TIPOS DE COMPATIBILIDADE ===

// Aliases esperados pelas páginas antigas
export type EquipmentCategoryCompat = 'megger' | 'cabo' | 'painel' | 'motor' | 'outros';

export type EquipmentCompat = {
  id?: number;
  name: string;
  category: EquipmentCategoryCompat;
  manufacturer?: string;
  model?: string;
  tag?: string;
  description?: string;
  location?: string;
  serialNumber?: string;
  installationDate?: string;
  lastMaintenance?: string;
  status?: 'ativo' | 'inativo' | 'manutencao';
  notes?: string;
  calibrationDue?: string;   // Data de validade
  nextCalibration?: string;  // Próxima calibração
};

export type TestTypeCompat = 'IR' | 'DAI' | 'CONTINUIDADE' | 'RESISTENCIA';

export type ResistanceUnit = 'Ω' | 'kΩ' | 'MΩ' | 'GΩ' | 'TΩ';

export type TestCompat = {
  id?: number;
  reportId: number;
  equipmentId?: string;
  testType?: TestTypeCompat;
  type: TestTypeCompat;
  value: number;
  unit: ResistanceUnit;
  result?: 'BOM' | 'ACEITÁVEL' | 'REPROVADO';
  classification: 'OK' | 'ALERTA' | 'FALHA';
  performedAt?: string;
  performedBy?: string;
  measuredAt: string; // ISO
};

// === TIPOS NOVOS ===

// Tipos de categoria para relatórios IR
export type Category = 'cabo' | 'motor' | 'bomba' | 'trafo' | 'outro';

// Relatório IR simplificado (formato cupom)
export interface IRReport {
  id: string;
  number?: string;           // Apenas quando salvo
  category: Category;
  tag?: string;              // Opcional
  kv: number;                // Tensão aplicada (default 1.00)
  
  // Dados opcionais (não bloqueiam geração)
  client?: string;
  site?: string;
  operator?: string;
  manufacturer?: string;
  model?: string;
  date?: string;
  location?: string;
  responsible?: string;
  status?: 'rascunho' | 'finalizado' | 'aprovado' | 'reprovado';
  observations?: string;
  recommendations?: string;
  notes?: string;
  
  // Série de tempos fixa
  readings: {
    time: string;            // "00:15", "00:30", "00:45", "01:00"
    kv: string;              // Formato "1.00"
    resistance: string;      // Formato "5.23GΩ" ou "0.99 OVRG"
  }[];
  
  dai: string;               // "1.15" ou "Undefined"
  createdAt: Date;
  isSaved: boolean;          // true = salvo no IndexedDB, false = apenas preview
}

// Perfil de categoria para geração
export interface CategoryProfile {
  id: string;
  category: Category;
  name: string;
  description: string;
  baseResistance: {
    min: number; // Ω
    max: number; // Ω
    decay: number; // Fator de decaimento (0-1)
  };
  temperature: {
    min: number; // °C
    max: number; // °C
    effect: number; // Efeito por grau (0-1)
  };
  humidity: {
    min: number; // %
    max: number; // %
    effect: number; // Efeito por % (0-1)
  };
  aiConfidence: number; // Confiança da IA (0-1)
  createdAt: Date;
  updatedAt?: Date;
}

// Configuração do sistema
export interface SystemConfig {
  id: string;
  defaultOperator: string;
  defaultClient: string;
  defaultSite: string;
  aiEnabled: boolean;
  aiLearningRate: number;
  defaultLimitTOhm: number;
  createdAt: Date;
  updatedAt: Date;
}

// Parâmetros de teste
export interface Parameter {
  id: string;
  key: string;
  category: Category;
  value: any;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Configuração multi-fase
export interface MultiPhaseConfig {
  id: string;
  equipmentType: Category;
  phases: {
    names: string[];
  };
  voltage: number;
  duration: number;
  intervals: number[];
  createdAt: Date;
  updatedAt?: Date;
}

// Relatório multi-fase
export interface MultiPhaseReport {
  id: string;
  configId: string;
  equipmentTag: string;
  operator: string;
  reports?: any[];
  summary?: {
    phaseCount: number;
    averageResistance: number;
    status: string;
  };
  equipment?: {
    tag: string;
    category: string;
    model?: string;
  };
  readings: {
    phase: number;
    time: string;
    resistance: string;
    temperature?: number;
    humidity?: number;
  }[];
  createdAt: Date;
  isSaved: boolean;
}

// Ajuste em AILearningHistory: adicionar 'input' para não quebrar
export type AILearningHistory = {
  id?: number;
  createdAt: string;
  input?: string;   // <— estava faltando; as páginas usam
  output: string;
  context?: string;
  prompt?: string;
  category?: string;
  phaseCount?: number;
  phaseNames?: string[];
};

// === ALIASES PARA COMPATIBILIDADE ===
export type { EquipmentCompat as Equipment };
export type { EquipmentCategoryCompat as EquipmentCategory };
export type { TestTypeCompat as TestType };
export type { TestCompat as Test };
export type { IRReport as ReportCompat };

// === TIPOS DE ESTATÍSTICAS ===
export interface DashboardStats {
  totalReports: number;
  totalEquipment: number;
  totalTests: number;
  savedToday: number;
  multiPhase: number;
  aiLearning: number;
  resultsDistribution: {
    BOM: number;
    ACEITÁVEL: number;
    REPROVADO: number;
  };
  categoryDistribution: Record<EquipmentCategoryCompat, number>;
  recentReports: ReportOriginal[];
  recentTests: TestOriginal[];
}

// === TIPOS DE EXPORTAÇÃO ===
export interface ExportOptions {
  format: 'pdf' | 'csv';
  includeTests: boolean;
  includeCharts: boolean;
  includeMetadata?: boolean;
  includeComments?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

// === TIPOS DE VALIDAÇÃO ===
export interface ValidationError {
  field: string;
  message: string;
  type?: string;
  severity?: string;
}

export interface ValidationResult {
  ok?: boolean;
  isValid: boolean;
  errors: ValidationError[];
}

// === TIPOS DE NAVEGAÇÃO ===
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  children?: NavigationItem[];
}

// === TIPOS DE TEMA ===
export type Theme = 'light' | 'dark' | 'system';

// === TIPOS DE NOTIFICAÇÃO ===
export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
  createdAt: string;
}

// === TIPOS DE FILTROS ===
export interface ReportFilters {
  status?: ReportStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
  client?: string;
  responsible?: string;
}

export interface EquipmentFilters {
  category?: EquipmentCategoryCompat[];
  status?: EquipmentCompat['status'][];
  location?: string;
  manufacturer?: string;
}

export interface TestFilters {
  testType?: TestTypeCompat[];
  result?: TestResult[];
  dateRange?: {
    start: string;
    end: string;
  };
  equipmentId?: string;
}

// === TIPOS PARA GERAÇÃO ===
export interface IRGenerationOptions {
  category: Category;
  kv: number;
  limitTOhm?: number;
  tag?: string;
  client?: string;
  site?: string;
  operator?: string;
  manufacturer?: string;
  model?: string;
  aiEnabled?: boolean;
}

export interface IRGenerationResult {
  report: IRReport;
  confidence: number;
  warnings?: string[];
}
