// Tipos de equipamento
export type EquipmentCategory = 'motor' | 'transformador' | 'gerador' | 'painel' | 'cabo' | 'outro';

export interface Equipment {
  id: string;
  tag: string;
  category: EquipmentCategory;
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

// Tipos de teste
export type TestType = 'megger' | 'hipot';
export type TestResult = 'BOM' | 'ACEITÁVEL' | 'REPROVADO';

export interface Test {
  id: string;
  reportId: string;
  equipmentId: string;
  testType: TestType;
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

// Tipos de relatório
export type ReportStatus = 'rascunho' | 'finalizado' | 'aprovado' | 'reprovado';

export interface Report {
  id: string;
  number: string;
  date: string;
  client: string;
  location: string;
  responsible: string;
  status: ReportStatus;
  tests: Test[];
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
  categoryDistribution: Record<EquipmentCategory, number>;
  recentReports: Report[];
  recentTests: Test[];
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
  category?: EquipmentCategory[];
  status?: Equipment['status'][];
  location?: string;
  manufacturer?: string;
}

export interface TestFilters {
  testType?: TestType[];
  result?: TestResult[];
  dateRange?: {
    start: string;
    end: string;
  };
  equipmentId?: string;
}
