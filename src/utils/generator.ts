/**
 * Gerador de séries IR para relatórios Megger
 * Versão 2.0 com IA Avançada
 */

import { Category, CategoryProfile, IRReport, MultiPhaseConfig, MultiPhaseReport, PhysicalCableOptions, EnvironmentalFactors } from '../types';
import { formatResistance, formatVoltage, getStandardTimeSeries, calculateDAI, parseResistance } from './units';
import { calculateHybridResistance, formatResistance as formatResistancePhysics, applyTimeDecay, getInsulationConstant, estimateDiametersFromGauge, calculatePhysicalResistance, scaleResistanceForLength, applyEnvironmentalAdjustments } from './physics';
import { dbUtils } from '../db/database';
import { aiEngine, AIGenerationContext, AIGenerationResult } from './ai-engine';

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
  // Campos físicos opcionais
  cableLength?: number;              // metros
  cableGauge?: number;               // mm²
  insulationMaterial?: 'XLPE' | 'EPR' | 'PVC' | 'outro';
  conductorDiameter?: number;        // mm
  insulationThickness?: number;      // mm
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
  confidence?: number;
  insights?: any[];
  warnings?: string[];
  recommendations?: string[];
  meta?: any;
}

/**
 * Gera uma série IR baseada na categoria e configurações
 */
export async function generateIRSeries(opts: IRGenerationOptions): Promise<IRGenerationResult> {
  return await gerarSerieIR(opts);
}

/**
 * Gera uma série IR baseada na categoria e configurações usando IA Avançada
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

  // 1) Priorizar cálculo físico quando dados do cabo estiverem disponíveis
  const hasPhysicalInputs =
    category === 'cabo' &&
    opts.cableLength && opts.cableLength > 0 &&
    opts.cableGauge && opts.cableGauge > 0 &&
    !!opts.insulationMaterial;

  if (hasPhysicalInputs) {
    // Fatores ambientais básicos (poderão vir do formulário futuramente)
    const temperature = 25 + (Math.random() - 0.5) * 6; // 22–28°C
    const humidity = 55 + (Math.random() - 0.5) * 10;   // 50–60%

    // Pipeline explícito para obter meta
    const Ki = getInsulationConstant(opts.insulationMaterial as any);
    const { d, D } = estimateDiametersFromGauge(
      opts.cableGauge!,
      opts.conductorDiameter,
      opts.insulationThickness
    );
    const RiBaseMOhm = calculatePhysicalResistance(Ki, D, d, opts.cableLength!);
    const scaledMOhm = scaleResistanceForLength(RiBaseMOhm, opts.cableLength!, { boostShortLength: opts.shortLengthBoost !== false });
    const scaleFactor = RiBaseMOhm > 0 ? scaledMOhm / RiBaseMOhm : 1;
    const RiMOhm = applyEnvironmentalAdjustments(scaledMOhm, temperature, humidity);

    // Gerar série temporal com leve decaimento
    const times = getStandardTimeSeries();
    const readings = times.map((time, index) => {
      const valueMOhm = applyTimeDecay(RiMOhm, index, 0.98);
      return {
        time,
        kv: formatVoltage(kv),
        resistance: formatResistancePhysics(valueMOhm, limitTOhm)
      };
    });

    const dai = calculateDAI(readings);

    return {
      readings,
      dai,
      confidence: 0.9,
      insights: [],
      warnings: [],
      recommendations: [],
      meta: {
        physics: {
          RiBaseMOhm,
          scaleFactor,
          temperature,
          humidity,
          appliedBoost: opts.shortLengthBoost !== false,
          material: opts.insulationMaterial,
          gauge: opts.cableGauge,
          lengthMeters: opts.cableLength
        }
      }
    };
  }

  // Buscar histórico de aprendizado
  const historicalData = await dbUtils.getAILearningHistory(category);
  
  // Criar contexto para IA
  const context: AIGenerationContext = {
    category,
    historicalData: historicalData.map(h => h.output ? JSON.parse(h.output).readings?.map((r: any) => parseResistance(r.resistance) || 0) : []).filter(arr => arr.length > 0),
    environmentalFactors: {
      temperature: 20 + Math.random() * 15, // 20-35°C
      humidity: 45 + Math.random() * 25,    // 45-70%
      pressure: 1013 + (Math.random() - 0.5) * 20 // 1003-1023 hPa
    },
    equipmentAge: Math.floor(Math.random() * 15), // 0-15 anos
    maintenanceHistory: [],
    manufacturer,
    model
  };

  // Usar IA avançada para gerar relatório
  const aiResult = await aiEngine.generateIRReport(context);
  
  // Calcular DAI
  const dai = calculateDAI(aiResult.readings);
  
  // Registrar aprendizado
  await dbUtils.recordAILearning({
    id: Date.now(),
    category,
    phaseCount: 1,
    phaseNames: ['single'],
    input: JSON.stringify(context),
    output: JSON.stringify(aiResult),
    createdAt: new Date().toISOString()
  });
  
  return { 
    readings: aiResult.readings, 
    dai,
    confidence: aiResult.confidence,
    insights: aiResult.insights,
    warnings: aiResult.warnings,
    recommendations: aiResult.recommendations
  };
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
 * Gera relatório multi-fase com IA Avançada
 */
