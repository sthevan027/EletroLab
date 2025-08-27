/**
 * Gerador de séries IR para relatórios Megger
 */

import { Category, CategoryProfile, IRReport } from '../types';
import { formatResistance, formatVoltage, getStandardTimeSeries, calculateDAI } from './units';
import { dbUtils } from '../db/database';

/**
 * Opções para geração de série IR
 */
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

/**
 * Resultado da geração de série IR
 */
export interface IRGenerationResult {
  readings: {
    time: string;
    kv: string;
    resistance: string;
  }[];
  dai: string;
}

/**
 * Gera uma série IR baseada na categoria e configurações
 */
export async function generateIRSeries(opts: IRGenerationOptions): Promise<IRGenerationResult> {
  return await gerarSerieIR(opts);
}

/**
 * Gera uma série IR baseada na categoria e configurações
 */
export async function gerarSerieIR(opts: IRGenerationOptions): Promise<IRGenerationResult> {
  const {
    category,
    kv = 1.0,
    limitTOhm = 5,
    tag,
    client,
    site,
    operator,
    manufacturer,
    model
  } = opts;

  // Buscar perfil da categoria
  const profile = await dbUtils.getCategoryProfile(category);
  
  // Gerar valores baseados no perfil
  const readings = generateReadingsFromProfile(profile, kv, limitTOhm);
  
  // Calcular DAI
  const dai = calculateDAI(readings);
  
  return { readings, dai };
}

/**
 * Gera leituras baseadas no perfil da categoria
 */
function generateReadingsFromProfile(
  profile: CategoryProfile,
  kv: number,
  limitTOhm: number
): { time: string; kv: string; resistance: string }[] {
  const times = getStandardTimeSeries();
  const { min: baseMin, max: baseMax, decay } = profile.baseResistance;
  
  // Valor inicial aleatório dentro da faixa base
  const baseValue = baseMin + Math.random() * (baseMax - baseMin);
  let currentValue = baseValue; // Já está em ohms
  
  const readings = times.map((time, index) => {
    // Aplicar decaimento se não for a primeira leitura
    if (index > 0) {
      const decayFactor = 1 - (decay * Math.random() * 0.5); // Variação do decaimento
      currentValue *= decayFactor;
    }
    
    return {
      time,
      kv: formatVoltage(kv),
      resistance: formatResistance(currentValue, limitTOhm)
    };
  });
  
  return readings;
}

/**
 * Gera um relatório IR completo
 */
export async function generateIRReport(opts: IRGenerationOptions): Promise<IRReport> {
  const result = await gerarSerieIR(opts);
  
  return {
    id: crypto.randomUUID(),
    category: opts.category,
    tag: opts.tag,
    kv: opts.kv || 1.0,
    client: opts.client,
    site: opts.site,
    operator: opts.operator,
    manufacturer: opts.manufacturer,
    model: opts.model,
    readings: result.readings,
    dai: result.dai,
    createdAt: new Date(),
    isSaved: false
  };
}

/**
 * Gera múltiplos relatórios IR com correlações (para multi-fase)
 */
export async function generateCorrelatedIRReports(
  baseOptions: IRGenerationOptions,
  count: number,
  correlationFactor: number = 0.8
): Promise<IRReport[]> {
  // Gerar relatório base
  const baseReport = await generateIRReport(baseOptions);
  const baseValues = baseReport.readings.map(r => {
    const value = parseResistance(r.resistance);
    return value || 0;
  });
  
  const reports: IRReport[] = [baseReport];
  
  // Gerar relatórios correlacionados
  for (let i = 1; i < count; i++) {
    const correlatedValues = baseValues.map(baseValue => {
      // Aplicar variação correlacionada
      const variation = 0.8 + Math.random() * 0.4; // ±20%
      return baseValue * variation;
    });
    
    const readings = baseReport.readings.map((reading, index) => ({
      ...reading,
      resistance: formatResistance(correlatedValues[index], baseOptions.limitTOhm || 5)
    }));
    
    const dai = calculateDAI(readings);
    
    reports.push({
      ...baseReport,
      id: crypto.randomUUID(),
      readings,
      dai
    });
  }
  
  return reports;
}

