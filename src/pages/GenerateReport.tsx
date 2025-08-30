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
  ExclamationTriangleIcon
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

  // Carregar configurações salvas
  useEffect(() => {
    loadDocumentCheckIcondCogIcon();
  }, []);

  const loadDocumentCheckIcondCogIcon = async () => {
    try {
      const savedCogIcon = await dbUtils.getSystemConfig();
      if (savedCogIcon) {
        setFormData(prev => ({
          ...prev,
          operator: savedCogIcon.defaultOperator || '',
          client: savedCogIcon.defaultClient || '',
          site: savedCogIcon.defaultSite || ''
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
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
        isDocumentCheckIcond: true
      };

      await dbUtils.saveIRReport(savedReport);
      setGeneratedReport(savedReport);
      
      // Mostrar feedback
      alert('Relatório salvo com sucesso!');
      
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Gerar Relatório Rápido
                </h1>
                <p className="text-gray-600 mt-1">
                  Geração instantânea sem salvar no banco
                </p>
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <CpuChipIcon className="w-4 h-4 mr-1" />
              <span>IA Ativa</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <CogIcon className="w-5 h-5 mr-2" />
              Configurações
            </h2>

            {/* Categoria */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <div className="grid grid-cols-1 gap-3">
                {categories.map((cat) => (
                  <label
                    key={cat.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.category === cat.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
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
                      <div className="font-medium text-gray-900">{cat.label}</div>
                      <div className="text-sm text-gray-600">{cat.description}</div>
                    </div>
                    {formData.category === cat.value && (
                      <CheckCircleIcon className="w-5 h-5 text-blue-500" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Tensão */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tensão Aplicada (kV)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="10"
                value={formData.kv}
                onChange={(e) => handleInputChange('kv', parseFloat(e.target.value) || 1.00)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tag */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tag (Opcional)
              </label>
              <input
                type="text"
                value={formData.tag}
                onChange={(e) => handleInputChange('tag', e.target.value)}
                placeholder="Ex: MOTOR-01, TRAFO-02"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Campos opcionais */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente
                </label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={(e) => handleInputChange('client', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Local
                </label>
                <input
                  type="text"
                  value={formData.site}
                  onChange={(e) => handleInputChange('site', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operador
                </label>
                <input
                  type="text"
                  value={formData.operator}
                  onChange={(e) => handleInputChange('operator', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Botão Gerar */}
            <button
              onClick={generateReport}
              disabled={generating}
              className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {generating ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <CpuChipIcon className="w-5 h-5 mr-2" />
                  Gerar com IA
                </>
              )}
            </button>
          </div>

          {/* Preview do Relatório */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              Preview do Relatório
            </h2>

            {validationErrors.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Erros encontrados:</h3>
                    <ul className="mt-1 text-sm text-red-700">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {!generatedReport ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum relatório gerado</p>
                <p className="text-sm text-gray-400 mt-1">
                  Configure os parâmetros e clique em "Gerar com IA"
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Informações do relatório */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Categoria:</span>
                      <span className="ml-2 text-gray-900 capitalize">{generatedReport.category}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Tensão:</span>
                      <span className="ml-2 text-gray-900">{generatedReport.kv} kV</span>
                    </div>
                    {generatedReport.tag && (
                      <div>
                        <span className="font-medium text-gray-700">Tag:</span>
                        <span className="ml-2 text-gray-900">{generatedReport.tag}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">DAI:</span>
                      <span className="ml-2 text-gray-900">{generatedReport.dai}</span>
                    </div>
                  </div>
                </div>

                {/* Série de leituras */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Série de Leituras</h3>
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tempo</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tensão</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Resistência</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {generatedReport.readings.map((reading, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm text-gray-900">{reading.time}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{reading.kv}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{reading.resistance}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={regenerateReport}
                    disabled={generating}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Regenerar
                  </button>
                  
                  <button
                    onClick={saveReport}
                    disabled={saving || generatedReport.isSaved}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {saving ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <DocumentCheckIcon className="w-4 h-4 mr-2" />
                        {generatedReport.isSaved ? 'Salvo' : 'Salvar'}
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={exportReport}
                    disabled={exporting}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {exporting ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                        Exportando...
                      </>
                    ) : (
                      <>
                        <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                        Exportar
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


