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

// === Compat: aliases esperados pelas páginas antigas ===
export type EquipmentCategoryCompat = 'megger' | 'cabo' | 'painel' | 'motor' | 'outros';

export type EquipmentCompat = {
  id?: number;
  name: string;
  category: EquipmentCategoryCompat;
  manufacturer?: string;
  model?: string;
  tag?: string;
  calibrationDue?: string;   // Data de validade
  nextCalibration?: string;  // Próxima calibração
};

export type TestTypeCompat = 'IR' | 'DAI' | 'CONTINUIDADE' | 'RESISTENCIA';

export type ResistanceUnit = 'Ω' | 'kΩ' | 'MΩ' | 'GΩ' | 'TΩ';

export type TestCompat = {
  id?: number;
  reportId: number;
  type: TestTypeCompat;
  value: number;
  unit: ResistanceUnit;
  classification: 'OK' | 'ALERTA' | 'FALHA';
  measuredAt: string; // ISO
};

// Se você já tem IRReport, expõe também como Report para compat
export type IRReport = {
  id?: number;
  createdAt: string;
  category?: string;
  operator?: string;
  site?: string;
  client?: string;
  notes?: string;
};
export type ReportCompat = IRReport;

// Ajuste em AILearningHistory: adicionar 'input' para não quebrar
export type AILearningHistory = {
  id?: number;
  createdAt: string;
  input?: string;   // <— estava faltando; as páginas usam
  output: string;
  context?: string;
  prompt?: string;
};

// === Aliases para compatibilidade com páginas antigas ===
export { EquipmentCompat as Equipment };
export { EquipmentCategoryCompat as EquipmentCategory };
export { TestTypeCompat as TestType };
export { TestCompat as Test };
export { ReportCompat as Report };

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

// Tipos de configuração
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

// Tipos de estatísticas
export interface DashboardStats {
  totalReports: number;
  totalEquipment: number;
  totalTests: number;
  resultsDistribution: {
    BOM: number;
    ACEITÁVEL: number;
    REPROVADO: number;
  };
  categoryDistribution: Record<EquipmentCategoryCompat, number>;
  recentReports: ReportOriginal[];
  recentTests: TestOriginal[];
}

// Tipos de exportação
export interface ExportOptions {
  format: 'pdf' | 'csv';
  includeTests: boolean;
  includeCharts: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Tipos de validação
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Tipos de navegação
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  children?: NavigationItem[];
}

// Tipos de tema
export type Theme = 'light' | 'dark' | 'system';

// Tipos de notificação
export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
  createdAt: string;
}

// Tipos de filtros
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
