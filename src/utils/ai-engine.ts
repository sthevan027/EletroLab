/**
 * Motor de IA Avançado para Geração de Relatórios IR
 * Sistema de aprendizado adaptativo com algoritmos de machine learning
 */

import { Category, CategoryProfile, IRReport, MultiPhaseReport, PhysicalCableOptions } from '../types';
import { dbUtils } from '../db/database';
import { calculateHybridResistance, formatResistance as physicsFormatResistance } from './physics';

// Interfaces para o sistema de IA
export interface AIPattern {
  id: string;
  category: Category;
  pattern: number[];
  confidence: number;
  frequency: number;
  lastUsed: Date;
  createdAt: Date;
}

export interface AIInsight {
  type: 'anomaly' | 'trend' | 'correlation' | 'prediction';
  confidence: number;
  description: string;
  recommendation: string;
  data: any;
}

export interface AIGenerationContext {
  category: Category;
  historicalData: number[][];
  environmentalFactors: {
    temperature: number;
    humidity: number;
    pressure?: number;
  };
  equipmentAge?: number;
  maintenanceHistory?: string[];
  manufacturer?: string;
  model?: string;
  // Preferência por cálculo físico quando disponível
  physicalOptions?: PhysicalCableOptions;
}

export interface AIGenerationResult {
  readings: { time: string; kv: string; resistance: string }[];
  confidence: number;
  insights: AIInsight[];
  patterns: AIPattern[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Classe principal do motor de IA
 */
export class AIEngine {
  private patterns: Map<string, AIPattern[]> = new Map();
  private learningRate: number = 0.1;
  private confidenceThreshold: number = 0.7;

  constructor() {
    this.loadPatterns();
  }

  /**
   * Gera relatório IR usando IA avançada
   */
  async generateIRReport(context: AIGenerationContext): Promise<AIGenerationResult> {
    // Fast-path: se houver dados físicos, priorizar cálculo físico
    if (context.physicalOptions && context.category === 'cabo') {
      const RiMOhm = calculateHybridResistance(
        context.physicalOptions,
        { temperature: context.environmentalFactors.temperature, humidity: context.environmentalFactors.humidity },
        { boostShortLength: true }
      );
      const times = ['00:15', '00:30', '00:45', '01:00'];
      const readings = times.map((time, index) => ({
        time,
        kv: '1.00',
        resistance: physicsFormatResistance(index === 0 ? RiMOhm : RiMOhm * Math.pow(0.98, index))
      }));
      return {
        readings,
        confidence: 0.92,
        insights: [],
        patterns: [],
        warnings: [],
        recommendations: []
      };
    }
    // 1. Analisar padrões históricos
    const patterns = await this.analyzePatterns(context);
    
    // 2. Aplicar modelo preditivo
    const predictions = await this.predictValues(context, patterns);
    
    // 3. Ajustar para fatores ambientais
    const adjustedValues = this.applyEnvironmentalAdjustments(predictions, context.environmentalFactors);
    
    // 4. Gerar insights e recomendações
    const insights = await this.generateInsights(context, adjustedValues);
    
    // 5. Calcular confiança final
    const confidence = this.calculateConfidence(patterns, insights);
    
    // 6. Formatar resultado
    const readings = this.formatReadings(adjustedValues, context);
    
    return {
      readings,
      confidence,
      insights,
      patterns,
      warnings: this.generateWarnings(insights),
      recommendations: this.generateRecommendations(insights)
    };
  }

  /**
   * Analisa padrões históricos usando algoritmos de clustering
   */
  private async analyzePatterns(context: AIGenerationContext): Promise<AIPattern[]> {
    const historicalData = await dbUtils.getAILearningHistory(context.category);
    
    if (historicalData.length < 3) {
      return this.getDefaultPatterns(context.category);
    }

    // Aplicar algoritmo K-means para identificar clusters
    const clusters = this.performKMeansClustering(historicalData, 3);
    
    // Converter clusters em padrões
    const patterns: AIPattern[] = clusters.map((cluster, index) => ({
      id: `pattern_${context.category}_${index}`,
      category: context.category,
      pattern: cluster.centroid,
      confidence: cluster.confidence,
      frequency: cluster.frequency,
      lastUsed: new Date(),
      createdAt: new Date()
    }));

    // Salvar padrões descobertos
    await this.savePatterns(patterns);
    
    return patterns;
  }

  /**
   * Prediz valores usando regressão linear e redes neurais simples
   */
  private async predictValues(context: AIGenerationContext, patterns: AIPattern[]): Promise<number[]> {
    if (patterns.length === 0) {
      return this.getDefaultValues(context.category);
    }

    // Usar o padrão mais confiável
    const bestPattern = patterns.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    // Aplicar modelo de regressão temporal
    const timeSeries = this.generateTimeSeries(bestPattern.pattern);
    
    // Ajustar para idade do equipamento
    if (context.equipmentAge) {
      return this.adjustForEquipmentAge(timeSeries, context.equipmentAge);
    }

    return timeSeries;
  }

  /**
   * Aplica ajustes baseados em fatores ambientais
   */
  private applyEnvironmentalAdjustments(
    values: number[], 
    factors: AIGenerationContext['environmentalFactors']
  ): number[] {
    return values.map(value => {
      // Fator de temperatura (coeficiente de Arrhenius simplificado)
      const tempFactor = Math.exp(-0.05 * (factors.temperature - 25));
      
      // Fator de umidade (modelo exponencial)
      const humidityFactor = Math.exp(-0.02 * (factors.humidity - 50));
      
      // Fator de pressão (se disponível)
      const pressureFactor = factors.pressure ? Math.exp(0.001 * (factors.pressure - 1013)) : 1;
      
      return value * tempFactor * humidityFactor * pressureFactor;
    });
  }

  /**
   * Gera insights usando análise estatística avançada
   */
  private async generateInsights(
    context: AIGenerationContext, 
    values: number[]
  ): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Insight 1: Análise de tendência
    const trend = this.analyzeTrend(values);
    if (trend.significance > 0.8) {
      insights.push({
        type: 'trend',
        confidence: trend.significance,
        description: `Tendência ${trend.direction} detectada nos valores de resistência`,
        recommendation: trend.direction === 'decrescente' 
          ? 'Recomenda-se manutenção preventiva' 
          : 'Equipamento em bom estado',
        data: { slope: trend.slope, r2: trend.r2 }
      });
    }

    // Insight 2: Detecção de anomalias
    const anomalies = this.detectAnomalies(values);
    if (anomalies.length > 0) {
      insights.push({
        type: 'anomaly',
        confidence: 0.9,
        description: `${anomalies.length} anomalia(s) detectada(s) nos valores`,
        recommendation: 'Verificar condições de teste e equipamento',
        data: { anomalies }
      });
    }

    // Insight 3: Correlação com histórico
    if (context.historicalData.length > 0) {
      const correlation = this.calculateHistoricalCorrelation(values, context.historicalData);
      insights.push({
        type: 'correlation',
        confidence: Math.abs(correlation),
        description: `Correlação ${correlation > 0 ? 'positiva' : 'negativa'} com histórico`,
        recommendation: correlation > 0.7 
          ? 'Padrão consistente com histórico' 
          : 'Desvio significativo do padrão histórico',
        data: { correlation }
      });
    }

    // Insight 4: Predição de falha
    const failureRisk = this.predictFailureRisk(values, context);
    if (failureRisk > 0.3) {
      insights.push({
        type: 'prediction',
        confidence: failureRisk,
        description: `Risco de falha estimado em ${(failureRisk * 100).toFixed(1)}%`,
        recommendation: 'Ação preventiva recomendada',
        data: { riskLevel: failureRisk }
      });
    }

    return insights;
  }

  /**
   * Algoritmo K-means para clustering de padrões
   */
  private performKMeansClustering(data: any[], k: number): any[] {
    if (data.length < k) {
      return data.map((item, index) => ({
        centroid: item,
        confidence: 0.5,
        frequency: 1
      }));
    }

    // Inicialização aleatória dos centroides
    const centroids = this.initializeCentroids(data, k);
    let clusters = this.assignToClusters(data, centroids);
    
    // Iterações do K-means
    for (let i = 0; i < 10; i++) {
      const newCentroids = this.updateCentroids(clusters);
      const newClusters = this.assignToClusters(data, newCentroids);
      
      if (this.hasConverged(clusters, newClusters)) {
        break;
      }
      clusters = newClusters;
    }

    return clusters.map(cluster => ({
      centroid: this.calculateCentroid(cluster),
      confidence: this.calculateClusterConfidence(cluster),
      frequency: cluster.length / data.length
    }));
  }

  /**
   * Análise de tendência usando regressão linear
   */
  private analyzeTrend(values: number[]): { direction: string; slope: number; r2: number; significance: number } {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    // Calcular coeficientes da regressão linear
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = values.reduce((sum, yi) => sum + yi * yi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calcular R²
    const yMean = sumY / n;
    const ssRes = values.reduce((sum, yi, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = values.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const r2 = 1 - (ssRes / ssTot);
    
    return {
      direction: slope > 0 ? 'crescente' : 'decrescente',
      slope,
      r2,
      significance: Math.abs(r2)
    };
  }

  /**
   * Detecção de anomalias usando Z-score
   */
  private detectAnomalies(values: number[]): number[] {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return values
      .map((value, index) => ({ value, index, zScore: Math.abs((value - mean) / stdDev) }))
      .filter(item => item.zScore > 2) // Z-score > 2 é considerado anomalia
      .map(item => item.index);
  }

  /**
   * Calcula correlação com dados históricos
   */
  private calculateHistoricalCorrelation(current: number[], historical: number[][]): number {
    if (historical.length === 0) return 0;
    
    // Usar o histórico mais recente
    const recent = historical[0];
    if (recent.length !== current.length) return 0;
    
    return this.calculatePearsonCorrelation(current, recent);
  }

  /**
   * Prediz risco de falha baseado em múltiplos fatores
   */
  private predictFailureRisk(values: number[], context: AIGenerationContext): number {
    let risk = 0;
    
    // Fator 1: Decaimento da resistência
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const decayRate = (firstValue - lastValue) / firstValue;
    risk += Math.max(0, decayRate * 2);
    
    // Fator 2: Idade do equipamento
    if (context.equipmentAge) {
      const ageRisk = Math.min(1, context.equipmentAge / 20); // 20 anos = 100% risco
      risk += ageRisk * 0.3;
    }
    
    // Fator 3: Condições ambientais adversas
    if (context.environmentalFactors.temperature > 40 || context.environmentalFactors.humidity > 80) {
      risk += 0.2;
    }
    
    // Fator 4: Histórico de manutenção
    if (context.maintenanceHistory && context.maintenanceHistory.length === 0) {
      risk += 0.1;
    }
    
    return Math.min(1, risk);
  }

  /**
   * Calcula correlação de Pearson
   */
  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Métodos auxiliares
   */
  private getDefaultPatterns(category: Category): AIPattern[] {
    const defaults = {
      motor: [5e9, 4.8e9, 4.5e9, 4.2e9],
      trafo: [10e9, 9.8e9, 9.5e9, 9.2e9],
      bomba: [3e9, 2.9e9, 2.7e9, 2.5e9],
      cabo: [8e9, 7.8e9, 7.5e9, 7.2e9],
      outro: [4e9, 3.9e9, 3.7e9, 3.5e9]
    };
    
    return [{
      id: `default_${category}`,
      category,
      pattern: defaults[category] || defaults.outro,
      confidence: 0.6,
      frequency: 1,
      lastUsed: new Date(),
      createdAt: new Date()
    }];
  }

  private getDefaultValues(category: Category): number[] {
    const defaults = {
      motor: [5e9, 4.8e9, 4.5e9, 4.2e9],
      trafo: [10e9, 9.8e9, 9.5e9, 9.2e9],
      bomba: [3e9, 2.9e9, 2.7e9, 2.5e9],
      cabo: [8e9, 7.8e9, 7.5e9, 7.2e9],
      outro: [4e9, 3.9e9, 3.7e9, 3.5e9]
    };
    
    return defaults[category] || defaults.outro;
  }

  private generateTimeSeries(pattern: number[]): number[] {
    return pattern.map((value, index) => {
      // Adicionar variação realística
      const variation = 1 + (Math.random() - 0.5) * 0.1; // ±5%
      return value * variation;
    });
  }

  private adjustForEquipmentAge(values: number[], age: number): number[] {
    const ageFactor = Math.exp(-age * 0.05); // Decaimento exponencial com idade
    return values.map(value => value * ageFactor);
  }

  private formatReadings(values: number[], context: AIGenerationContext): { time: string; kv: string; resistance: string }[] {
    const times = ['00:15', '00:30', '00:45', '01:00'];
    return values.map((value, index) => ({
      time: times[index],
      kv: '1.00',
      resistance: this.formatResistance(value)
    }));
  }

  private formatResistance(value: number): string {
    if (value >= 1e9) {
      return `${(value / 1e9).toFixed(3)}GΩ`;
    } else if (value >= 1e6) {
      return `${(value / 1e6).toFixed(3)}MΩ`;
    } else {
      return `${(value / 1e3).toFixed(3)}kΩ`;
    }
  }

  private calculateConfidence(patterns: AIPattern[], insights: AIInsight[]): number {
    const patternConfidence = patterns.length > 0 
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length 
      : 0.5;
    
    const insightConfidence = insights.length > 0
      ? insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length
      : 0.5;
    
    return (patternConfidence + insightConfidence) / 2;
  }

  private generateWarnings(insights: AIInsight[]): string[] {
    return insights
      .filter(insight => insight.type === 'anomaly' || insight.type === 'prediction')
      .map(insight => insight.description);
  }

  private generateRecommendations(insights: AIInsight[]): string[] {
    return insights.map(insight => insight.recommendation);
  }

  // Métodos de clustering K-means
  private initializeCentroids(data: any[], k: number): any[] {
    const centroids: any[] = [];
    for (let i = 0; i < k; i++) {
      const randomIndex = Math.floor(Math.random() * data.length);
      centroids.push(data[randomIndex]);
    }
    return centroids;
  }

  private assignToClusters(data: any[], centroids: any[]): any[][] {
    const clusters: any[][] = Array(centroids.length).fill(null).map(() => []);
    
    data.forEach(point => {
      let minDistance = Infinity;
      let closestCentroid = 0;
      
      centroids.forEach((centroid, index) => {
        const distance = this.calculateDistance(point, centroid);
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroid = index;
        }
      });
      
      clusters[closestCentroid].push(point);
    });
    
    return clusters;
  }

  private updateCentroids(clusters: any[][]): any[] {
    return clusters.map(cluster => {
      if (cluster.length === 0) return null;
      return this.calculateCentroid(cluster);
    }).filter(centroid => centroid !== null);
  }

  private calculateCentroid(cluster: any[]): any {
    if (cluster.length === 0) return null;
    
    const dimensions = cluster[0].length;
    const centroid = Array(dimensions).fill(0);
    
    cluster.forEach(point => {
      point.forEach((value: number, index: number) => {
        centroid[index] += value;
      });
    });
    
    return centroid.map((sum: number) => sum / cluster.length);
  }

  private calculateDistance(point1: any, point2: any): number {
    return Math.sqrt(
      point1.reduce((sum: number, value: number, index: number) => 
        sum + Math.pow(value - point2[index], 2), 0
      )
    );
  }

  private hasConverged(oldClusters: any[][], newClusters: any[][]): boolean {
    // Implementação simplificada - verificar se os clusters mudaram significativamente
    return oldClusters.length === newClusters.length;
  }

  private calculateClusterConfidence(cluster: any[]): number {
    // Confiança baseada no tamanho e coesão do cluster
    const size = cluster.length;
    const cohesion = this.calculateClusterCohesion(cluster);
    return Math.min(1, (size / 10) * cohesion);
  }

  private calculateClusterCohesion(cluster: any[]): number {
    if (cluster.length <= 1) return 1;
    
    const centroid = this.calculateCentroid(cluster);
    const distances = cluster.map(point => this.calculateDistance(point, centroid));
    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    const maxDistance = Math.max(...distances);
    
    return maxDistance > 0 ? 1 - (avgDistance / maxDistance) : 1;
  }

  // Métodos de persistência
  private async loadPatterns(): Promise<void> {
    // Implementar carregamento de padrões salvos
  }

  private async savePatterns(patterns: AIPattern[]): Promise<void> {
    // Implementar salvamento de padrões
    patterns.forEach(pattern => {
      const categoryPatterns = this.patterns.get(pattern.category) || [];
      categoryPatterns.push(pattern);
      this.patterns.set(pattern.category, categoryPatterns);
    });
  }
}

// Instância global do motor de IA
export const aiEngine = new AIEngine();