/**
 * Ajusta valores baseado em condições ambientais
 */
export function adjustForEnvironment(
  readings: { time: string; kv: string; resistance: string }[],
  temperature: number,
  humidity: number,
  quality: 'excellent' | 'good' | 'acceptable'
): { time: string; kv: string; resistance: string }[] {
  // Fatores de ajuste baseados na qualidade do ambiente
  const qualityFactors = {
    excellent: 1.0,
    good: 0.9,
    acceptable: 0.7
  };
  
  // Fator de temperatura (diminui com temperatura alta)
  const tempFactor = Math.max(0.5, 1 - (temperature - 20) * 0.02);
  
  // Fator de umidade (diminui com umidade alta)
  const humidityFactor = Math.max(0.6, 1 - (humidity - 50) * 0.005);
  
  const totalFactor = qualityFactors[quality] * tempFactor * humidityFactor;
  
  return readings.map(reading => {
    const value = parseResistance(reading.resistance);
    if (value !== undefined) {
      const adjustedValue = value * totalFactor;
      return {
        ...reading,
        resistance: formatResistance(adjustedValue)
      };
    }
    return reading;
  });
}

/**
 * Valida se os valores gerados estão dentro dos limites esperados
 */
export function validateGeneratedValues(
  readings: { resistance: string }[],
  category: Category,
  minGoodG: number
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  readings.forEach((reading, index) => {
    const value = parseResistance(reading.resistance);
    if (value !== undefined) {
      const valueG = value / 1e9;
      
      if (valueG < minGoodG * 0.3) {
        issues.push(`Leitura ${index + 1} (${reading.resistance}) está muito baixa para ${category}`);
      }
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Aprende com valores históricos para melhorar geração futura
 */
export async function learnFromHistory(
  category: Category,
  historicalValues: number[][]
): Promise<void> {
  if (historicalValues.length === 0) return;
  
  // Calcular médias e desvios
  const averages = historicalValues[0].map((_, index) => {
    const values = historicalValues.map(row => row[index]);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  });
  
  const correlations = historicalValues[0].map((_, index) => {
    if (index === 0) return 1;
    const currentValues = historicalValues.map(row => row[index]);
    const previousValues = historicalValues.map(row => row[index - 1]);
    
    // Calcular correlação simples
    const correlation = calculateCorrelation(previousValues, currentValues);
    return correlation;
  });
  
  // Salvar aprendizado
  await dbUtils.saveAILearningHistory({
    category,
    phaseCount: 1,
    phaseNames: ['single'],
    baseValues: averages,
    correlations: {
      phaseToPhase: [],
      phaseToGround: []
    },
    accuracy: 0.9,
    confidence: 0.8,
    usedCount: 1
  });
}

/**
 * Calcula correlação entre dois arrays de valores
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
  const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Gera valores baseados em aprendizado histórico
 */
export async function generateWithAI(
  category: Category,
  options: IRGenerationOptions
): Promise<IRGenerationResult> {
  // Buscar histórico de aprendizado
  const history = await dbUtils.getAILearningHistory(category);
  
  if (history.length === 0) {
    // Sem histórico, usar geração padrão
    return gerarSerieIR(options);
  }
  
  // Usar o histórico mais recente
  const latestHistory = history[0];
  
  // Gerar valores baseados no histórico
  const readings = generateReadingsFromHistory(latestHistory, options.kv || 1.0, options.limitTOhm || 5);
  const dai = calculateDAI(readings);
  
  return { readings, dai };
}

/**
 * Gera leituras baseadas em histórico de IA
 */
function generateReadingsFromHistory(
  history: any,
  kv: number,
  limitTOhm: number
): { time: string; kv: string; resistance: string }[] {
  const times = getStandardTimeSeries();
  const baseValues = history.baseValues;
  
  return times.map((time, index) => {
    let value = baseValues[index] || baseValues[0] || 5e9;
    
    // Aplicar variação baseada na confiança
    const confidence = history.confidence || 0.8;
    const variation = 1 + (Math.random() - 0.5) * (1 - confidence) * 0.4;
    value *= variation;
    
    return {
      time,
      kv: formatVoltage(kv),
      resistance: formatResistance(value, limitTOhm)
    };
  });
}


