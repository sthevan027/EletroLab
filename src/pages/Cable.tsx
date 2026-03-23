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

  const inputClass = "w-full px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600 transition-all";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 text-gray-500 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-all">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Cabo</h1>
          <p className="text-sm text-gray-500 mt-0.5">Dimensionamento de Cabos · Corrente, queda de tensão e seção mínima</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-cyan-500/15 rounded-lg">
              <CalculatorIcon className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Parâmetros</h2>
              <p className="text-xs text-gray-500">Potência, tensão, distância</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Potência (W)</label>
                <input type="number" min="1" value={formData.power}
                  onChange={(e) => handleInputChange('power', parseFloat(e.target.value) || 0)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Tensão (V)</label>
                <select value={formData.voltage} onChange={(e) => handleInputChange('voltage', parseFloat(e.target.value))} className={inputClass}>
                  <option value={127}>127 V</option>
                  <option value={220}>220 V</option>
                  <option value={380}>380 V</option>
                  <option value={440}>440 V</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Fator de Potência</label>
                <input type="number" step="0.01" min="0.1" max="1" value={formData.powerFactor}
                  onChange={(e) => handleInputChange('powerFactor', parseFloat(e.target.value) || 0.92)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Sistema</label>
                <select value={formData.systemType} onChange={(e) => handleInputChange('systemType', e.target.value as SystemType)} className={inputClass}>
                  <option value="monofasico">Monofásico</option>
                  <option value="trifasico">Trifásico</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Distância (m)</label>
                <input type="number" min="1" value={formData.distance}
                  onChange={(e) => handleInputChange('distance', parseFloat(e.target.value) || 0)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Queda Admitida (%)</label>
                <input type="number" step="0.5" min="0.5" max="10" value={formData.voltageDropPercent}
                  onChange={(e) => handleInputChange('voltageDropPercent', parseFloat(e.target.value) || 4)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Tipo de Carga</label>
              <select value={formData.loadType || 'tomada'} onChange={(e) => handleInputChange('loadType', e.target.value as 'iluminacao' | 'tomada' | 'motor')} className={inputClass}>
                <option value="iluminacao">Iluminação (Curva B)</option>
                <option value="tomada">Tomada (Curva C)</option>
                <option value="motor">Motor (Curva D)</option>
              </select>
            </div>

            <div className="p-3 rounded-lg bg-gray-950/60 border border-gray-800 space-y-2.5">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Identificação (Opcional)</p>
              <input type="text" placeholder="Tag" value={meta.tag} onChange={(e) => setMeta(p => ({ ...p, tag: e.target.value }))} className={inputClass} />
              <input type="text" placeholder="Cliente" value={meta.client} onChange={(e) => setMeta(p => ({ ...p, client: e.target.value }))} className={inputClass} />
              <input type="text" placeholder="Operador" value={meta.operator} onChange={(e) => setMeta(p => ({ ...p, operator: e.target.value }))} className={inputClass} />
            </div>

            <button onClick={handleCalculate}
              className="w-full py-2.5 px-4 bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 mt-1">
              <BoltIcon className="w-4 h-4" />
              Calcular
            </button>
          </div>
        </div>

        {/* Resultado */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-emerald-500/15 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Resultado</h2>
              <p className="text-xs text-gray-500">Seção, corrente e queda de tensão</p>
            </div>
          </div>

          {!result ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mb-3">
                <CalculatorIcon className="w-6 h-6 text-gray-600" />
              </div>
              <p className="text-sm text-gray-500">Preencha os dados e clique em Calcular</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Corrente</p>
                  <p className="text-2xl font-bold text-white font-mono">{result.cableResult.current_A} <span className="text-sm text-gray-500">A</span></p>
                </div>
                <div className="bg-gray-950/60 border border-cyan-500/30 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Seção Mínima</p>
                  <p className="text-2xl font-bold text-cyan-400 font-mono">{result.cableResult.minSection_mm2} <span className="text-sm text-cyan-600">mm²</span></p>
                </div>
                <div className={`border rounded-lg p-4 ${result.cableResult.status === 'queda_alta' ? 'bg-red-950/30 border-red-500/30' : 'bg-emerald-950/30 border-emerald-500/30'}`}>
                  <p className="text-xs text-gray-500 mb-1">Queda de Tensão</p>
                  <p className={`text-2xl font-bold font-mono ${result.cableResult.status === 'queda_alta' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {result.cableResult.voltageDropPercent}<span className="text-sm">%</span>
                  </p>
                </div>
                <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Resistência</p>
                  <p className="text-2xl font-bold text-white font-mono">{result.cableResult.resistance_Ohm} <span className="text-sm text-gray-500">Ω</span></p>
                </div>
              </div>

              {result.breakerResult && (
                <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1.5">Disjuntor Sugerido</p>
                  <p className="text-lg font-bold text-white font-mono">{result.breakerResult.In_A} A <span className="text-gray-400 font-normal text-sm">– Curva {result.breakerResult.curve}</span></p>
                  {!result.breakerResult.coordinationOk && (
                    <div className="flex items-center gap-1.5 text-red-400 text-xs mt-2">
                      <ExclamationTriangleIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      Coordenação: Idj {'>'} Icabo. Ajuste a seção.
                    </div>
                  )}
                </div>
              )}

              {result.validation.errors.length > 0 && (
                <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-3">
                  <p className="text-xs text-red-400 font-semibold mb-1.5">Validação NBR 5410</p>
                  <ul className="text-xs text-red-400 space-y-1">
                    {result.validation.errors.map((e, i) => <li key={i} className="flex gap-1.5"><span>·</span>{e.message}</li>)}
                  </ul>
                </div>
              )}
              {result.validation.passed.length > 0 && result.validation.errors.length === 0 && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  {result.validation.passed.join(' · ')}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={handlePDF} disabled={pdfExporting}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
                  {pdfExporting ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ArrowDownTrayIcon className="w-4 h-4" />}
                  Exportar PDF
                </button>
                <button onClick={handleExcel}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg transition-colors">
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

export default Cable;
