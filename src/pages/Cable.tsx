import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalculatorIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { calculateCable, type CableInput, type SystemType } from '../utils/calculations/cable';
import { generateCableReport } from '../utils/reports/cable';
import { exportCablePDF } from '../utils/export';
import { exportCableExcel } from '../utils/export-excel';

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const Cable: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CableInput & { loadType?: 'iluminacao' | 'tomada' | 'motor' }>({
    power: 5000,
    voltage: 220,
    powerFactor: 0.92,
    systemType: 'monofasico',
    distance: 30,
    voltageDropPercent: 4,
    loadType: 'tomada'
  });
  const [meta, setMeta] = useState({ tag: '', client: '', operator: '' });
  const [result, setResult] = useState<ReturnType<typeof generateCableReport> | null>(null);
  const [pdfExporting, setPdfExporting] = useState(false);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setResult(null);
  };

  const handleCalculate = () => {
    const report = generateCableReport(formData);
    setResult(report);
  };

  const buildExportData = () => {
    if (!result) return null;
    return {
      power: formData.power,
      voltage: formData.voltage,
      powerFactor: formData.powerFactor,
      systemType: formData.systemType,
      distance: formData.distance,
      voltageDropPercent: formData.voltageDropPercent,
      current_A: result.cableResult.current_A,
      minSection_mm2: result.cableResult.minSection_mm2,
      resistance_Ohm: result.cableResult.resistance_Ohm,
      actualDrop: result.cableResult.voltageDropPercent,
      status: result.cableResult.status,
      breakerIn: result.breakerResult?.In_A,
      breakerCurve: result.breakerResult?.curve,
      coordinationOk: result.breakerResult?.coordinationOk,
      ...meta,
    };
  };

  const handlePDF = async () => {
    const data = buildExportData();
    if (!data) return;
    setPdfExporting(true);
    try {
      const blob = await exportCablePDF(data);
      triggerBlobDownload(blob, `relatorio_cabo_${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setPdfExporting(false);
    }
  };

  const handleExcel = () => {
    const data = buildExportData();
    if (!data) return;
    exportCableExcel(data);
  };

  const inputClass = "w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-800/70 border border-gray-700 rounded-2xl shadow-xl px-5 sm:px-8 py-6 flex items-center justify-between">
            <div className="flex items-start">
              <button
                onClick={() => navigate('/')}
                className="mr-4 mt-1 p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-700"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Dimensionamento de Cabos
                </h1>
                <p className="text-gray-400 mt-1">Corrente, queda de tensão e seção mínima</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Formulário */}
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/20 p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-blue-500/20 rounded-xl mr-4">
                <CalculatorIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Entrada</h2>
                <p className="text-gray-400 text-sm">Potência, tensão, distância</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Potência (W)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.power}
                  onChange={(e) => handleInputChange('power', parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Tensão (V)</label>
                <select
                  value={formData.voltage}
                  onChange={(e) => handleInputChange('voltage', parseFloat(e.target.value))}
                  className={inputClass}
                >
                  <option value={127}>127</option>
                  <option value={220}>220</option>
                  <option value={380}>380</option>
                  <option value={440}>440</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Fator de Potência</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="1"
                  value={formData.powerFactor}
                  onChange={(e) => handleInputChange('powerFactor', parseFloat(e.target.value) || 0.92)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Sistema</label>
                <select
                  value={formData.systemType}
                  onChange={(e) => handleInputChange('systemType', e.target.value as SystemType)}
                  className={inputClass}
                >
                  <option value="monofasico">Monofásico</option>
                  <option value="trifasico">Trifásico</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Distância (m)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.distance}
                  onChange={(e) => handleInputChange('distance', parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Queda Admitida (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="10"
                  value={formData.voltageDropPercent}
                  onChange={(e) => handleInputChange('voltageDropPercent', parseFloat(e.target.value) || 4)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Tipo de Carga (para disjuntor)</label>
                <select
                  value={formData.loadType || 'tomada'}
                  onChange={(e) => handleInputChange('loadType', e.target.value as 'iluminacao' | 'tomada' | 'motor')}
                  className={inputClass}
                >
                  <option value="iluminacao">Iluminação (Curva B)</option>
                  <option value="tomada">Tomada (Curva C)</option>
                  <option value="motor">Motor (Curva D)</option>
                </select>
              </div>

              {/* Metadata */}
              <div className="border-t border-gray-700 pt-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dados do Relatório (Opcional)</p>
                <input type="text" placeholder="Tag" value={meta.tag} onChange={(e) => setMeta(p => ({ ...p, tag: e.target.value }))} className={inputClass} />
                <input type="text" placeholder="Cliente" value={meta.client} onChange={(e) => setMeta(p => ({ ...p, client: e.target.value }))} className={inputClass} />
                <input type="text" placeholder="Operador" value={meta.operator} onChange={(e) => setMeta(p => ({ ...p, operator: e.target.value }))} className={inputClass} />
              </div>

              <button
                onClick={handleCalculate}
                className="w-full mt-6 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center"
              >
                <BoltIcon className="w-5 h-5 mr-2" />
                Calcular
              </button>
            </div>
          </div>

          {/* Resultado */}
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/20 p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-green-500/20 rounded-xl mr-4">
                <CheckCircleIcon className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Resultado</h2>
                <p className="text-gray-400 text-sm">Seção, corrente, queda</p>
              </div>
            </div>

            {!result ? (
              <div className="text-center py-16 text-gray-500">
                <CalculatorIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Preencha os dados e clique em Calcular</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                    <p className="text-gray-400 text-sm">Corrente</p>
                    <p className="text-2xl font-bold text-white">{result.cableResult.current_A} A</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                    <p className="text-gray-400 text-sm">Seção Mínima</p>
                    <p className="text-2xl font-bold text-blue-400">{result.cableResult.minSection_mm2} mm²</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                    <p className="text-gray-400 text-sm">Queda de Tensão</p>
                    <p className={`text-xl font-bold ${result.cableResult.status === 'queda_alta' ? 'text-red-400' : 'text-green-400'}`}>
                      {result.cableResult.voltageDropPercent}%
                    </p>
                  </div>
                  <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                    <p className="text-gray-400 text-sm">Resistência</p>
                    <p className="text-xl font-bold text-white">{result.cableResult.resistance_Ohm} Ω</p>
                  </div>
                </div>

                {result.breakerResult && (
                  <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                    <p className="text-gray-400 text-sm mb-1">Disjuntor Sugerido</p>
                    <p className="text-xl font-bold text-white">{result.breakerResult.In_A} A - Curva {result.breakerResult.curve}</p>
                    {!result.breakerResult.coordinationOk && (
                      <p className="text-red-400 text-sm mt-2 flex items-center">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        Coordenação: Idj {'>'} Icabo. Ajuste a seção.
                      </p>
                    )}
                  </div>
                )}

                {result.validation.errors.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-400 font-semibold mb-2">Validação NBR 5410</p>
                    <ul className="text-red-300 text-sm space-y-1">
                      {result.validation.errors.map((e, i) => (
                        <li key={i}>• {e.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.validation.passed.length > 0 && result.validation.errors.length === 0 && (
                  <div className="flex items-center text-green-400 text-sm">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    {result.validation.passed.join(' | ')}
                  </div>
                )}

                {/* Export buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={handlePDF}
                    disabled={pdfExporting}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {pdfExporting ? <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> : <ArrowDownTrayIcon className="w-5 h-5 mr-2" />}
                    Exportar PDF
                  </button>
                  <button
                    onClick={handleExcel}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                    Exportar Excel
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

export default Cable;
