/**
 * Gerador de séries IR para relatórios Megger
 */

import { Category, CategoryProfile, IRReport, MultiPhaseConfig, MultiPhaseReport } from '../types';
import { formatResistance, formatVoltage, getStandardTimeSeries, calculateDAI, parseResistance } from './units';
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
  const readings = generateReadingsFromProfile(profile || getDefaultProfile(category), kv, limitTOhm);
  
  // Calcular DAI
  const dai = calculateDAI(readings);
  
  return { readings, dai };
}

/**
 * Retorna um perfil padrão para uma categoria
 */
function getDefaultProfile(category: Category): CategoryProfile {
  return {
    id: crypto.randomUUID(),
    category,
    name: `Perfil ${category}`,
    description: `Perfil padrão para ${category}`,
    baseResistance: {
      min: 1e6,
      max: 10e6,
      decay: 0.95
    },
    temperature: {
      min: 20,
      max: 25,
      effect: 0.02
    },
    humidity: {
      min: 50,
      max: 60,
      effect: 0.01
    },
    aiConfidence: 0.7,
    createdAt: new Date(),
    updatedAt: new Date()
  };
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
  await dbUtils.recordAILearning({
    category,
    phaseCount: 1,
    phaseNames: ['single'],
    input: 'generator_input',
    output: 'generator_output',
    createdAt: new Date().toISOString()
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

/**
 * Gera relatório multi-fase com IA
 */
export async function generateMultiPhaseReport(
  config: MultiPhaseConfig,
  options: {
    equipmentTag: string;
    operator: string;
    phaseCombinations: string[][];
    groundName: string;
  }
): Promise<{
  report: MultiPhaseReport;
  confidence: number;
  warnings: string[];
}> {
  const warnings: string[] = [];
  const phaseNames = config.phases.names;
  
  // Buscar perfil da categoria
  const profile = await dbUtils.getCategoryProfile(config.equipmentType) || getDefaultProfile(config.equipmentType);
  
  // Gerar valores base para cada fase
  const baseValues = phaseNames.map(() => {
    const min = profile.baseResistance.min;
    const max = profile.baseResistance.max;
    return min + Math.random() * (max - min);
  });
  
  // Gerar leituras para cada combinação e montar sub-relatórios
  const readings: {
    phase: number;
    time: string;
    resistance: string;
    temperature?: number;
    humidity?: number;
  }[] = [];
  const subReports: any[] = [];
  
  const times = getStandardTimeSeries();
  
  // Testes fase × fase
  options.phaseCombinations.forEach((combo, comboIndex) => {
    const phase1Index = phaseNames.indexOf(combo[0]);
    const phase2Index = phaseNames.indexOf(combo[1]);
    
    if (phase1Index !== -1 && phase2Index !== -1) {
      // Valor correlacionado entre as duas fases
      const baseValue = (baseValues[phase1Index] + baseValues[phase2Index]) / 2;
      const subReadings: { time: string; kv: string; resistance: string }[] = [];
      
      times.forEach(time => {
        const timeMinutes = parseTime(time);
        let value = simulateTimeDecay(baseValue, timeMinutes, profile.baseResistance.decay);
        
        // Aplicar fatores ambientais
        const temperature = 20 + Math.random() * 10;
        const humidity = 50 + Math.random() * 20;
        value = applyEnvironmentalFactors(value, temperature, humidity, profile);
        
        // Variação aleatória
        value = generateRandomVariation(value, 3);
        
        readings.push({
          phase: comboIndex,
          time,
          resistance: formatResistance(value),
          temperature,
          humidity
        });
        subReadings.push({ time, kv: '1.00', resistance: formatResistance(value) });
      });

      // Monta sub-relatório desta combinação (4 leituras)
      const daiValue = calculateDAI(
        subReadings.map(r => ({ time: r.time, kv: r.kv, resistance: r.resistance }))
      );
      subReports.push({
        id: `PP-${combo[0]}-${combo[1]}`,
        testNo: comboIndex + 1,
        type: 'phase-phase',
        description: `${combo[0]} × ${combo[1]}`,
        phases: [combo[0], combo[1]],
        readings: subReadings,
        dai: daiValue,
        comments: ''
      });
    }
  });
  
  // Testes fase × massa
  phaseNames.forEach((phase, phaseIndex) => {
    const baseValue = baseValues[phaseIndex] * 0.8; // Fase/massa tipicamente menor
    const subReadings: { time: string; kv: string; resistance: string }[] = [];
    
    times.forEach(time => {
      const timeMinutes = parseTime(time);
      let value = simulateTimeDecay(baseValue, timeMinutes, profile.baseResistance.decay);
      
      // Aplicar fatores ambientais
      const temperature = 20 + Math.random() * 10;
      const humidity = 50 + Math.random() * 20;
      value = applyEnvironmentalFactors(value, temperature, humidity, profile);
      
      // Variação aleatória
      value = generateRandomVariation(value, 5);
      
      readings.push({
        phase: phaseNames.length + phaseIndex, // Offset para fase/massa
        time,
        resistance: formatResistance(value),
        temperature,
        humidity
      });
      subReadings.push({ time, kv: '1.00', resistance: formatResistance(value) });
    });

    const daiValue = calculateDAI(
      subReadings.map(r => ({ time: r.time, kv: r.kv, resistance: r.resistance }))
    );
    subReports.push({
      id: `PG-${phase}-${options.groundName}`,
      testNo: options.phaseCombinations.length + phaseIndex + 1,
      type: 'phase-ground',
      description: `${phase} × ${options.groundName}`,
      phases: [phase, options.groundName],
      readings: subReadings,
      dai: daiValue,
      comments: ''
    });
  });
  
  // Calcular confiança baseada na consistência
  let confidence = profile.aiConfidence;
  
  // Verificar consistência dos valores
  const phaseToPhaseValues = readings.filter(r => r.phase < options.phaseCombinations.length);
  const phaseToGroundValues = readings.filter(r => r.phase >= options.phaseCombinations.length);
  
  if (phaseToPhaseValues.length < phaseToGroundValues.length) {
    warnings.push('Valores fase/fase parecem inconsistentes com fase/massa');
    confidence *= 0.9;
  }
  
  // Criar relatório
  const report: MultiPhaseReport = {
    id: crypto.randomUUID(),
    configId: config.id,
    equipmentTag: options.equipmentTag,
    operator: options.operator,
    readings,
    reports: subReports,
    summary: {
      phaseCount: phaseNames.length,
      averageResistance: baseValues.reduce((a, b) => a + b) / baseValues.length,
      status: 'Completo'
    },
    equipment: {
      tag: options.equipmentTag,
      category: config.equipmentType
    },
    createdAt: new Date(),
    isSaved: false
  };
  
  return {
    report,
    confidence,
    warnings
  };
}

/**
 * Simula degradação de isolamento ao longo do tempo
 */
function simulateTimeDecay(baseValue: number, timeMinutes: number, decayFactor: number): number {
  // Simular degradação exponencial
  const decayRate = Math.log(decayFactor) / 60; // por minuto
  return baseValue * Math.exp(decayRate * timeMinutes);
}

/**
 * Aplica variação devido a fatores ambientais
 */
function applyEnvironmentalFactors(
  value: number, 
  temperature: number, 
  humidity: number,
  profile: CategoryProfile
): number {
  // Efeito da temperatura (coeficiente negativo - resistência diminui com calor)
  const tempEffect = 1 + (temperature - 25) * profile.temperature.effect * -0.01;
  
  // Efeito da umidade (coeficiente negativo - resistência diminui com umidade)
  const humidityEffect = 1 + (humidity - 50) * profile.humidity.effect * -0.01;
  
  return value * tempEffect * humidityEffect;
}

/**
 * Gera variação aleatória realística
 */
function generateRandomVariation(baseValue: number, variationPercent: number = 5): number {
  const variation = (Math.random() - 0.5) * 2 * (variationPercent / 100);
  return baseValue * (1 + variation);
}

/**
 * Converte tempo formatado para minutos
 */
function parseTime(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}


