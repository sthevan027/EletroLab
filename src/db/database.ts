import Dexie, { Table } from 'dexie';
import { 
  IRReport, 
  MultiPhaseConfig, 
  MultiPhaseReport, 
  AILearningHistory, 
  Parameter,
  CategoryProfile,
  SystemConfig,
  Category,
  EquipmentOriginal, 
  ReportOriginal, 
  TestOriginal, 
  TestConfiguration 
} from '../types';

export interface ConfigRecord extends TestConfiguration {
  id: string;
}

export class EletriLabDB extends Dexie {
  // Tabelas originais para compatibilidade
  equipment!: Table<EquipmentOriginal>;
  report!: Table<ReportOriginal>;
  test!: Table<TestOriginal>;
  configuration!: Table<ConfigRecord>;
  
  // Novas tabelas
  irReports!: Table<IRReport>;
  parameters!: Table<Parameter>;
  multiPhaseConfigs!: Table<MultiPhaseConfig>;
  multiPhaseReports!: Table<MultiPhaseReport>;
  aiLearningHistory!: Table<AILearningHistory>;
  categoryProfiles!: Table<CategoryProfile>;
  systemConfigs!: Table<SystemConfig>;

  constructor() {
    super('EletriLabDB');
    
    this.version(4).stores({
      // Tabelas originais
      equipment: 'id, tag, category, status, location, manufacturer',
      report: 'id, number, date, client, status, responsible',
      test: 'id, reportId, equipmentId, testType, result, performedAt',
      configuration: 'id',
      
      // Novas tabelas
      irReports: '++id, category, createdAt, isSaved',
      parameters: '++id, key, category',
      multiPhaseConfigs: '++id, equipmentType, createdAt',
      multiPhaseReports: '++id, configId, createdAt, isSaved',
      aiLearningHistory: '++id, category, phaseCount, createdAt',
      categoryProfiles: '++id, category, createdAt',
      systemConfigs: '++id, createdAt'
    });
  }
}

export const db = new EletriLabDB();

// Configuração padrão dos testes (original)
export const defaultTestConfiguration: TestConfiguration = {
  megger: {
    motor: { min: 50, good: 500, unit: 'MΩ' },
    transformador: { min: 100, good: 1000, unit: 'MΩ' },
    gerador: { min: 50, good: 500, unit: 'MΩ' },
    painel: { min: 20, good: 200, unit: 'MΩ' },
    cabo: { min: 100, good: 1000, unit: 'MΩ' },
    outro: { min: 50, good: 500, unit: 'MΩ' }
  },
  hipot: {
    motor: { min: 1000, good: 2000, unit: 'V' },
    transformador: { min: 2000, good: 5000, unit: 'V' },
    gerador: { min: 1000, good: 2000, unit: 'V' },
    painel: { min: 500, good: 1000, unit: 'V' },
    cabo: { min: 2000, good: 5000, unit: 'V' },
    outro: { min: 1000, good: 2000, unit: 'V' }
  }
};

// Perfis padrão por categoria (novo formato)
export const defaultCategoryProfiles: Record<string, CategoryProfile> = {
  cabo: {
    id: 'profile-cabo',
    category: 'cabo',
    name: 'Perfil Cabo',
    description: 'Perfil padrão para cabos de potência e controle',
    baseResistance: { min: 5e9, max: 20e9, decay: 0.1 },
    temperature: { min: 20, max: 30, effect: 0.02 },
    humidity: { min: 40, max: 60, effect: 0.01 },
    aiConfidence: 0.9,
    createdAt: new Date()
  },
  motor: {
    id: 'profile-motor',
    category: 'motor',
    name: 'Perfil Motor',
    description: 'Perfil padrão para motores elétricos',
    baseResistance: { min: 1e9, max: 5e9, decay: 0.08 },
    temperature: { min: 20, max: 35, effect: 0.025 },
    humidity: { min: 35, max: 65, effect: 0.015 },
    aiConfidence: 0.85,
    createdAt: new Date()
  },
  bomba: {
    id: 'profile-bomba',
    category: 'bomba',
    name: 'Perfil Bomba',
    description: 'Perfil padrão para bombas e sistemas hidráulicos',
    baseResistance: { min: 1e9, max: 5e9, decay: 0.08 },
    temperature: { min: 20, max: 35, effect: 0.025 },
    humidity: { min: 35, max: 65, effect: 0.015 },
    aiConfidence: 0.85,
    createdAt: new Date()
  },
  trafo: {
    id: 'profile-trafo',
    category: 'trafo',
    name: 'Perfil Transformador',
    description: 'Perfil padrão para transformadores de potência',
    baseResistance: { min: 10e9, max: 50e9, decay: 0.12 },
    temperature: { min: 15, max: 25, effect: 0.03 },
    humidity: { min: 30, max: 50, effect: 0.02 },
    aiConfidence: 0.95,
    createdAt: new Date()
  },
  outro: {
    id: 'profile-outro',
    category: 'outro',
    name: 'Perfil Genérico',
    description: 'Perfil padrão para outros equipamentos',
    baseResistance: { min: 0.5e9, max: 5e9, decay: 0.05 },
    temperature: { min: 20, max: 30, effect: 0.015 },
    humidity: { min: 40, max: 60, effect: 0.01 },
    aiConfidence: 0.8,
    createdAt: new Date()
  }
};

