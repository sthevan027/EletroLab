import React, { useState, useEffect } from 'react';
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
import { Category, IRReport, IRGenerationOptions, IRGenerationResult } from '../types';
import { generateIRSeries } from '../utils/generator';
import { validateIRReport } from '../utils/validation';
import { exportCupomPDF } from '../utils/export';
import { dbUtils } from '../db/database';

const GenerateReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showNotification, setShowNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  const [formData, setFormData] = useState<IRGenerationOptions>({
    category: 'cabo',
    kv: 1.00,
    limitTOhm: 5,
    tag: '',
    client: '',
    site: '',
    operator: '',
    manufacturer: '',
    model: ''
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

  const handleInputChange = (field: keyof IRGenerationOptions, value: string | number) => {
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

      // Gerar série IR
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
        isSaved: false
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
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
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Gerar Relatório Rápido
                </h1>
                <p className="text-gray-600 mt-1 flex items-center">
                  <SparklesIcon className="w-4 h-4 mr-1 text-blue-500" />
                  Geração instantânea com IA
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-500 bg-blue-50 px-3 py-2 rounded-full">
                <CpuChipIcon className="w-4 h-4 mr-2 text-blue-500" />
                <span className="font-medium">IA Ativa</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Formulário */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-8">
              <div className="p-3 bg-blue-100 rounded-xl mr-4">
                <CogIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
                <p className="text-gray-600">Configure os parâmetros do teste</p>
              </div>
            </div>

            {/* Categoria */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-800 mb-4 flex items-center">
                <BoltIcon className="w-4 h-4 mr-2 text-blue-500" />
                Categoria do Equipamento *
              </label>
              <div className="grid grid-cols-1 gap-4">
                {categories.map((cat) => (
                  <label
                    key={cat.value}
                    className={`group flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      formData.category === cat.value
                        ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md'
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
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 group-hover:text-blue-700">
                        {cat.label}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {cat.description}
                      </div>
                    </div>
                    {formData.category === cat.value && (
                      <div className="p-2 bg-blue-500 rounded-full">
                        <CheckCircleIcon className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Tensão */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <BoltIcon className="w-4 h-4 mr-2 text-blue-500" />
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
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    fieldErrors.kv 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="1.00"
                />
                {fieldErrors.kv && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    {fieldErrors.kv}
                  </p>
                )}
              </div>
            </div>

            {/* Tag */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <InformationCircleIcon className="w-4 h-4 mr-2 text-gray-500" />
                Tag do Equipamento
                <span className="text-gray-500 font-normal ml-1">(Opcional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.tag}
                  onChange={(e) => {
                    handleInputChange('tag', e.target.value);
                    const error = validateField('tag', e.target.value);
                    if (error) {
                      setFieldErrors(prev => ({ ...prev, tag: error }));
                    }
                  }}
                  placeholder="Ex: MOTOR-01, TRAFO-02"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    fieldErrors.tag 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                />
                {fieldErrors.tag && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    {fieldErrors.tag}
                  </p>
                )}
              </div>
            </div>

            {/* Campos opcionais */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Cliente
                </label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={(e) => {
                    handleInputChange('client', e.target.value);
                    const error = validateField('client', e.target.value);
                    if (error) {
                      setFieldErrors(prev => ({ ...prev, client: error }));
                    }
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    fieldErrors.client 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="Nome do cliente"
                />
                {fieldErrors.client && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    {fieldErrors.client}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Local do Teste
                </label>
                <input
                  type="text"
                  value={formData.site}
                  onChange={(e) => {
                    handleInputChange('site', e.target.value);
                    const error = validateField('site', e.target.value);
                    if (error) {
                      setFieldErrors(prev => ({ ...prev, site: error }));
                    }
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    fieldErrors.site 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="Local onde será realizado o teste"
                />
                {fieldErrors.site && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    {fieldErrors.site}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Operador Responsável
                </label>
                <input
                  type="text"
                  value={formData.operator}
                  onChange={(e) => {
                    handleInputChange('operator', e.target.value);
                    const error = validateField('operator', e.target.value);
                    if (error) {
                      setFieldErrors(prev => ({ ...prev, operator: error }));
                    }
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    fieldErrors.operator 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="Nome do operador responsável"
                />
                {fieldErrors.operator && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    {fieldErrors.operator}
                  </p>
                )}
              </div>
            </div>

            {/* Botão Gerar */}
            <button
              onClick={generateReport}
              disabled={generating}
              className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              {generating ? (
                <>
                  <ArrowPathIcon className="w-6 h-6 mr-3 animate-spin" />
                  Gerando com IA...
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
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-8">
              <div className="p-3 bg-green-100 rounded-xl mr-4">
                <DocumentTextIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Preview do Relatório</h2>
                <p className="text-gray-600">Visualização em tempo real</p>
              </div>
            </div>

            {validationErrors.length > 0 && (
              <div className="mb-6 p-6 bg-red-50 border-2 border-red-200 rounded-xl">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Erros encontrados:</h3>
                    <ul className="space-y-1 text-sm text-red-700">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {!generatedReport ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DocumentTextIcon className="w-12 h-12 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum relatório gerado</h3>
                <p className="text-gray-500 mb-4">
                  Configure os parâmetros e clique em "Gerar Relatório com IA"
                </p>
                <div className="flex items-center justify-center text-sm text-gray-400">
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  <span>A IA irá gerar dados realistas automaticamente</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Informações do relatório */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <InformationCircleIcon className="w-5 h-5 mr-2 text-blue-500" />
                    Informações do Relatório
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-700 w-20">Categoria:</span>
                      <span className="ml-3 text-gray-900 capitalize bg-white px-3 py-1 rounded-lg text-sm font-medium">
                        {generatedReport.category}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-700 w-20">Tensão:</span>
                      <span className="ml-3 text-gray-900 bg-white px-3 py-1 rounded-lg text-sm font-medium">
                        {generatedReport.kv} kV
                      </span>
                    </div>
                    {generatedReport.tag && (
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700 w-20">Tag:</span>
                        <span className="ml-3 text-gray-900 bg-white px-3 py-1 rounded-lg text-sm font-medium">
                          {generatedReport.tag}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-700 w-20">DAI:</span>
                      <span className="ml-3 text-gray-900 bg-white px-3 py-1 rounded-lg text-sm font-medium">
                        {generatedReport.dai}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Série de leituras */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <BoltIcon className="w-5 h-5 mr-2 text-green-500" />
                    Série de Leituras IR
                  </h3>
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-green-50 to-blue-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            Tempo
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            Tensão (kV)
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            Resistência
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {generatedReport.readings.map((reading, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {reading.time}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {reading.kv}
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">
                              {reading.resistance}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    onClick={regenerateReport}
                    disabled={generating}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold transition-all duration-200 hover:scale-[1.02]"
                  >
                    <ArrowPathIcon className="w-5 h-5 mr-2" />
                    Regenerar
                  </button>
                  
                  <button
                    onClick={saveReport}
                    disabled={saving || generatedReport.isSaved}
                    className={`flex-1 py-3 px-6 rounded-xl focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold transition-all duration-200 hover:scale-[1.02] ${
                      generatedReport.isSaved 
                        ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 focus:ring-green-300'
                    }`}
                  >
                    {saving ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <DocumentCheckIcon className="w-5 h-5 mr-2" />
                        {generatedReport.isSaved ? '✓ Salvo' : 'Salvar no Banco'}
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={exportReport}
                    disabled={exporting}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold transition-all duration-200 hover:scale-[1.02]"
                  >
                    {exporting ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                        Exportando...
                      </>
                    ) : (
                      <>
                        <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                        Exportar PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateReport;


