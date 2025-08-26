import Dexie, { Table } from 'dexie';
import { Equipment, Report, Test, TestConfiguration } from '../types';

export interface ConfigRecord extends TestConfiguration {
  id: string;
}

export class EletriLabDB extends Dexie {
  equipment!: Table<Equipment>;
  report!: Table<Report>;
  test!: Table<Test>;
  configuration!: Table<ConfigRecord>;

  constructor() {
    super('EletriLabDB');
    
    this.version(1).stores({
      equipment: 'id, tag, category, status, location, manufacturer',
      report: 'id, number, date, client, status, responsible',
      test: 'id, reportId, equipmentId, testType, result, performedAt',
      configuration: 'id'
    });
  }
}

export const db = new EletriLabDB();

// Configuração padrão dos testes
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

// Inicializar configuração padrão se não existir
export async function initializeDatabase() {
  try {
    const config = await db.configuration.get('default');
    if (!config) {
      await db.configuration.put({
        id: 'default',
        ...defaultTestConfiguration
      });
    }
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    // Fallback para localStorage se IndexedDB falhar
    if (!localStorage.getItem('eletrilab-config')) {
      localStorage.setItem('eletrilab-config', JSON.stringify(defaultTestConfiguration));
    }
  }
}

// Funções utilitárias para o banco de dados
export const dbUtils = {
  // Equipamentos
  async getAllEquipment(): Promise<Equipment[]> {
    try {
      return await db.equipment.toArray();
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error);
      return [];
    }
  },

  async getEquipmentById(id: string): Promise<Equipment | undefined> {
    try {
      return await db.equipment.get(id);
    } catch (error) {
      console.error('Erro ao buscar equipamento:', error);
      return undefined;
    }
  },

  async addEquipment(equipment: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const newEquipment: Equipment = {
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

  async updateEquipment(id: string, updates: Partial<Equipment>): Promise<void> {
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

  // Relatórios
  async getAllReports(): Promise<Report[]> {
    try {
      return await db.report.toArray();
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      return [];
    }
  },

  async getReportById(id: string): Promise<Report | undefined> {
    try {
      return await db.report.get(id);
    } catch (error) {
      console.error('Erro ao buscar relatório:', error);
      return undefined;
    }
  },

  async addReport(report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const newReport: Report = {
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

  async updateReport(id: string, updates: Partial<Report>): Promise<void> {
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

  // Testes
  async getAllTests(): Promise<Test[]> {
    try {
      return await db.test.toArray();
    } catch (error) {
      console.error('Erro ao buscar testes:', error);
      return [];
    }
  },

  async getTestsByReportId(reportId: string): Promise<Test[]> {
    try {
      return await db.test.where('reportId').equals(reportId).toArray();
    } catch (error) {
      console.error('Erro ao buscar testes do relatório:', error);
      return [];
    }
  },

  async addTest(test: Omit<Test, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const newTest: Test = {
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

  async updateTest(id: string, updates: Partial<Test>): Promise<void> {
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

  // Configuração
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
  }
};
