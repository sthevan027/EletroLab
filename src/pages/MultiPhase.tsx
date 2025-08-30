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
  CheckCircleIcon
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
      
      alert('Relatório multi-fase salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
      alert('Erro ao salvar relatório');
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
      alert('Erro ao exportar relatório');
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/')}
            className="mr-4 p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Gerador Multi-Fase
            </h1>
            <p className="text-gray-400 mt-1">
              Relatórios IR para equipamentos multi-fase com IA
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">IA Ativa</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário de Configuração */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <CogIcon className="w-5 h-5 mr-2 text-blue-400" />
              Configuração do Equipamento
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">Tipo de Equipamento</label>
                <select
                  className="input"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tensão (kV)</label>
                  <input
                    type="number"
                    className="input"
                    value={voltage}
                    onChange={(e) => setVoltage(Number(e.target.value))}
                    step="0.1"
                    min="0.1"
                    max="50"
                  />
                </div>
                <div>
                  <label className="label">Duração (min)</label>
                  <input
                    type="number"
                    className="input"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    min="60"
                    max="600"
                  />
                </div>
              </div>

              <div>
                <label className="label">Tag do Equipamento</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: MOTOR-01, TRAFO-02"
                  value={equipmentTag}
                  onChange={(e) => setEquipmentTag(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Operador</label>
                <input
                  type="text"
                  className="input"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Configuração das Fases */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <ChartBarIcon className="w-5 h-5 mr-2 text-purple-400" />
              Configuração das Fases
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label">Fases do Sistema</label>
                  <button
                    type="button"
                    onClick={addPhase}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    <PlusIcon className="w-4 h-4 inline mr-1" />
                    Adicionar Fase
                  </button>
                </div>
                
                <div className="space-y-2">
                  {phaseNames.map((phase, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        className="input flex-1"
                        value={phase}
                        onChange={(e) => updatePhaseName(index, e.target.value)}
                        placeholder={`Fase ${index + 1}`}
                      />
                      {phaseNames.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removePhase(index)}
                          className="p-2 text-red-400 hover:text-red-300"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Nome da Massa/Terra</label>
                <input
                  type="text"
                  className="input"
                  value={groundName}
                  onChange={(e) => setGroundName(e.target.value)}
                  placeholder="Terra, PE, Massa"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label">Combinações Fase/Fase</label>
                  <button
                    type="button"
                    onClick={addCombination}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    <PlusIcon className="w-4 h-4 inline mr-1" />
                    Adicionar Combinação
                  </button>
                </div>
                
                <div className="space-y-2">
                  {phaseCombinations.map((combo, comboIndex) => (
                    <div key={comboIndex} className="flex items-center gap-2">
                      <select
                        className="input flex-1"
                        value={combo[0]}
                        onChange={(e) => updateCombination(comboIndex, 0, e.target.value)}
                      >
                        {phaseNames.map(phase => (
                          <option key={phase} value={phase}>{phase}</option>
                        ))}
                      </select>
                      <span className="text-gray-400 font-medium">×</span>
                      <select
                        className="input flex-1"
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
                        className="p-2 text-red-400 hover:text-red-300"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Erros de Validação */}
          {validationErrors.length > 0 && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mt-0.5 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-red-400">
                    Erros de Validação
                  </h3>
                  <ul className="mt-1 text-sm text-red-300 list-disc list-inside">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
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
            className="w-full btn-primary py-3 text-base font-semibold"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Gerando com IA...
              </>
            ) : (
              <>
                <BoltIcon className="w-5 h-5 mr-2" />
                Gerar Relatório Multi-Fase
              </>
            )}
          </button>
        </div>

        {/* Resultado */}
        <div className="space-y-6">
          {generatedReport ? (
            <>
              {/* Cabeçalho do Resultado */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center">
                    <CheckCircleIcon className="w-5 h-5 mr-2 text-green-400" />
                    Relatório Gerado
                  </h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">
                      Confiança IA: {(aiConfidence * 100).toFixed(0)}%
                    </span>
                    <div className="w-16 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${aiConfidence * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Equipamento:</span>
                    <p className="font-medium text-white">{generatedReport.equipmentTag}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Operador:</span>
                    <p className="font-medium text-white">{generatedReport.operator}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Fases:</span>
                    <p className="font-medium text-white">{phaseNames.join(', ')}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Data/Hora:</span>
                    <p className="font-medium text-white">
                      {generatedReport.createdAt.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Resumo dos Testes */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-md font-semibold text-white mb-4">
                  Resumo dos Testes
                </h3>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-400 border-b border-gray-700 pb-2">
                    <span>Teste</span>
                    <span>Leituras</span>
                    <span>Status</span>
                  </div>
                  
                  {phaseCombinations.map((combo, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 text-sm">
                      <span className="font-medium text-white">
                        {combo[0]} × {combo[1]}
                      </span>
                      <span className="text-gray-400">
                        {generatedReport.readings?.filter(r => r.phase === index).length || 4} leituras
                      </span>
                      <span className="text-green-400 font-medium">
                        ✓ Completo
                      </span>
                    </div>
                  ))}
                  
                  {phaseNames.map((phase, index) => (
                    <div key={`ground-${index}`} className="grid grid-cols-3 gap-4 text-sm">
                      <span className="font-medium text-white">
                        {phase} × {groundName}
                      </span>
                      <span className="text-gray-400">
                        4 leituras
                      </span>
                      <span className="text-green-400 font-medium">
                        ✓ Completo
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-col space-y-3">
                {!generatedReport.isSaved && (
                  <button
                    onClick={saveReport}
                    disabled={saving}
                    className="btn-success py-3"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                        Salvar Relatório
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={exportToPDF}
                  disabled={exporting}
                  className="btn-primary py-3"
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
                  className="btn-secondary py-3"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Gerar Novo Relatório
                </button>
              </div>
            </>
          ) : (
            <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
              <ChartBarIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Relatório Multi-Fase
              </h3>
              <p className="text-gray-400 mb-4">
                Configure as fases e combinações do seu equipamento e gere um relatório completo com IA
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Testes fase × fase automatizados</li>
                <li>• Testes fase × massa correlacionados</li>
                <li>• Análise de consistência com IA</li>
                <li>• Exportação profissional em PDF</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiPhase;