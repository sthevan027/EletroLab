import React from 'react';
import { 
  LightBulbIcon, 
  ExclamationTriangleIcon, 
  ChartBarIcon, 
  CpuChipIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface AIInsight {
  type: 'anomaly' | 'trend' | 'correlation' | 'prediction';
  confidence: number;
  description: string;
  recommendation: string;
  data: any;
}

interface AIInsightsProps {
  insights: AIInsight[];
  confidence: number;
  warnings: string[];
  recommendations: string[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ 
  insights, 
  confidence, 
  warnings, 
  recommendations 
}) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'anomaly':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />;
      case 'trend':
        return <ChartBarIcon className="w-5 h-5 text-blue-400" />;
      case 'correlation':
        return <CpuChipIcon className="w-5 h-5 text-purple-400" />;
      case 'prediction':
        return <LightBulbIcon className="w-5 h-5 text-yellow-400" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'anomaly':
        return 'border-red-500/30 bg-red-500/10';
      case 'trend':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'correlation':
        return 'border-purple-500/30 bg-purple-500/10';
      case 'prediction':
        return 'border-yellow-500/30 bg-yellow-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-400';
    if (conf >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceBarColor = (conf: number) => {
    if (conf >= 0.8) return 'bg-green-500';
    if (conf >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (insights.length === 0 && warnings.length === 0 && recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Confiança da IA */}
      <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
              <CpuChipIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Confiança da IA</h3>
              <p className="text-sm text-gray-400">Nível de confiança na análise</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getConfidenceColor(confidence)}`}>
              {(confidence * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-400">Confiança</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${getConfidenceBarColor(confidence)}`}
            style={{ width: `${confidence * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Insights da IA */}
      {insights.length > 0 && (
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/20 p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
              <LightBulbIcon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Insights da IA</h3>
              <p className="text-sm text-gray-400">Análises inteligentes dos dados</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div 
                key={index}
                className={`p-4 rounded-xl border ${getInsightColor(insight.type)}`}
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white capitalize">
                        {insight.type === 'anomaly' && 'Anomalia Detectada'}
                        {insight.type === 'trend' && 'Tendência Identificada'}
                        {insight.type === 'correlation' && 'Correlação Encontrada'}
                        {insight.type === 'prediction' && 'Predição da IA'}
                      </h4>
                      <span className={`text-sm font-medium ${getConfidenceColor(insight.confidence)}`}>
                        {(insight.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">
                      {insight.description}
                    </p>
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <p className="text-blue-300 text-sm font-medium">
                        💡 {insight.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-red-500/20 rounded-lg mr-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-400">Avisos</h3>
              <p className="text-sm text-red-300">Problemas identificados pela IA</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <div key={index} className="flex items-start">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-red-300 text-sm">{warning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recomendações */}
      {recommendations.length > 0 && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg mr-3">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400">Recomendações</h3>
              <p className="text-sm text-green-300">Sugestões da IA para otimização</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-green-300 text-sm">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
