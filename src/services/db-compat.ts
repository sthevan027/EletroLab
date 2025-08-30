import * as real from '../db/database';
import type { IRReport, Equipment, Test, AILearningHistory, EquipmentOriginal, ReportOriginal, TestOriginal } from '../types';

// Reexporte tudo do serviço real
export * from '../db/database';

// Funções de conversão
function convertEquipmentToCompat(equipment: EquipmentOriginal): Equipment {
  return {
    id: parseInt(equipment.id) || 0,
    name: equipment.tag,
    category: equipment.category as any, // conversão de tipos
    manufacturer: equipment.manufacturer,
    model: equipment.model,
    tag: equipment.tag,
    calibrationDue: equipment.lastMaintenance,
    nextCalibration: equipment.installationDate,
  };
}

function convertReportToCompat(report: ReportOriginal): IRReport {
  return {
    id: report.id,
    createdAt: new Date(report.createdAt),
    category: 'cabo' as any,
    kv: 1.0,
    readings: [],
    dai: "Undefined",
    isSaved: false,
    operator: report.responsible,
    site: report.location,
    client: report.client,
    notes: report.observations,
  };
}

function convertTestToCompat(test: TestOriginal): Test {
  return {
    id: parseInt(test.id) || 0,
    reportId: parseInt(test.reportId) || 0,
    type: test.testType as any,
    value: test.value,
    unit: test.unit as any,
    classification: test.result as any,
    measuredAt: test.performedAt,
  };
}

// === Aliases esperados pelas páginas antigas ===
export async function getAllEquipment(): Promise<Equipment[]> {
  try {
    const equipmentList = await real.dbUtils.getAllEquipment();
    return equipmentList.map(convertEquipmentToCompat);
  } catch (error) {
    console.error('Erro ao buscar equipamentos:', error);
    return [];
  }
}

export async function addEquipment(e: Equipment) {
  try {
    // Conversão de Equipment para EquipmentOriginal
    const equipmentOriginal: Omit<EquipmentOriginal, 'id' | 'createdAt' | 'updatedAt'> = {
      tag: e.tag || e.name,
      category: 'motor', // default
      description: e.name,
      location: '',
      manufacturer: e.manufacturer || '',
      model: e.model || '',
      serialNumber: '',
      installationDate: e.nextCalibration || new Date().toISOString(),
      lastMaintenance: e.calibrationDue || new Date().toISOString(),
      status: 'ativo',
      notes: '',
    };
    return await real.dbUtils.addEquipment(equipmentOriginal);
  } catch (error) {
    console.error('Erro ao adicionar equipamento:', error);
    return null;
  }
}

export async function updateEquipment(id: number | string, e: Partial<Equipment>) {
  try {
    const updates: Partial<EquipmentOriginal> = {
      tag: e.tag || e.name,
      description: e.name,
      manufacturer: e.manufacturer,
      model: e.model,
    };
    return await real.dbUtils.updateEquipment(String(id), updates);
  } catch (error) {
    console.error('Erro ao atualizar equipamento:', error);
    return null;
  }
}

export async function deleteEquipment(id: number | string) {
  try {
    return await real.dbUtils.deleteEquipment(String(id));
  } catch (error) {
    console.error('Erro ao deletar equipamento:', error);
    return null;
  }
}

export async function getConfiguration() {
  try {
    return await real.dbUtils.getConfiguration();
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    return {};
  }
}

export async function addReport(r: IRReport) {
  try {
    const reportOriginal: Omit<ReportOriginal, 'id' | 'createdAt' | 'updatedAt'> = {
      number: String(r.id || Math.random()),
      date: r.createdAt.toISOString(),
      client: r.client || '',
      location: r.site || '',
      responsible: r.operator || '',
      status: 'rascunho',
      tests: [],
      observations: r.notes || '',
      recommendations: '',
      attachments: [],
    };
    const id = await real.dbUtils.addReport(reportOriginal);
    return { id: parseInt(id) || Math.random() };
  } catch (error) {
    console.error('Erro ao adicionar relatório:', error);
    return { id: Math.random() };
  }
}

export async function addTest(t: Test) {
  try {
    const testOriginal: Omit<TestOriginal, 'id' | 'createdAt' | 'updatedAt'> = {
      reportId: String(t.reportId),
      equipmentId: String(t.reportId), // placeholder
      testType: 'megger', // default
      value: t.value,
      unit: t.unit,
      result: 'BOM', // default
      limits: { min: 0, good: 100, unit: t.unit },
      notes: '',
      performedBy: '',
      performedAt: t.measuredAt,
    };
    const id = await real.dbUtils.addTest(testOriginal);
    return { id: parseInt(id) || Math.random() };
  } catch (error) {
    console.error('Erro ao adicionar teste:', error);
    return { id: Math.random() };
  }
}

export async function getReportById(id: number | string): Promise<IRReport | undefined> {
  try {
    const report = await real.dbUtils.getReportById(String(id));
    return report ? convertReportToCompat(report) : undefined;
  } catch (error) {
    console.error('Erro ao buscar relatório:', error);
    return undefined;
  }
}

export async function getTestsByReportId(id: number | string): Promise<Test[]> {
  try {
    const tests = await real.dbUtils.getTestsByReportId(String(id));
    return tests.map(convertTestToCompat);
  } catch (error) {
    console.error('Erro ao buscar testes:', error);
    return [];
  }
}

export async function saveAILearningHistory(h: AILearningHistory) {
  // Para compatibilidade - não implementado no sistema original
  console.log('saveAILearningHistory called but not implemented:', h);
  return null;
}
