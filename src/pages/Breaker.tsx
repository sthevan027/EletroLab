import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { calculateBreaker, type LoadType } from '../utils/calculations/breaker';
import { exportBreakerPDF } from '../utils/export';
import { exportBreakerExcel } from '../utils/export-excel';

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

const Breaker: React.FC = () => {
  const navigate = useNavigate();
  const [loadCurrent, setLoadCurrent] = useState(15);
  const [loadType, setLoadType] = useState<LoadType>('tomada');
  const [cableMaxCurrent, setCableMaxCurrent] = useState(21);
  const [meta, setMeta] = useState({ tag: '', client: '', operator: '' });
  const [pdfExporting, setPdfExporting] = useState(false);

  const result = calculateBreaker({
    loadCurrent_A: loadCurrent,
    loadType,
    cableMaxCurrent_A: cableMaxCurrent
  });

  const buildExportData = () => ({
    loadCurrent_A: loadCurrent,
    loadType,
    cableMaxCurrent_A: cableMaxCurrent,
    In_A: result.In_A,
    curve: result.curve,
    coordinationOk: result.coordinationOk,
    ...meta,
  });

  const handlePDF = async () => {
    setPdfExporting(true);
    try {
      const blob = await exportBreakerPDF(buildExportData());
      triggerBlobDownload(blob, `relatorio_disjuntor_${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setPdfExporting(false);
    }
  };

  const handleExcel = () => {
    exportBreakerExcel(buildExportData());
  };

  const inputClass = "w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-900">
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
                  Disjuntor (DJ)
                </h1>
                <p className="text-gray-400 mt-1">Corrente nominal, curva e coordenação</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/20 p-8">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-blue-500/20 rounded-xl mr-4">
              <ScaleIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Dimensionamento</h2>
              <p className="text-gray-400 text-sm">In ≥ Icarga • Idj ≤ Icabo</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Corrente de Carga (A)</label>
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={loadCurrent}
                onChange={(e) => setLoadCurrent(parseFloat(e.target.value) || 0)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Tipo de Carga (Curva)</label>
              <select
                value={loadType}
                onChange={(e) => setLoadType(e.target.value as LoadType)}
                className={inputClass}
              >
                <option value="iluminacao">Iluminação → Curva B</option>
                <option value="tomada">Tomada → Curva C</option>
                <option value="motor">Motor → Curva D</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Corrente Máx. do Cabo (A) – Opcional</label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Ex: 21 para 2.5 mm²"
                value={cableMaxCurrent || ''}
                onChange={(e) => setCableMaxCurrent(parseFloat(e.target.value) || 0)}
                className={inputClass + " placeholder-gray-500"}
              />
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-700 pt-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dados do Relatório (Opcional)</p>
              <input type="text" placeholder="Tag" value={meta.tag} onChange={(e) => setMeta(p => ({ ...p, tag: e.target.value }))} className={inputClass} />
              <input type="text" placeholder="Cliente" value={meta.client} onChange={(e) => setMeta(p => ({ ...p, client: e.target.value }))} className={inputClass} />
              <input type="text" placeholder="Operador" value={meta.operator} onChange={(e) => setMeta(p => ({ ...p, operator: e.target.value }))} className={inputClass} />
            </div>

            {/* Resultado */}
            <div className="mt-8 pt-6 border-t border-gray-600 space-y-4">
              <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                <p className="text-gray-400 text-sm mb-1">Disjuntor Recomendado</p>
                <p className="text-3xl font-bold text-blue-400">{result.In_A} A - Curva {result.curve}</p>
              </div>

              {result.coordinationOk ? (
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Coordenação OK: Idj ≤ Icabo
                </div>
              ) : cableMaxCurrent > 0 ? (
                <div className="flex items-center text-red-400 text-sm">
                  <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                  Coordenação inválida: Idj {'>'} Icabo. Aumente a seção do cabo.
                </div>
              ) : null}

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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Breaker;
