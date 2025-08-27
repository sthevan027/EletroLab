import Dexie, { Table } from 'dexie';
import { 
  IRReport, 
  MultiPhaseConfig, 
  MultiPhaseReport, 
  AILearningHistory, 
  Parameter,
  CategoryProfile,
  SystemConfig,
  Category
} from '../types';

export class EletriLabDB extends Dexie {
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
    name: 'Perfil Outro',
    description: 'Perfil padrão para outros equipamentos',
    baseResistance: { min: 0.5e9, max: 5e9, decay: 0.05 },
    temperature: { min: 20, max: 30, effect: 0.02 },
    humidity: { min: 40, max: 60, effect: 0.01 },
    aiConfidence: 0.8,
    createdAt: new Date()
  }
};

// Configurações padrão do sistema (novo formato)
export const defaultSystemConfig: SystemConfig = {
  id: 'system-config-1',
  defaultOperator: '',
  defaultClient: '',
  defaultSite: '',
  aiEnabled: true,
  aiLearningRate: 0.1,
  defaultLimitTOhm: 5,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Inicializar banco de dados
export async function initializeDatabase(): Promise<void> {
  try {
    await db.open();
    
    // Inserir parâmetros padrão se não existirem
    const existingParams = await db.parameters.count();
    if (existingParams === 0) {
      await insertDefaultParameters();
    }
    
    // Inserir configurações do sistema se não existirem
    const existingConfigs = await db.systemConfigs.count();
    if (existingConfigs === 0) {
      await insertDefaultSystemConfig();
    }
    
    // Inserir perfis de categoria se não existirem
    const existingProfiles = await db.categoryProfiles.count();
    if (existingProfiles === 0) {
      await insertDefaultCategoryProfiles();
    }
    
    console.log('Banco de dados inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar banco:', error);
    throw error;
  }
}

// Inserir parâmetros padrão (compatibilidade com formato antigo)
async function insertDefaultParameters(): Promise<void> {
  const defaultParams: Parameter[] = [
    // Manter apenas parâmetros legados se necessário
    { id: 'legacy-params', key: 'initialized', value: true }
  ];
  
  await db.parameters.bulkAdd(defaultParams);
}

// Inserir configurações padrão do sistema
async function insertDefaultSystemConfig(): Promise<void> {
  await db.systemConfigs.add(defaultSystemConfig);
}

// Inserir perfis padrão de categoria
async function insertDefaultCategoryProfiles(): Promise<void> {
  const profiles = Object.values(defaultCategoryProfiles);
  await db.categoryProfiles.bulkAdd(profiles);
}

// Funções utilitárias para o banco de dados
export const dbUtils = {
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
      const existing = await this.getSystemConfig();
      if (existing && existing.id) {
        await db.systemConfigs.update(existing.id, {
          ...config,
          updatedAt: new Date()
        });
      } else {
        await db.systemConfigs.add({
          ...config,
          id: config.id || `config_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Erro ao salvar configurações do sistema:', error);
      throw error;
    }
  },

  // CategoryProfile
  async getCategoryProfiles(): Promise<CategoryProfile[]> {
    try {
      return await db.categoryProfiles.toArray();
    } catch (error) {
      console.error('Erro ao buscar perfis de categoria:', error);
      return [];
    }
  },

  async getCategoryProfile(category: Category): Promise<CategoryProfile> {
    try {
      const profile = await db.categoryProfiles
        .where('category')
        .equals(category)
        .first();
      return profile || defaultCategoryProfiles[category] || defaultCategoryProfiles.outro;
    } catch (error) {
      console.error('Erro ao buscar perfil de categoria:', error);
      return defaultCategoryProfiles[category] || defaultCategoryProfiles.outro;
    }
  },

  async saveCategoryProfile(profile: CategoryProfile): Promise<void> {
    try {
      const newProfile = {
        ...profile,
        id: profile.id || `profile_${Date.now()}`,
        createdAt: profile.createdAt || new Date(),
        updatedAt: new Date()
      };
      await db.categoryProfiles.add(newProfile);
    } catch (error) {
      console.error('Erro ao salvar perfil de categoria:', error);
      throw error;
    }
  },

  async updateCategoryProfile(profile: CategoryProfile): Promise<void> {
    try {
      await db.categoryProfiles.update(profile.id, {
        ...profile,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil de categoria:', error);
      throw error;
    }
  },

  async deleteCategoryProfile(id: string): Promise<void> {
    try {
      await db.categoryProfiles.delete(id);
    } catch (error) {
      console.error('Erro ao excluir perfil de categoria:', error);
      throw error;
    }
  },

  // IA Learning
  async recordAILearning(learning: AILearningHistory): Promise<void> {
    try {
      await db.aiLearningHistory.add(learning);
    } catch (error) {
      console.error('Erro ao registrar aprendizado de IA:', error);
      throw error;
    }
  },

  async getAILearningHistory(category?: Category): Promise<AILearningHistory[]> {
    try {
      if (category) {
        return await db.aiLearningHistory.where('category').equals(category).toArray();
      }
      return await db.aiLearningHistory.toArray();
    } catch (error) {
      console.error('Erro ao buscar histórico de IA:', error);
      return [];
    }
  },

  // Multi-Phase
  async saveMultiPhaseConfig(config: MultiPhaseConfig): Promise<void> {
    try {
      await db.multiPhaseConfigs.add(config);
    } catch (error) {
      console.error('Erro ao salvar configuração multi-fase:', error);
      throw error;
    }
  },

  async getMultiPhaseConfigs(): Promise<MultiPhaseConfig[]> {
    try {
      return await db.multiPhaseConfigs.toArray();
    } catch (error) {
      console.error('Erro ao buscar configurações multi-fase:', error);
      return [];
    }
  },

  async saveMultiPhaseReport(report: MultiPhaseReport): Promise<void> {
    try {
      await db.multiPhaseReports.add(report);
    } catch (error) {
      console.error('Erro ao salvar relatório multi-fase:', error);
      throw error;
    }
  },

  async getMultiPhaseReports(): Promise<MultiPhaseReport[]> {
    try {
      return await db.multiPhaseReports.toArray();
    } catch (error) {
      console.error('Erro ao buscar relatórios multi-fase:', error);
      return [];
    }
  },

  // Utilities
  async getNextReportNumber(): Promise<string> {
    try {
      const count = await db.irReports.where('isSaved').equals(1).count();
      return String(count + 1).padStart(4, '0');
    } catch (error) {
      console.error('Erro ao gerar número do relatório:', error);
      return '0001';
    }
  },

  async getDashboardStats(): Promise<any> {
    try {
      const [totalReports, savedToday, multiPhase, aiLearning, recentReports] = await Promise.all([
        db.irReports.count(),
        db.irReports.where('isSaved').equals(1).count(),
        db.multiPhaseReports.count(),
        db.aiLearningHistory.count(),
        db.irReports.orderBy('createdAt').reverse().limit(5).toArray()
      ]);

      return {
        totalReports,
        savedToday,
        multiPhase,
        aiLearning,
        recentReports
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      return {
        totalReports: 0,
        savedToday: 0,
        multiPhase: 0,
        aiLearning: 0,
        recentReports: []
      };
    }
  },

  // Backup e Restore
  async exportDatabase(): Promise<Blob> {
    try {
      const data = {
        irReports: await db.irReports.toArray(),
        parameters: await db.parameters.toArray(),
        multiPhaseConfigs: await db.multiPhaseConfigs.toArray(),
        multiPhaseReports: await db.multiPhaseReports.toArray(),
        aiLearningHistory: await db.aiLearningHistory.toArray(),
        categoryProfiles: await db.categoryProfiles.toArray(),
        systemConfigs: await db.systemConfigs.toArray(),
        exportDate: new Date().toISOString()
      };
      
      return new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
    } catch (error) {
      console.error('Erro ao exportar banco de dados:', error);
      throw error;
    }
  },

  async importDatabase(file: File): Promise<void> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      await db.transaction('rw', [
        db.irReports, 
        db.parameters, 
        db.multiPhaseConfigs,
        db.multiPhaseReports,
        db.aiLearningHistory,
        db.categoryProfiles,
        db.systemConfigs
      ], async () => {
        await db.irReports.clear();
        await db.parameters.clear();
        await db.multiPhaseConfigs.clear();
        await db.multiPhaseReports.clear();
        await db.aiLearningHistory.clear();
        await db.categoryProfiles.clear();
        await db.systemConfigs.clear();
        
        await db.irReports.bulkAdd(data.irReports || []);
        await db.parameters.bulkAdd(data.parameters || []);
        await db.multiPhaseConfigs.bulkAdd(data.multiPhaseConfigs || []);
        await db.multiPhaseReports.bulkAdd(data.multiPhaseReports || []);
        await db.aiLearningHistory.bulkAdd(data.aiLearningHistory || []);
        await db.categoryProfiles.bulkAdd(data.categoryProfiles || []);
        await db.systemConfigs.bulkAdd(data.systemConfigs || []);
      });
    } catch (error) {
      console.error('Erro ao importar banco de dados:', error);
      throw error;
    }
  },

  async clearDatabase(): Promise<void> {
    try {
      await db.transaction('rw', [
        db.irReports, 
        db.parameters, 
        db.multiPhaseConfigs,
        db.multiPhaseReports,
        db.aiLearningHistory,
        db.categoryProfiles,
        db.systemConfigs
      ], async () => {
        await db.irReports.clear();
        await db.parameters.clear();
        await db.multiPhaseConfigs.clear();
        await db.multiPhaseReports.clear();
        await db.aiLearningHistory.clear();
        await db.categoryProfiles.clear();
        await db.systemConfigs.clear();
      });
      
      // Reinserir dados padrão
      await insertDefaultSystemConfig();
      await insertDefaultCategoryProfiles();
      
    } catch (error) {
      console.error('Erro ao limpar banco de dados:', error);
      throw error;
    }
  }
};