// Inicializar configuração padrão se não existir
export async function initializeDatabase() {
  try {
    // Configuração original
    const config = await db.configuration.get('default');
    if (!config) {
      await db.configuration.put({
        id: 'default',
        ...defaultTestConfiguration
      });
    }
    
    // Perfis de categoria
    const profiles = await db.categoryProfiles.toArray();
    if (profiles.length === 0) {
      await insertDefaultCategoryProfiles();
    }
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    // Fallback para localStorage se IndexedDB falhar
    if (!localStorage.getItem('eletrilab-config')) {
      localStorage.setItem('eletrilab-config', JSON.stringify(defaultTestConfiguration));
    }
  }
}

// Inserir perfis padrão de categoria
async function insertDefaultCategoryProfiles(): Promise<void> {
  const profiles = Object.values(defaultCategoryProfiles);
  await db.categoryProfiles.bulkAdd(profiles);
}

// Funções utilitárias para o banco de dados
export const dbUtils = {
  // === FUNÇÕES ORIGINAIS (para compatibilidade) ===
  
  // Equipamentos
  async getAllEquipment(): Promise<EquipmentOriginal[]> {
    try {
      return await db.equipment.toArray();
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error);
      return [];
    }
  },

  async getEquipmentById(id: string): Promise<EquipmentOriginal | undefined> {
    try {
      return await db.equipment.get(id);
    } catch (error) {
      console.error('Erro ao buscar equipamento:', error);
      return undefined;
    }
  },

  async addEquipment(equipment: Omit<EquipmentOriginal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const newEquipment: EquipmentOriginal = {
        ...equipment,
        id,
        createdAt: now,
        updatedAt: now
      };
      await db.equipment.add(newEquipment);
      return id;
    } catch (error) {
      console.error('Erro ao adicionar equipamento:', error);
      throw error;
    }
  },

  async updateEquipment(id: string, updates: Partial<EquipmentOriginal>): Promise<void> {
    try {
      const equipment = await db.equipment.get(id);
      if (equipment) {
        await db.equipment.update(id, {
          ...updates,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar equipamento:', error);
      throw error;
    }
  },

  async deleteEquipment(id: string): Promise<void> {
    try {
      await db.equipment.delete(id);
    } catch (error) {
      console.error('Erro ao deletar equipamento:', error);
      throw error;
    }
  },

  // Relatórios originais
  async getAllReports(): Promise<ReportOriginal[]> {
    try {
      return await db.report.toArray();
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      return [];
    }
  },

  async getReportById(id: string): Promise<ReportOriginal | undefined> {
    try {
      return await db.report.get(id);
    } catch (error) {
      console.error('Erro ao buscar relatório:', error);
      return undefined;
    }
  },

  async addReport(report: Omit<ReportOriginal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const newReport: ReportOriginal = {
        ...report,
        id,
        createdAt: now,
        updatedAt: now
      };
      await db.report.add(newReport);
      return id;
    } catch (error) {
      console.error('Erro ao adicionar relatório:', error);
      throw error;
    }
  },

  async updateReport(id: string, updates: Partial<ReportOriginal>): Promise<void> {
    try {
      const report = await db.report.get(id);
      if (report) {
        await db.report.update(id, {
          ...updates,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar relatório:', error);
      throw error;
    }
  },

  async deleteReport(id: string): Promise<void> {
    try {
      await db.report.delete(id);
      // Deletar testes relacionados
      await db.test.where('reportId').equals(id).delete();
    } catch (error) {
      console.error('Erro ao deletar relatório:', error);
      throw error;
    }
  },

  // Testes originais
  async getAllTests(): Promise<TestOriginal[]> {
    try {
      return await db.test.toArray();
    } catch (error) {
      console.error('Erro ao buscar testes:', error);
      return [];
    }
  },

  async getTestsByReportId(reportId: string): Promise<TestOriginal[]> {
    try {
      return await db.test.where('reportId').equals(reportId).toArray();
    } catch (error) {
      console.error('Erro ao buscar testes do relatório:', error);
      return [];
    }
  },

  async addTest(test: Omit<TestOriginal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const newTest: TestOriginal = {
        ...test,
        id,
        createdAt: now,
        updatedAt: now
      };
      await db.test.add(newTest);
      return id;
    } catch (error) {
      console.error('Erro ao adicionar teste:', error);
      throw error;
    }
  },

  async updateTest(id: string, updates: Partial<TestOriginal>): Promise<void> {
    try {
      const test = await db.test.get(id);
      if (test) {
        await db.test.update(id, {
          ...updates,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar teste:', error);
      throw error;
    }
  },

  async deleteTest(id: string): Promise<void> {
    try {
      await db.test.delete(id);
    } catch (error) {
      console.error('Erro ao deletar teste:', error);
      throw error;
    }
  },

  // Configuração original
  async getConfiguration(): Promise<TestConfiguration> {
    try {
      const config = await db.configuration.get('default');
      return config || defaultTestConfiguration;
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      // Fallback para localStorage
      const stored = localStorage.getItem('eletrilab-config');
      return stored ? JSON.parse(stored) : defaultTestConfiguration;
    }
  },

  async updateConfiguration(config: TestConfiguration): Promise<void> {
    try {
      await db.configuration.put({
        id: 'default',
        ...config
      });
      // Backup no localStorage
      localStorage.setItem('eletrilab-config', JSON.stringify(config));
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      // Fallback para localStorage
      localStorage.setItem('eletrilab-config', JSON.stringify(config));
    }
  },

  // === NOVAS FUNÇÕES ===
  
  // Relatórios IR
  async getAllIRReports(): Promise<IRReport[]> {
    try {
      return await db.irReports.toArray();
    } catch (error) {
      console.error('Erro ao buscar relatórios IR:', error);
      return [];
    }
  },

  async getSavedIRReports(): Promise<IRReport[]> {
    try {
      return await db.irReports.where('isSaved').equals(1).toArray();
    } catch (error) {
      console.error('Erro ao buscar relatórios salvos:', error);
      return [];
    }
  },

  async getIRReportsByCategory(category: string): Promise<IRReport[]> {
    try {
      return await db.irReports.where('category').equals(category).toArray();
    } catch (error) {
      console.error('Erro ao buscar relatórios por categoria:', error);
      return [];
    }
  },

  async saveIRReport(report: IRReport): Promise<void> {
    try {
      await db.irReports.add(report);
    } catch (error) {
      console.error('Erro ao salvar relatório IR:', error);
      throw error;
    }
  },

  async updateIRReport(id: string, report: Partial<IRReport>): Promise<void> {
    try {
      await db.irReports.update(id, report);
    } catch (error) {
      console.error('Erro ao atualizar relatório IR:', error);
      throw error;
    }
  },

  async deleteIRReport(id: string): Promise<void> {
    try {
      await db.irReports.delete(id);
    } catch (error) {
      console.error('Erro ao deletar relatório IR:', error);
      throw error;
    }
  },

  // SystemConfig
  async getSystemConfig(): Promise<SystemConfig | null> {
    try {
      const configs = await db.systemConfigs.toArray();
      return configs[0] || null;
    } catch (error) {
      console.error('Erro ao buscar configurações do sistema:', error);
      return null;
    }
  },

  async saveSystemConfig(config: SystemConfig): Promise<void> {
    try {
      await db.systemConfigs.add(config);
    } catch (error) {
      console.error('Erro ao salvar configuração do sistema:', error);
      throw error;
    }
  },

  // CategoryProfiles
  async getCategoryProfiles(): Promise<CategoryProfile[]> {
    try {
      return await db.categoryProfiles.toArray();
    } catch (error) {
      console.error('Erro ao buscar perfis de categoria:', error);
      return [];
    }
  },

  async getCategoryProfile(category: string): Promise<CategoryProfile | null> {
    try {
      return await db.categoryProfiles.where('category').equals(category).first() || null;
    } catch (error) {
      console.error('Erro ao buscar perfil de categoria:', error);
      return null;
    }
  },

  async saveCategoryProfile(profile: CategoryProfile): Promise<void> {
    try {
      await db.categoryProfiles.add(profile);
    } catch (error) {
      console.error('Erro ao salvar perfil de categoria:', error);
      throw error;
    }
  },

  // AILearningHistory
  async getAILearningHistory(category: string): Promise<AILearningHistory[]> {
    try {
      return await db.aiLearningHistory.where('category').equals(category).toArray();
    } catch (error) {
      console.error('Erro ao buscar histórico de IA:', error);
      return [];
    }
  },

  async saveAILearningHistory(history: AILearningHistory): Promise<void> {
    try {
      await db.aiLearningHistory.add(history);
    } catch (error) {
      console.error('Erro ao salvar histórico de IA:', error);
      throw error;
    }
  },

  // MultiPhaseConfig
  async getMultiPhaseConfigs(): Promise<MultiPhaseConfig[]> {
    try {
      return await db.multiPhaseConfigs.toArray();
    } catch (error) {
      console.error('Erro ao buscar configurações multiphase:', error);
      return [];
    }
  },

  async saveMultiPhaseConfig(config: MultiPhaseConfig): Promise<void> {
    try {
      await db.multiPhaseConfigs.add(config);
    } catch (error) {
      console.error('Erro ao salvar configuração multiphase:', error);
      throw error;
    }
  },

  // MultiPhaseReport
  async getMultiPhaseReports(): Promise<MultiPhaseReport[]> {
    try {
      return await db.multiPhaseReports.toArray();
    } catch (error) {
      console.error('Erro ao buscar relatórios multiphase:', error);
      return [];
    }
  },

  async saveMultiPhaseReport(report: MultiPhaseReport): Promise<void> {
    try {
      await db.multiPhaseReports.add(report);
    } catch (error) {
      console.error('Erro ao salvar relatório multiphase:', error);
      throw error;
    }
  },

  // Parameters
  async getParameters(category: string): Promise<Parameter[]> {
    try {
      return await db.parameters.where('category').equals(category).toArray();
    } catch (error) {
      console.error('Erro ao buscar parâmetros:', error);
      return [];
    }
  },

  async saveParameter(parameter: Parameter): Promise<void> {
    try {
      await db.parameters.add(parameter);
    } catch (error) {
      console.error('Erro ao salvar parâmetro:', error);
      throw error;
    }
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<any> {
    try {
      const totalReports = await db.irReports.count();
      const totalEquipment = await db.equipment.count();
      const totalTests = await db.test.count();
      const today = new Date().toISOString().split('T')[0];
      const savedToday = await db.irReports.filter(r => r.createdAt.toISOString().startsWith(today)).count();
      const multiPhase = await db.multiPhaseReports.count();
      const aiLearning = await db.aiLearningHistory.count();
      
      return {
        totalReports,
        totalEquipment,
        totalTests,
        savedToday,
        multiPhase,
        aiLearning,
        resultsDistribution: { BOM: 0, ACEITÁVEL: 0, REPROVADO: 0 },
        categoryDistribution: {},
        recentReports: []
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        totalReports: 0,
        totalEquipment: 0,
        totalTests: 0,
        savedToday: 0,
        multiPhase: 0,
        aiLearning: 0,
        resultsDistribution: { BOM: 0, ACEITÁVEL: 0, REPROVADO: 0 },
        categoryDistribution: {},
        recentReports: []
      };
    }
  },

  // AI Learning
  async recordAILearning(data: AILearningHistory): Promise<void> {
    try {
      await db.aiLearningHistory.add(data);
    } catch (error) {
      console.error('Erro ao registrar aprendizado de IA:', error);
      throw error;
    }
  },

  // Report Number Generation
  async getNextReportNumber(): Promise<string> {
    try {
      const count = await db.irReports.count();
      return `REP-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      console.error('Erro ao gerar número do relatório:', error);
      return `REP-${String(Date.now()).slice(-4)}`;
    }
  },

  // Category Profiles
  async updateCategoryProfile(profile: CategoryProfile): Promise<void> {
    try {
      await db.categoryProfiles.put(profile);
    } catch (error) {
      console.error('Erro ao atualizar perfil de categoria:', error);
      throw error;
    }
  },

  async deleteCategoryProfile(id: string): Promise<void> {
    try {
      await db.categoryProfiles.delete(id);
    } catch (error) {
      console.error('Erro ao deletar perfil de categoria:', error);
      throw error;
    }
  },

  // Função para limpar banco de dados (útil para testes)
  async clearDatabase(): Promise<void> {
    try {
      await db.equipment.clear();
      await db.report.clear();
      await db.test.clear();
      await db.configuration.clear();
      await db.irReports.clear();
      await db.parameters.clear();
      await db.multiPhaseConfigs.clear();
      await db.multiPhaseReports.clear();
      await db.aiLearningHistory.clear();
      await db.categoryProfiles.clear();
      await db.systemConfigs.clear();
    } catch (error) {
      console.error('Erro ao limpar banco de dados:', error);
      throw error;
    }
  }
};