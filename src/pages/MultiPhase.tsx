import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  TrashIcon, 
  CogIcon, 
  BoltIcon,
  CpuChipIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SparklesIcon,
  InformationCircleIcon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Category, MultiPhaseConfig, MultiPhaseReport, CategoryProfile } from '../types';
import { dbUtils } from '../db/database';
import { generateMultiPhaseReport } from '../utils/generator';
import { exportMultiPhasePDF } from '../utils/export';

interface PhaseConfig {
  name: string;
  combinations: string[][];
  groundName: string;
}

interface GenerationResult {
  report: MultiPhaseReport;
  confidence: number;
  warnings: string[];
}

const MultiPhase: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showNotification, setShowNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Configuração da fase
  const [equipmentType, setEquipmentType] = useState<Category>('motor');
  const [voltage, setVoltage] = useState<number>(1.0);
  const [duration, setDuration] = useState<number>(60);
  const [equipmentTag, setEquipmentTag] = useState<string>('');
  const [operator, setOperator] = useState<string>('');
  
  // Configuração das fases
  const [phaseNames, setPhaseNames] = useState<string[]>(['R', 'S', 'T']);
  const [groundName, setGroundName] = useState<string>('Terra');
  const [phaseCombinations, setPhaseCombinations] = useState<string[][]>([
    ['R', 'S'],
    ['S', 'T'], 
    ['T', 'R']
  ]);

  // Estados dos resultados
  const [generatedReport, setGeneratedReport] = useState<MultiPhaseReport | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [aiConfidence, setAiConfidence] = useState<number>(0);

  // Perfis disponíveis
  const [categoryProfiles, setCategoryProfiles] = useState<CategoryProfile[]>([]);

  useEffect(() => {
    loadCategoryProfiles();
    loadDefaultValues();
  }, []);

  // Auto-hide notification
  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  const loadCategoryProfiles = async () => {
    try {
      const profiles = await dbUtils.getCategoryProfiles();
      setCategoryProfiles(profiles);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    }
  };

  const loadDefaultValues = async () => {
    try {
      const config = await dbUtils.getSystemConfig();
      if (config) {
        setOperator(config.defaultOperator || '');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const showNotificationMessage = (type: 'success' | 'error', message: string) => {
    setShowNotification({ type, message });
  };

  const addPhase = () => {
    const newPhaseName = `Fase${phaseNames.length + 1}`;
    setPhaseNames([...phaseNames, newPhaseName]);
  };

  const removePhase = (index: number) => {
    if (phaseNames.length <= 2) {
      alert('Deve ter pelo menos 2 fases');
      return;
    }

    const newPhases = phaseNames.filter((_, i) => i !== index);
    setPhaseNames(newPhases);
    
    // Remover combinações que usam a fase removida
    const removedPhase = phaseNames[index];
    const newCombinations = phaseCombinations.filter(
      combo => !combo.includes(removedPhase)
    );
    setPhaseCombinations(newCombinations);
  };

  const updatePhaseName = (index: number, newName: string) => {
    const oldName = phaseNames[index];
    const newPhases = [...phaseNames];
    newPhases[index] = newName;
    setPhaseNames(newPhases);

    // Atualizar combinações
    const newCombinations = phaseCombinations.map(combo =>
      combo.map(phase => phase === oldName ? newName : phase)
    );
    setPhaseCombinations(newCombinations);
  };

  const addCombination = () => {
    if (phaseNames.length < 2) return;
    
    const newCombination = [phaseNames[0], phaseNames[1]];
    setPhaseCombinations([...phaseCombinations, newCombination]);
  };

  const removeCombination = (index: number) => {
    const newCombinations = phaseCombinations.filter((_, i) => i !== index);
    setPhaseCombinations(newCombinations);
  };

  const updateCombination = (comboIndex: number, phaseIndex: number, newPhase: string) => {
    const newCombinations = [...phaseCombinations];
    newCombinations[comboIndex][phaseIndex] = newPhase;
    setPhaseCombinations(newCombinations);
  };

  const generateReport = async () => {
    setValidationErrors([]);
    
    // Validações básicas
    const errors: string[] = [];
    
    if (!equipmentTag.trim()) {
      errors.push('Tag do equipamento é obrigatória');
    }
    
    if (!operator.trim()) {
      errors.push('Operador é obrigatório');
    }
    
    if (phaseNames.length < 2) {
      errors.push('Deve ter pelo menos 2 fases');
    }
    
    if (phaseCombinations.length === 0) {
      errors.push('Deve ter pelo menos uma combinação de fases');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setGenerating(true);
      
      // Criar configuração multi-fase
      const multiPhaseConfig: MultiPhaseConfig = {
        id: crypto.randomUUID(),
        equipmentType,
        phases: {
          names: phaseNames
        },
        voltage,
        duration,
        intervals: [15, 30, 45, 60],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Gerar relatório usando a IA
      const result = await generateMultiPhaseReport(multiPhaseConfig, {
        equipmentTag,
        operator,
        phaseCombinations,
        groundName
      });

      setGeneratedReport(result.report);
      setAiConfidence(result.confidence);
      
      if (result.warnings && result.warnings.length > 0) {
        setValidationErrors(result.warnings);
      }

      // Registrar aprendizado da IA
      await dbUtils.recordAILearning({
        id: Date.now(),
        category: equipmentType,
        phaseCount: phaseNames.length,
        phaseNames,
        input: JSON.stringify({
          equipmentType,
          voltage,
          phaseNames,
          combinations: phaseCombinations
        }),
        output: JSON.stringify(result),
        createdAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setValidationErrors(['Erro interno ao gerar relatório multi-fase']);
    } finally {
      setGenerating(false);
    }
  };

  const saveReport = async () => {
    if (!generatedReport) return;

    try {
      setSaving(true);
      
      const reportToSave = {
        ...generatedReport,
        isSaved: true
      };

      await dbUtils.saveMultiPhaseReport(reportToSave);
      setGeneratedReport(reportToSave);
      
      showNotificationMessage('success', 'Relatório multi-fase salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
      showNotificationMessage('error', 'Erro ao salvar relatório');
    } finally {
      setSaving(false);
    }
  };

  const exportToPDF = async () => {
    if (!generatedReport) return;

    try {
      setExporting(true);
      
      const blob = await exportMultiPhasePDF(generatedReport);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_multifase_${generatedReport.equipmentTag}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      showNotificationMessage('error', 'Erro ao exportar relatório');
    } finally {
      setExporting(false);
    }
  };

  const resetForm = () => {
    setGeneratedReport(null);
    setValidationErrors([]);
    setAiConfidence(0);
  };

  const categories: { value: Category; label: string; description: string }[] = [
    { value: 'motor', label: 'Motor', description: 'Motores elétricos' },
    { value: 'trafo', label: 'Transformador', description: 'Transformadores de potência' },
    { value: 'bomba', label: 'Bomba', description: 'Bombas e sistemas hidráulicos' },
    { value: 'cabo', label: 'Cabo', description: 'Cabos de potência multi-condutores' },
    { value: 'outro', label: 'Outro', description: 'Outros equipamentos multi-fase' }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
          <div className={`flex items-center p-4 rounded-lg shadow-lg ${
            showNotification.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {showNotification.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 mr-2" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            )}
            <span className="font-medium">{showNotification.message}</span>
            <button
              onClick={() => setShowNotification(null)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-800/70 border border-gray-700 rounded-2xl shadow-xl px-5 sm:px-8 py-6 flex items-center justify-between">
            <div className="flex items-start">
              <button
                onClick={() => navigate('/')}
                className="mr-4 mt-1 p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-700"
                aria-label="Voltar"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                  Gerador Multi-Fase
                </h1>
                <p className="text-gray-400 mt-1 flex items-center">
                  <SparklesIcon className="w-4 h-4 mr-1 text-purple-400" />
                  Relatórios IR para equipamentos multi-fase com IA
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center text-sm text-gray-200 bg-purple-500/15 px-4 py-2 rounded-full border border-purple-500/30 shadow-inner">
                <span className="relative mr-2 block w-2 h-2 rounded-full bg-purple-400">
                  <span className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-60"></span>
                </span>
                <CpuChipIcon className="w-4 h-4 mr-1 text-purple-400" />
                <span className="font-medium">IA Ativa</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Formulário de Configuração */}
          <div className="space-y-8">
            <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/20 p-8">
              <div className="flex items-center mb-8">
                <div className="p-3 bg-purple-500/20 rounded-xl mr-4">
                  <CogIcon className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Configuração do Equipamento</h2>
                  <p className="text-gray-400">Configure os parâmetros do teste multi-fase</p>
                </div>
              </div>
            
            <div className="space-y-6">
              <div>
                <label className="flex text-sm font-semibold text-gray-200 mb-3 items-center">
                  <BoltIcon className="w-4 h-4 mr-2 text-purple-400" />
                  Tipo de Equipamento
                </label>
                <select
                  className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  value={equipmentType}
                  onChange={(e) => setEquipmentType(e.target.value as Category)}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label} - {cat.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="flex text-sm font-semibold text-gray-200 mb-3 items-center">
                    <BoltIcon className="w-4 h-4 mr-2 text-purple-400" />
                    Tensão (kV)
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    value={voltage}
                    onChange={(e) => setVoltage(Number(e.target.value))}
                    step="0.1"
                    min="0.1"
                    max="50"
                    placeholder="1.0"
                  />
                </div>
                <div>
                  <label className="flex text-sm font-semibold text-gray-200 mb-3 items-center">
                    <InformationCircleIcon className="w-4 h-4 mr-2 text-gray-400" />
                    Duração (min)
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    min="60"
                    max="600"
                    placeholder="60"
                  />
                </div>
              </div>

              <div>
                <label className="flex text-sm font-semibold text-gray-200 mb-3 items-center">
                  <InformationCircleIcon className="w-4 h-4 mr-2 text-gray-400" />
                  Tag do Equipamento
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="Ex: MOTOR-01, TRAFO-02"
                  value={equipmentTag}
                  onChange={(e) => setEquipmentTag(e.target.value)}
                />
              </div>

              <div>
                <label className="flex text-sm font-semibold text-gray-200 mb-3 items-center">
                  <InformationCircleIcon className="w-4 h-4 mr-2 text-gray-400" />
                  Operador Responsável
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="Nome do operador responsável"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Configuração das Fases */}
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/20 p-8">
            <div className="flex items-center mb-8">
              <div className="p-3 bg-indigo-500/20 rounded-xl mr-4">
                <ChartBarIcon className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Configuração das Fases</h2>
                <p className="text-gray-400">Configure as fases e combinações do sistema</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="flex text-sm font-semibold text-gray-200 items-center">
                    <BoltIcon className="w-4 h-4 mr-2 text-indigo-400" />
                    Fases do Sistema
                  </label>
                  <button
                    type="button"
                    onClick={addPhase}
                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium bg-indigo-500/20 px-3 py-2 rounded-lg hover:bg-indigo-500/30 transition-colors border border-indigo-500/30"
                  >
                    <PlusIcon className="w-4 h-4 inline mr-1" />
                    Adicionar Fase
                  </button>
                </div>
                
                <div className="space-y-3">
                  {phaseNames.map((phase, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="text"
                        className="flex-1 px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        value={phase}
                        onChange={(e) => updatePhaseName(index, e.target.value)}
                        placeholder={`Fase ${index + 1}`}
                      />
                      {phaseNames.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removePhase(index)}
                          className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex text-sm font-semibold text-gray-200 mb-3 items-center">
                  <InformationCircleIcon className="w-4 h-4 mr-2 text-gray-400" />
                  Nome da Massa/Terra
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  value={groundName}
                  onChange={(e) => setGroundName(e.target.value)}
                  placeholder="Terra, PE, Massa"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="flex text-sm font-semibold text-gray-200 items-center">
                    <BoltIcon className="w-4 h-4 mr-2 text-indigo-400" />
                    Combinações Fase/Fase
                  </label>
                  <button
                    type="button"
                    onClick={addCombination}
                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium bg-indigo-500/20 px-3 py-2 rounded-lg hover:bg-indigo-500/30 transition-colors border border-indigo-500/30"
                  >
                    <PlusIcon className="w-4 h-4 inline mr-1" />
                    Adicionar Combinação
                  </button>
                </div>
                
                <div className="space-y-3">
                  {phaseCombinations.map((combo, comboIndex) => (
                    <div key={comboIndex} className="flex items-center gap-3">
                      <select
                        className="flex-1 px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        value={combo[0]}
                        onChange={(e) => updateCombination(comboIndex, 0, e.target.value)}
                      >
                        {phaseNames.map(phase => (
                          <option key={phase} value={phase}>{phase}</option>
                        ))}
                      </select>
                      <span className="text-gray-400 font-bold text-lg">×</span>
                      <select
                        className="flex-1 px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        value={combo[1]}
                        onChange={(e) => updateCombination(comboIndex, 1, e.target.value)}
                      >
                        {phaseNames.map(phase => (
                          <option key={phase} value={phase}>{phase}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeCombination(comboIndex)}
                        className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Erros de Validação */}
          {validationErrors.length > 0 && (
            <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-6">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-400 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-red-400 mb-2">
                    Erros de Validação
                  </h3>
                  <ul className="space-y-1 text-sm text-red-300">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Botão de Gerar */}
          <button
            onClick={generateReport}
            disabled={generating}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-xl hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Gerando com IA...
              </>
            ) : (
              <>
                <SparklesIcon className="w-6 h-6 mr-3" />
                Gerar Relatório Multi-Fase
              </>
            )}
          </button>
        </div>

        {/* Resultado */}
        <div className="space-y-8">
          {generatedReport ? (
            <>
              {/* Cabeçalho do Resultado */}
              <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/20 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-500/20 rounded-xl mr-4">
                      <CheckCircleIcon className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Relatório Gerado</h2>
                      <p className="text-gray-400">Relatório multi-fase criado com sucesso</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-semibold text-gray-300">
                      Confiança IA: {(aiConfidence * 100).toFixed(0)}%
                    </span>
                    <div className="w-20 bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${aiConfidence * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-300 w-24">Equipamento:</span>
                    <span className="ml-3 text-white bg-gray-700 px-3 py-1 rounded-lg text-sm font-medium">
                      {generatedReport.equipmentTag}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-300 w-24">Operador:</span>
                    <span className="ml-3 text-white bg-gray-700 px-3 py-1 rounded-lg text-sm font-medium">
                      {generatedReport.operator}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-300 w-24">Fases:</span>
                    <span className="ml-3 text-white bg-gray-700 px-3 py-1 rounded-lg text-sm font-medium">
                      {phaseNames.join(', ')}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-300 w-24">Data/Hora:</span>
                    <span className="ml-3 text-white bg-gray-700 px-3 py-1 rounded-lg text-sm font-medium">
                      {generatedReport.createdAt.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resumo dos Testes */}
              <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/20 p-8">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-blue-500/20 rounded-xl mr-4">
                    <DocumentTextIcon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Resumo dos Testes</h3>
                    <p className="text-gray-400">Testes realizados no equipamento</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm font-semibold text-gray-300 border-b-2 border-gray-600 pb-3">
                    <span>Teste</span>
                    <span>Leituras</span>
                    <span>Status</span>
                  </div>
                  
                  {phaseCombinations.map((combo, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 text-sm py-3 border-b border-gray-700">
                      <span className="font-semibold text-white">
                        {combo[0]} × {combo[1]}
                      </span>
                      <span className="text-gray-400">
                        {generatedReport.readings?.filter(r => r.phase === index).length || 4} leituras
                      </span>
                      <span className="text-green-400 font-semibold flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Completo
                      </span>
                    </div>
                  ))}
                  
                  {phaseNames.map((phase, index) => (
                    <div key={`ground-${index}`} className="grid grid-cols-3 gap-4 text-sm py-3 border-b border-gray-700">
                      <span className="font-semibold text-white">
                        {phase} × {groundName}
                      </span>
                      <span className="text-gray-400">
                        4 leituras
                      </span>
                      <span className="text-green-400 font-semibold flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Completo
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-4">
                {!generatedReport.isSaved && (
                  <button
                    onClick={saveReport}
                    disabled={saving}
                    className={`flex-1 py-3 px-6 rounded-xl focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold transition-all duration-200 hover:scale-[1.02] ${
                      generatedReport.isSaved 
                        ? 'bg-green-500/20 text-green-400 border-2 border-green-500/30' 
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 focus:ring-green-500/50'
                    }`}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                        Salvar no Banco
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={exportToPDF}
                  disabled={exporting}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold transition-all duration-200 hover:scale-[1.02]"
                >
                  {exporting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Exportando...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                      Exportar PDF
                    </>
                  )}
                </button>

                <button
                  onClick={resetForm}
                  className="flex-1 bg-gray-700 text-gray-200 py-3 px-6 rounded-xl hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center justify-center font-semibold transition-all duration-200 hover:scale-[1.02]"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Gerar Novo
                </button>
              </div>
            </>
          ) : (
            <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/20 p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChartBarIcon className="w-12 h-12 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Relatório Multi-Fase
              </h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Configure as fases e combinações do seu equipamento e gere um relatório completo com IA
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400 max-w-lg mx-auto">
                <div className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 mr-2 text-green-400" />
                  Testes fase × fase automatizados
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 mr-2 text-green-400" />
                  Testes fase × massa correlacionados
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 mr-2 text-green-400" />
                  Análise de consistência com IA
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 mr-2 text-green-400" />
                  Exportação profissional em PDF
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default MultiPhase;