export async function generateMultiPhaseReport(
  config: MultiPhaseConfig,
  options: {
    equipmentTag: string;
    operator: string;
    phaseCombinations: string[][];
    groundName: string;
    physicalOptions?: PhysicalCableOptions;
    environment?: EnvironmentalFactors;
    boostShortLength?: boolean;
  }
): Promise<{
  report: MultiPhaseReport;
  confidence: number;
  warnings: string[];
  insights?: any[];
  recommendations?: string[];
}> {
  const warnings: string[] = [];
  const phaseNames = config.phases.names;
  
  // Buscar histórico de aprendizado
  const historicalData = await dbUtils.getAILearningHistory(config.equipmentType);
  
  // Criar contexto para IA
  const context: AIGenerationContext = {
    category: config.equipmentType,
    historicalData: historicalData.map(h => h.output ? JSON.parse(h.output).readings?.map((r: any) => parseResistance(r.resistance) || 0) : []).filter(arr => arr.length > 0),
    environmentalFactors: {
      temperature: 20 + Math.random() * 15, // 20-35°C
      humidity: 45 + Math.random() * 25,    // 45-70%
      pressure: 1013 + (Math.random() - 0.5) * 20 // 1003-1023 hPa
    },
    equipmentAge: Math.floor(Math.random() * 15), // 0-15 anos
    maintenanceHistory: [],
    manufacturer: undefined,
    model: undefined
  };

  // Determinar se podemos usar física
  const canUsePhysics =
    config.equipmentType === 'cabo' &&
    options.physicalOptions &&
    options.physicalOptions.length > 0 &&
    options.physicalOptions.gauge > 0 &&
    !!options.physicalOptions.material;

  let baseValues: number[] = [];
  let aiConfidence = 0.85;
  let aiWarnings: string[] = [];
  let aiInsights: any[] | undefined = undefined;
  let aiRecommendations: any[] | undefined = undefined;

  if (canUsePhysics) {
    const env = options.environment || { temperature: 25, humidity: 50 };
    const RiMOhm = calculateHybridResistance(
      options.physicalOptions!,
      env,
      { boostShortLength: options.boostShortLength !== false }
    );
    // Base por fase com pequena variação (convertido para ohms)
    baseValues = phaseNames.map(() => {
      const jitter = 1 + (Math.random() - 0.5) * 0.04; // ±2%
      return RiMOhm * jitter * 1e6;
    });
    aiConfidence = 0.9;
  } else {
    // Usar IA avançada para gerar valores base
    const aiResult = await aiEngine.generateIRReport(context);
    aiConfidence = aiResult.confidence;
    aiWarnings = aiResult.warnings;
    aiInsights = aiResult.insights;
    aiRecommendations = aiResult.recommendations;
    
    // Gerar valores base para cada fase usando IA
    baseValues = phaseNames.map(() => {
      const aiValues = aiResult.readings.map(r => parseResistance(r.resistance) || 0);
      return aiValues[Math.floor(Math.random() * aiValues.length)];
    });
  }
  
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
  
  // Buscar perfil uma vez
  const profile = await dbUtils.getCategoryProfile(config.equipmentType) || getDefaultProfile(config.equipmentType);

  // Testes fase × fase
  options.phaseCombinations.forEach((combo, comboIndex) => {
    const phase1Index = phaseNames.indexOf(combo[0]);
    const phase2Index = phaseNames.indexOf(combo[1]);
    
    if (phase1Index !== -1 && phase2Index !== -1) {
      // Valor correlacionado entre as duas fases usando IA
      const baseValue = (baseValues[phase1Index] + baseValues[phase2Index]) / 2;
      const subReadings: { time: string; kv: string; resistance: string }[] = [];
      
      times.forEach(time => {
        const timeMinutes = parseTime(time);
        let value = simulateTimeDecay(baseValue, timeMinutes, 0.95);
        
        if (canUsePhysics) {
          value *= 1.1 * (1 + (Math.random() - 0.5) * 0.04);
        } else {
          // Aplicar fatores ambientais usando IA
          const temperature = context.environmentalFactors.temperature;
          const humidity = context.environmentalFactors.humidity;
          value = applyEnvironmentalFactors(value, temperature, humidity, profile);
          
          // Variação baseada na confiança da IA
          const variation = 1 + (Math.random() - 0.5) * (1 - aiConfidence) * 0.2;
          value *= variation;
        }
        
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
    let baseValue = baseValues[phaseIndex];
    // Fase/massa tipicamente menor
    baseValue = baseValue * (canUsePhysics ? 0.93 : 0.8);
    const subReadings: { time: string; kv: string; resistance: string }[] = [];
    
    times.forEach(time => {
      const timeMinutes = parseTime(time);
      let value = simulateTimeDecay(baseValue, timeMinutes, 0.95);
      
      if (canUsePhysics) {
        value *= 1.0 * (1 + (Math.random() - 0.5) * 0.06); // ±3%
      } else {
        // Aplicar fatores ambientais usando IA
        const temperature = context.environmentalFactors.temperature;
        const humidity = context.environmentalFactors.humidity;
        value = applyEnvironmentalFactors(value, temperature, humidity, profile);
        
        // Variação baseada na confiança da IA
        const variation = 1 + (Math.random() - 0.5) * (1 - aiConfidence) * 0.3;
        value *= variation;
      }
      
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
  
  // Calcular confiança baseada na IA/Física
  let confidence = aiConfidence;
  
  // Verificar consistência dos valores
  const phaseToPhaseValues = readings.filter(r => r.phase < options.phaseCombinations.length);
  const phaseToGroundValues = readings.filter(r => r.phase >= options.phaseCombinations.length);
  
  if (phaseToPhaseValues.length < phaseToGroundValues.length) {
    warnings.push('Valores fase/fase parecem inconsistentes com fase/massa');
    confidence *= 0.9;
  }
  
  // Adicionar warnings da IA
  warnings.push(...aiWarnings);
  
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
  
  // Registrar aprendizado
  await dbUtils.recordAILearning({
    id: Date.now(),
    category: config.equipmentType,
    phaseCount: phaseNames.length,
    phaseNames,
    input: JSON.stringify({
      equipmentType: config.equipmentType,
      voltage: config.voltage,
      phaseNames,
      combinations: options.phaseCombinations
    }),
    output: JSON.stringify({ report, confidence, warnings }),
    createdAt: new Date().toISOString()
  });
  
  return {
    report,
    confidence,
    warnings,
    insights: aiInsights,
    recommendations: aiRecommendations
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


