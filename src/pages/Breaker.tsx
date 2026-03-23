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

  const inputClass = "w-full px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600 transition-all";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 text-gray-500 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-all">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Disjuntor</h1>
          <p className="text-sm text-gray-500 mt-0.5">Corrente nominal, curva e coordenação · In ≥ Icarga</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-amber-500/15 rounded-lg">
              <ScaleIcon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Parâmetros</h2>
              <p className="text-xs text-gray-500">In ≥ Icarga · Idj ≤ Icabo</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Corrente de Carga (A)</label>
              <input type="number" min="0.1" step="0.5" value={loadCurrent}
                onChange={(e) => setLoadCurrent(parseFloat(e.target.value) || 0)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Tipo de Carga (Curva)</label>
              <select value={loadType} onChange={(e) => setLoadType(e.target.value as LoadType)} className={inputClass}>
                <option value="iluminacao">Iluminação → Curva B</option>
                <option value="tomada">Tomada → Curva C</option>
                <option value="motor">Motor → Curva D</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Corrente Máx. Cabo (A) <span className="text-gray-700">(Opcional)</span></label>
              <input type="number" min="0" step="1" placeholder="Ex: 21 para 2.5 mm²"
                value={cableMaxCurrent || ''}
                onChange={(e) => setCableMaxCurrent(parseFloat(e.target.value) || 0)}
                className={inputClass} />
            </div>

            <div className="p-3 rounded-lg bg-gray-950/60 border border-gray-800 space-y-2.5">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Identificação (Opcional)</p>
              <input type="text" placeholder="Tag" value={meta.tag} onChange={(e) => setMeta(p => ({ ...p, tag: e.target.value }))} className={inputClass} />
              <input type="text" placeholder="Cliente" value={meta.client} onChange={(e) => setMeta(p => ({ ...p, client: e.target.value }))} className={inputClass} />
              <input type="text" placeholder="Operador" value={meta.operator} onChange={(e) => setMeta(p => ({ ...p, operator: e.target.value }))} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Resultado (live) */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-emerald-500/15 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Resultado</h2>
              <p className="text-xs text-gray-500">Atualização em tempo real</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-950/60 border border-amber-500/30 rounded-lg p-5">
              <p className="text-xs text-gray-500 mb-1.5">Disjuntor Recomendado</p>
              <p className="text-4xl font-bold text-amber-400 font-mono">
                {result.In_A} <span className="text-2xl text-amber-600">A</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">Curva {result.curve}</p>
            </div>

            {result.coordinationOk ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-sm font-medium">
                <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                Coordenação OK: Idj ≤ Icabo
              </div>
            ) : cableMaxCurrent > 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/30 border border-red-500/30 text-red-300 text-sm font-medium">
                <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                Idj {'>'} Icabo. Aumente a seção do cabo.
              </div>
            ) : null}

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
        </div>
      </div>
    </div>
  );
};

export default Breaker;
