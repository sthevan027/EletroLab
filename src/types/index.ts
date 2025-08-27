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

// Configuração de teste multi-fase
export interface MultiPhaseConfig {
  id: string;
  equipmentType: Category;
  
  // Fases personalizáveis
  phases: {
    names: string[];        // ['R', 'S', 'T'] ou ['A', 'B', 'C']
    count: number;          // 3, 4, 5, etc.
  };
  
  // Tipos de teste
  testTypes: {
    phaseToPhase: {
      enabled: boolean;
      combinations: string[][];  // [['R', 'S'], ['S', 'T'], ['R', 'T']]
    };
    phaseToGround: {
      enabled: boolean;
      groundName: string;        // 'M', 'GND', 'TERRA'
    };
  };
  
  voltage: number;
  environment: {
    temperature: number;
    humidity: number;
    quality: 'excellent' | 'good' | 'acceptable';
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// Relatório multi-fase
export interface MultiPhaseReport {
  id: string;
  configId: string;         // Referência à configuração
  
  equipment: {
    model?: string;
    unitId?: string;
    timestamp: string;
  };
  
  reports: {
    id: string;              // "R/S", "S/T", "R/M", etc.
    testNo: number;          // Sequencial: 1458, 1459, 1460...
    type: 'phase-phase' | 'phase-ground';
    description: string;     // "Fase R para Fase S"
    phases: string[];        // ['R', 'S'] ou ['R', 'M']
    readings: {
      time: string;
      kv: string;
      resistance: string;
    }[];
    dai: string;
    comments: string;        // "Fase/Fase" ou "Fase/Massa"
  }[];
  
  summary: {
    phaseToPhase: string;    // "R/S, S/T, R/T"
    phaseToGround: string;   // "R/M, S/M, T/M"
    totalReports: number;
  };
  
  createdAt: Date;
  isSaved: boolean;
}

// Histórico de aprendizado da IA
export interface AILearningHistory {
  id: string;
  category: string;
  phaseCount: number;
  phaseNames: string[];
  
  // Dados de aprendizado
  baseValues: number[];
  correlations: {
    phaseToPhase: number[][];
    phaseToGround: number[];
  };
  
  // Métricas de qualidade
  accuracy: number;          // 0-1
  confidence: number;        // 0-1
  
  createdAt: Date;
  usedCount: number;
}

// Parâmetros do sistema
export interface Parameter {
  id: string;
  key: string;
  value: any;
  category?: string;
}

// Configurações do sistema
export interface SystemConfig {
  id?: string;
  defaultOperator: string;
  defaultClient: string;
  defaultSite: string;
  aiEnabled: boolean;
  aiLearningRate: number;
  defaultLimitTOhm: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Tipos de validação
export interface ValidationError {
  field: string;
  message: string;
  type?: 'required' | 'format' | 'range' | 'correlation' | 'consistency' | 'ai_confidence';
  severity?: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  value?: any;
}

// Tipos de estatísticas do dashboard
export interface DashboardStats {
  totalReports: number;
  savedToday: number;
  multiPhase: number;
  aiLearning: number;
  recentReports: (IRReport | MultiPhaseReport)[];
}

// Tipos de exportação
export interface ExportOptions {
  format: 'pdf' | 'csv';
  includeMetadata: boolean;
  includeComments: boolean;
}

// Opções para geração de série IR
export interface IRGenerationOptions {
  category: Category;
  kv?: number;
  limitTOhm?: number;
  tag?: string;
  client?: string;
  site?: string;
  operator?: string;
  manufacturer?: string;
  model?: string;
}

// Resultado da geração de série IR
export interface IRGenerationResult {
  readings: {
    time: string;
    kv: string;
    resistance: string;
  }[];
  dai: string;
}

// Tipos de modo de geração
export type GenerationMode = 'generate' | 'save';

// Tipos de qualidade do ambiente
export type EnvironmentQuality = 'excellent' | 'good' | 'acceptable';

// Tipos de teste multi-fase
export type TestType = 'phase-phase' | 'phase-ground';

// Tipos de resultado de validação IA
export interface AIValidationResult {
  isAnomalous: boolean;
  confidence: number;
  suggestions: string[];
  correlations: {
    phaseToPhase: number[][];
    phaseToGround: number[];
  };
}

// Tipos de backup e restore
export interface DatabaseBackup {
  irReports: IRReport[];
  parameters: Parameter[];
  multiPhaseConfigs: MultiPhaseConfig[];
  multiPhaseReports: MultiPhaseReport[];
  aiLearningHistory: AILearningHistory[];
  exportDate: string;
}

// Tipos de navegação
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  children?: NavigationItem[];
}

// Tipos de notificação
export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
  createdAt: string;
}

// Tipos de tema
export type Theme = 'light' | 'dark' | 'system';

// Tipos de filtros
export interface ReportFilters {
  category?: Category[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  isSaved?: boolean;
}

export interface MultiPhaseFilters {
  equipmentType?: Category[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  isSaved?: boolean;
}
