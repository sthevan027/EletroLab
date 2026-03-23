import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  ArrowDownTrayIcon, 
  DocumentCheckIcon, 
  ArrowPathIcon, 
  CpuChipIcon,
  DocumentTextIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  BoltIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Category, IRReport, IRGenerationOptions } from '../types';
import { generateIRSeries } from '../utils/generator';
import { validateIRReport, validatePhysicalCableInputs } from '../utils/validation';
import { calculateHybridResistance, formatResistance as physicsFormatResistance } from '../utils/physics';

// Lazy load heavy components
const AIInsights = lazy(() => import('../components/AIInsights'));
import { exportCupomPDF } from '../utils/export';
import { exportMeggerExcel } from '../utils/export-excel';
import { dbUtils } from '../db/database';
import { formatResistance, calculateDAI, getStandardTimeSeries, formatVoltage } from '../utils/units';

type InputMode = 'generate' | 'manual';

const GenerateReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showNotification, setShowNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('generate');

  const [manualReadings, setManualReadings] = useState([
    { time: '00:15', kv: '1.00', resistance: '' },
    { time: '00:30', kv: '1.00', resistance: '' },
    { time: '00:45', kv: '1.00', resistance: '' },
    { time: '01:00', kv: '1.00', resistance: '' },
  ]);

  const [formData, setFormData] = useState<IRGenerationOptions>({
    category: 'cabo',
    kv: 1.00,
    limitTOhm: 5,
    tag: '',
    client: '',
    site: '',
    operator: '',
    manufacturer: '',
    model: '',
    // Campos físicos padrão (opcionais)
    cableLength: undefined,
    cableGauge: undefined,
    insulationMaterial: undefined,
    conductorDiameter: undefined,
    insulationThickness: undefined
  });

  const [generatedReport, setGeneratedReport] = useState<IRReport | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Carregar configurações salvas
  useEffect(() => {
    loadSystemConfig();
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

  const loadSystemConfig = async () => {
    try {
      const savedConfig = await dbUtils.getSystemConfig();
      if (savedConfig) {
        setFormData(prev => ({
          ...prev,
          operator: savedConfig.defaultOperator || '',
          client: savedConfig.defaultClient || '',
          site: savedConfig.defaultSite || ''
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const showNotificationMessage = (type: 'success' | 'error', message: string) => {
    setShowNotification({ type, message });
  };

  const handleInputChange = (field: keyof IRGenerationOptions, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erros de validação quando o usuário edita
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
    
    // Limpar erro específico do campo
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateField = (field: keyof IRGenerationOptions, value: any): string | null => {
    switch (field) {
      case 'kv':
        if (value < 0.1 || value > 10) {
          return 'Tensão deve estar entre 0.1 e 10 kV';
        }
        break;
      case 'tag':
        if (value && value.length > 50) {
          return 'Tag deve ter no máximo 50 caracteres';
        }
        break;
      case 'client':
      case 'site':
      case 'operator':
        if (value && value.length > 100) {
          return 'Campo deve ter no máximo 100 caracteres';
        }
        break;
    }
    return null;
  };

  const isPhysicsMode = formData.category === 'cabo';
  const physicsValidation = validatePhysicalCableInputs({
    cableLength: formData.cableLength,
    cableGauge: formData.cableGauge,
    insulationMaterial: formData.insulationMaterial as any,
    conductorDiameter: formData.conductorDiameter,
    insulationThickness: formData.insulationThickness
  });
  const hasRequiredPhysics = Boolean(formData.cableLength && formData.cableGauge && formData.insulationMaterial);
  const isPhysicsReady = isPhysicsMode && hasRequiredPhysics && physicsValidation.isValid;

  // Preview do valor físico (GΩ/TΩ)
  let physicsPreview: string | null = null;
  if (isPhysicsReady) {
    const RiMOhm = calculateHybridResistance(
      {
        length: formData.cableLength!,
        gauge: formData.cableGauge!,
        material: (formData.insulationMaterial as any) || 'outro',
        conductorDiameter: formData.conductorDiameter,
        insulationThickness: formData.insulationThickness
      },
      { temperature: 25, humidity: 50 },
      { boostShortLength: formData.shortLengthBoost !== false }
    );
    physicsPreview = physicsFormatResistance(RiMOhm, formData.limitTOhm || 5);
  }

  const generateReport = async () => {
    try {
      setGenerating(true);
      setValidationErrors([]);

      // Validar dados básicos
      const validation = validateIRReport({
        category: formData.category,
        kv: formData.kv,
        readings: [],
        dai: ''
      });

      if (!validation.isValid) {
        setValidationErrors(validation.errors.map(e => e.message));
        return;
      }

      // Gerar série IR (generator já prioriza cálculo físico quando aplicável)
      const result = await generateIRSeries(formData);
      
      // Criar relatório
      const report: IRReport = {
        id: `ir_${Date.now()}`,
        category: formData.category,
        tag: formData.tag || undefined,
        kv: formData.kv,
        client: formData.client || undefined,
        site: formData.site || undefined,
        operator: formData.operator || undefined,
        manufacturer: formData.manufacturer || undefined,
        model: formData.model || undefined,
        readings: result.readings,
        dai: result.dai,
        createdAt: new Date(),
        isSaved: false,
        meta: (result as any).meta
      };

      setGeneratedReport(report);
      
      // Aprender com a geração (IA)
      await dbUtils.recordAILearning({
        id: Date.now(),
        category: formData.category,
        phaseCount: 1,
        input: JSON.stringify(formData),
        output: JSON.stringify(result),
        createdAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setValidationErrors(['Erro interno ao gerar relatório']);
    } finally {
      setGenerating(false);
    }
  };

  const saveReport = async () => {
    if (!generatedReport) return;

    try {
      setSaving(true);
      
      // Gerar número sequencial
      const nextNumber = await dbUtils.getNextReportNumber();
      const savedReport = {
        ...generatedReport,
        number: nextNumber,
        isSaved: true
      };

      await dbUtils.saveIRReport(savedReport);
      setGeneratedReport(savedReport);
      
      // Mostrar feedback
      showNotificationMessage('success', 'Relatório salvo com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
      setValidationErrors(['Erro ao salvar relatório']);
    } finally {
      setSaving(false);
    }
  };

  const exportReport = async () => {
    if (!generatedReport) return;

    try {
      setExporting(true);
      const blob = await exportCupomPDF(generatedReport);
      
      // ArrowDownTrayIcon do arquivo
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_ir_${generatedReport.category}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      setValidationErrors(['Erro ao exportar relatório']);
    } finally {
      setExporting(false);
    }
  };

  const buildManualReport = () => {
    const filled = manualReadings.every(r => r.resistance.trim() !== '');
    if (!filled) {
      setValidationErrors(['Preencha todas as 4 leituras de resistência']);
      return;
    }

    const readings = manualReadings.map(r => ({
      time: r.time,
      kv: formatVoltage(formData.kv),
      resistance: r.resistance.trim(),
    }));

    const dai = calculateDAI(readings);

    const report: IRReport = {
      id: `ir_${Date.now()}`,
      category: formData.category,
      tag: formData.tag || undefined,
      kv: formData.kv,
      client: formData.client || undefined,
      site: formData.site || undefined,
      operator: formData.operator || undefined,
      manufacturer: formData.manufacturer || undefined,
      model: formData.model || undefined,
      readings,
      dai,
      createdAt: new Date(),
      isSaved: false,
    };

    setGeneratedReport(report);
    setValidationErrors([]);
  };

  const exportExcel = () => {
    if (!generatedReport) return;
    exportMeggerExcel(generatedReport);
  };

  const handleReadingChange = (index: number, value: string) => {
    setManualReadings(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], resistance: value };
      return copy;
    });
  };

  const updateGeneratedReading = (index: number, value: string) => {
    if (!generatedReport) return;
    const newReadings = [...generatedReport.readings];
    newReadings[index] = { ...newReadings[index], resistance: value };
    const dai = calculateDAI(newReadings);
    setGeneratedReport({ ...generatedReport, readings: newReadings, dai });
  };

  const regenerateReport = () => {
    setGeneratedReport(null);
    generateReport();
  };

  const categories: { value: Category; label: string; description: string }[] = [
    { value: 'cabo', label: 'Cabo', description: 'Cabos de potência e controle' },
    { value: 'motor', label: 'Motor', description: 'Motores elétricos' },
    { value: 'bomba', label: 'Bomba', description: 'Bombas e sistemas hidráulicos' },
    { value: 'trafo', label: 'Transformador', description: 'Transformadores de potência' },
    { value: 'outro', label: 'Outro', description: 'Outros equipamentos' }
  ];

  return (
    <div className="space-y-5">
      {/* Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-sm ${
            showNotification.type === 'success' 
              ? 'bg-emerald-900/80 border-emerald-600/50 text-emerald-100' 
              : 'bg-red-900/80 border-red-600/50 text-red-100'
          }`}>
            {showNotification.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{showNotification.message}</span>
            <button
              onClick={() => setShowNotification(null)}
              className="ml-1 text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-all rounded-lg"
              aria-label="Voltar"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Megger</h1>
              <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                <SparklesIcon className="w-3.5 h-3.5 text-blue-400" />
                Resistência de Isolamento · Geração com IA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
            </span>
            <CpuChipIcon className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-blue-400 font-medium">IA Ativa</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Formulário */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/15 rounded-lg">
                  <CogIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Configurações</h2>
                  <p className="text-xs text-gray-500">Parâmetros do teste</p>
                </div>
              </div>

            {/* Mode Toggle */}
            <div className="mb-6 flex bg-gray-950 rounded-lg p-1 border border-gray-800">
              <button
                onClick={() => setInputMode('generate')}
                className={`flex-1 py-2.5 px-4 rounded-md font-semibold text-sm transition-all ${
                  inputMode === 'generate'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-200'
                }`}
              >
                <SparklesIcon className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                Gerar Valores
              </button>
              <button
                onClick={() => setInputMode('manual')}
                className={`flex-1 py-2.5 px-4 rounded-md font-semibold text-sm transition-all ${
                  inputMode === 'manual'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-200'
                }`}
              >
                <DocumentTextIcon className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                Colocar Valores
              </button>
            </div>

            {/* Categoria */}
            <div className="mb-6">
              <label className="flex text-xs font-semibold text-gray-400 mb-3 items-center uppercase tracking-wide">
                <BoltIcon className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                Categoria do Equipamento *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <label
                    key={cat.value}
                    className={`group relative flex items-center gap-2.5 p-3 border rounded-lg cursor-pointer transition-all duration-150 ${
                      formData.category === cat.value
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-800 bg-gray-950/50 hover:border-gray-700 hover:bg-gray-800/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat.value}
                      checked={formData.category === cat.value}
                      onChange={(e) => handleInputChange('category', e.target.value as Category)}
                      className="sr-only"
                    />
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      formData.category === cat.value ? 'border-blue-500 bg-blue-500' : 'border-gray-600'
                    }`}>
                      {formData.category === cat.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className={`text-sm font-medium leading-none ${formData.category === cat.value ? 'text-white' : 'text-gray-300'}`}>
                        {cat.label}
                      </div>
                      <div className="text-[10px] text-gray-600 mt-0.5 leading-none">{cat.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Tensão */}
            <div className="mb-5">
              <label className="flex text-xs font-semibold text-gray-400 mb-2 items-center uppercase tracking-wide">
                <BoltIcon className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                Tensão Aplicada (kV)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="10"
                  value={formData.kv}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 1.00;
                    handleInputChange('kv', value);
                    const error = validateField('kv', value);
                    if (error) {
                      setFieldErrors(prev => ({ ...prev, kv: error }));
                    }
                  }}
                  className={`w-full px-3 py-2.5 bg-gray-950 border rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                    fieldErrors.kv 
                      ? 'border-red-500/60 bg-red-950/30' 
                      : 'border-gray-800 focus:border-blue-600'
                  }`}
                  placeholder="1.00"
                />
                {fieldErrors.kv && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                    {fieldErrors.kv}
                  </p>
                )}
              </div>
            </div>

            {/* Especificações Físicas do Cabo */}
            {isPhysicsMode && (
              <div className="mb-5 p-4 rounded-lg bg-gray-950/60 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex text-xs font-semibold text-gray-400 items-center uppercase tracking-wide">
                    <InformationCircleIcon className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                    Esp. Físicas do Cabo
                  </label>
                  {isPhysicsReady && (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Física Ativa
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Comprimento (m)</label>
                    <input
                      type="number" min="1" step="0.1"
                      value={formData.cableLength ?? ''}
                      onChange={(e) => handleInputChange('cableLength', parseFloat(e.target.value))}
                      className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600 transition-all"
                      placeholder="Ex: 20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Bitola (mm²)</label>
                    <input
                      type="number" min="0.5" step="0.1"
                      value={formData.cableGauge ?? ''}
                      onChange={(e) => handleInputChange('cableGauge', parseFloat(e.target.value))}
                      className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600 transition-all"
                      placeholder="Ex: 16"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1.5">Material Isolante</label>
                    <select
                      value={formData.insulationMaterial ?? ''}
                      onChange={(e) => handleInputChange('insulationMaterial', e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600 transition-all"
                    >
                      <option value="">Selecione...</option>
                      <option value="XLPE">XLPE</option>
                      <option value="EPR">EPR</option>
                      <option value="PVC">PVC</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Ø Condutor (mm) <span className="text-gray-700">(Opc.)</span></label>
                    <input
                      type="number" min="0.1" step="0.1"
                      value={formData.conductorDiameter ?? ''}
                      onChange={(e) => handleInputChange('conductorDiameter', parseFloat(e.target.value))}
                      className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600 transition-all"
                      placeholder="Ex: 5.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Esp. Isolante (mm) <span className="text-gray-700">(Opc.)</span></label>
                    <input
                      type="number" min="0.1" step="0.1"
                      value={formData.insulationThickness ?? ''}
                      onChange={(e) => handleInputChange('insulationThickness', parseFloat(e.target.value))}
                      className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600 transition-all"
                      placeholder="Ex: 3.0"
                    />
                  </div>
                </div>

                {!physicsValidation.isValid && hasRequiredPhysics && (
                  <div className="mt-3 p-3 bg-red-950/50 border border-red-500/30 rounded-lg">
                    <ul className="text-xs text-red-400 space-y-1">
                      {physicsValidation.errors.map((e, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-red-400 rounded-full flex-shrink-0" />
                          {e.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {isPhysicsReady && physicsPreview && (
                  <div className="mt-3 p-3 bg-blue-950/40 border border-blue-500/20 rounded-lg text-xs text-blue-400">
                    Valor previsto: <span className="font-semibold text-blue-300">{physicsPreview}</span>
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    id="shortLengthBoost"
                    type="checkbox"
                    checked={formData.shortLengthBoost !== false}
                    onChange={(e) => handleInputChange('shortLengthBoost', e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-700 text-blue-600 focus:ring-blue-500 bg-gray-900"
                  />
                  <label htmlFor="shortLengthBoost" className="text-xs text-gray-500">
                    Escala para cabos curtos ({'<'} 100 m)
                  </label>
                </div>
              </div>
            )}

            {/* Identificação */}
            <div className="mb-5 space-y-4">
              <label className="flex text-xs font-semibold text-gray-400 items-center uppercase tracking-wide">
                <InformationCircleIcon className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                Identificação <span className="text-gray-600 font-normal ml-1 normal-case">(Opcional)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Tag</label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => {
                      handleInputChange('tag', e.target.value);
                      const error = validateField('tag', e.target.value);
                      if (error) setFieldErrors(prev => ({ ...prev, tag: error }));
                    }}
                    placeholder="Ex: MOTOR-01"
                    className={`w-full px-3 py-2.5 bg-gray-950 border rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${fieldErrors.tag ? 'border-red-500/60' : 'border-gray-800 focus:border-blue-600'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Cliente</label>
                  <input
                    type="text"
                    value={formData.client}
                    onChange={(e) => {
                      handleInputChange('client', e.target.value);
                      const error = validateField('client', e.target.value);
                      if (error) setFieldErrors(prev => ({ ...prev, client: error }));
                    }}
                    placeholder="Nome do cliente"
                    className={`w-full px-3 py-2.5 bg-gray-950 border rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${fieldErrors.client ? 'border-red-500/60' : 'border-gray-800 focus:border-blue-600'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Local do Teste</label>
                  <input
                    type="text"
                    value={formData.site}
                    onChange={(e) => {
                      handleInputChange('site', e.target.value);
                      const error = validateField('site', e.target.value);
                      if (error) setFieldErrors(prev => ({ ...prev, site: error }));
                    }}
                    placeholder="Local do teste"
                    className={`w-full px-3 py-2.5 bg-gray-950 border rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${fieldErrors.site ? 'border-red-500/60' : 'border-gray-800 focus:border-blue-600'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Operador</label>
                  <input
                    type="text"
                    value={formData.operator}
                    onChange={(e) => {
                      handleInputChange('operator', e.target.value);
                      const error = validateField('operator', e.target.value);
                      if (error) setFieldErrors(prev => ({ ...prev, operator: error }));
                    }}
                    placeholder="Nome do operador"
                    className={`w-full px-3 py-2.5 bg-gray-950 border rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${fieldErrors.operator ? 'border-red-500/60' : 'border-gray-800 focus:border-blue-600'}`}
                  />
                </div>
              </div>
            </div>

            {/* Manual Readings (Colocar Valores) */}
            {inputMode === 'manual' && (
              <div className="mb-5 mt-4 p-4 rounded-lg bg-gray-950/60 border border-gray-800">
                <label className="flex text-xs font-semibold text-gray-400 mb-3 items-center uppercase tracking-wide">
                  <BoltIcon className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                  Leituras de Resistência
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {manualReadings.map((reading, i) => (
                    <div key={reading.time}>
                      <label className="block text-xs font-mono text-gray-500 mb-1.5">{reading.time}</label>
                      <input
                        type="text"
                        value={reading.resistance}
                        onChange={(e) => handleReadingChange(i, e.target.value)}
                        placeholder="Ex: 5.23GΩ"
                        className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600 transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botão Gerar / Criar Relatório */}
            <button
              onClick={inputMode === 'generate' ? generateReport : buildManualReport}
              disabled={generating || (inputMode === 'generate' && isPhysicsMode && !isPhysicsReady)}
              className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold text-sm shadow-md transition-all duration-150"
            >
              {generating ? (
                <>
                  <ArrowPathIcon className="w-6 h-6 mr-3 animate-spin" />
                  Gerando com IA...
                </>
              ) : inputMode === 'manual' ? (
                <>
                  <DocumentCheckIcon className="w-6 h-6 mr-3" />
                  Criar Relatório
                </>
              ) : (
                <>
                  <SparklesIcon className="w-6 h-6 mr-3" />
                  Gerar Relatório com IA
                </>
              )}
            </button>
          </div>

          {/* Preview do Relatório */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/15 rounded-lg">
                <DocumentTextIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Preview do Relatório</h2>
                <p className="text-xs text-gray-500">Visualização em tempo real</p>
              </div>
            </div>

            {validationErrors.length > 0 && (
              <div className="mb-5 p-4 bg-red-950/50 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-300 mb-1.5">Erros encontrados:</p>
                    <ul className="space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="flex items-center gap-1.5 text-xs text-red-400">
                          <span className="w-1 h-1 bg-red-400 rounded-full flex-shrink-0" />
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {!generatedReport ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto mb-4">
                  <DocumentTextIcon className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-300 mb-1">Nenhum relatório gerado</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Configure os parâmetros e clique em Gerar
                </p>
                <div className="flex items-center text-xs text-gray-600">
                  <SparklesIcon className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                  <span>A IA irá gerar dados realistas automaticamente</span>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Informações do relatório */}
                <div className="bg-gray-950/60 rounded-lg border border-gray-800 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <InformationCircleIcon className="w-3.5 h-3.5 text-blue-400" />
                    Informações
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-16 flex-shrink-0">Categoria</span>
                      <span className="capitalize bg-gray-800 border border-gray-700 text-gray-200 px-2 py-0.5 rounded text-xs font-medium">
                        {generatedReport.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-16 flex-shrink-0">Tensão</span>
                      <span className="bg-gray-800 border border-gray-700 text-gray-200 px-2 py-0.5 rounded text-xs font-medium">
                        {generatedReport.kv} kV
                      </span>
                    </div>
                    {generatedReport.tag && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-16 flex-shrink-0">Tag</span>
                        <span className="bg-gray-800 border border-gray-700 text-gray-200 px-2 py-0.5 rounded text-xs font-medium truncate max-w-[100px]">
                          {generatedReport.tag}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-16 flex-shrink-0">DAI</span>
                      <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded text-xs font-semibold">
                        {generatedReport.dai}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Série de leituras */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <BoltIcon className="w-3.5 h-3.5 text-emerald-400" />
                    Série de Leituras IR
                  </p>
                  <div className="border border-gray-800 rounded-lg overflow-hidden">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-950/80">
                          <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tempo</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tensão (kV)</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Resistência</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60">
                        {generatedReport.readings.map((reading, index) => (
                          <tr key={index} className="hover:bg-gray-800/30 transition-colors">
                            <td className="px-4 py-3 text-sm font-mono text-gray-300 font-medium">
                              {reading.time}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-400">
                              {reading.kv}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={reading.resistance}
                                onChange={(e) => updateGeneratedReading(index, e.target.value)}
                                className="w-full bg-gray-800/60 border border-gray-700/60 rounded px-2 py-1 text-sm font-mono text-emerald-300 focus:outline-none focus:border-blue-500 focus:bg-gray-800 transition-all"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Ações */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={regenerateReport}
                    disabled={generating}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Regenerar
                  </button>
                  
                  <button
                    onClick={saveReport}
                    disabled={saving || generatedReport.isSaved}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                      generatedReport.isSaved 
                        ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/50 cursor-default' 
                        : 'bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600'
                    }`}
                  >
                    {saving ? (
                      <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Salvando...</>
                    ) : (
                      <><DocumentCheckIcon className="w-4 h-4" /> {generatedReport.isSaved ? '✓ Salvo' : 'Salvar'}</>
                    )}
                  </button>
                  
                  <button
                    onClick={exportReport}
                    disabled={exporting}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold bg-blue-700 hover:bg-blue-600 text-white border border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {exporting ? (
                      <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Exportando...</>
                    ) : (
                      <><ArrowDownTrayIcon className="w-4 h-4" /> Exportar PDF</>
                    )}
                  </button>

                  <button
                    onClick={exportExcel}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold bg-teal-700 hover:bg-teal-600 text-white border border-teal-600 transition-all"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Exportar Excel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default GenerateReport;



