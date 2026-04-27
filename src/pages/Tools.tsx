import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BeakerIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { calculateMicrohm } from '../utils/calculations/microhm';
import { calculateHipot } from '../utils/calculations/hipot';
import { exportMicrohmPDF, exportHipotPDF } from '../utils/export';
import { exportMicrohmExcel, exportHipotExcel } from '../utils/export-excel';

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

const Tools: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'microhm' | 'hipot'>('microhm');

  // Microhm state
  const [microhmInput, setMicrohmInput] = useState({
    voltage_V: 1,
    current_A: 0.1,
    reference_Ohm: 0.01
  });
  const [microhmMeta, setMicrohmMeta] = useState({ tag: '', client: '', operator: '' });
  const [microhmResult, setMicrohmResult] = useState<ReturnType<typeof calculateMicrohm> | null>(null);
  const [microhmExporting, setMicrohmExporting] = useState(false);

  // Hipot state
  const [hipotInput, setHipotInput] = useState({
    nominalVoltage_V: 220,
    useIndustrialFormula: true
  });
  const [hipotMeta, setHipotMeta] = useState({ tag: '', client: '', operator: '' });
  const [hipotResult, setHipotResult] = useState<ReturnType<typeof calculateHipot> | null>(null);
  const [hipotExporting, setHipotExporting] = useState(false);

  const handleMicrohmCalc = () => {
    setMicrohmResult(calculateMicrohm(microhmInput));
  };

  const handleHipotCalc = () => {
    setHipotResult(calculateHipot(hipotInput));
  };

  const handleMicrohmPDF = async () => {
    if (!microhmResult) return;
    setMicrohmExporting(true);
    try {
      const blob = await exportMicrohmPDF({
        ...microhmInput,
        ...microhmResult,
        ...microhmMeta,
      });
      triggerBlobDownload(blob, `relatorio_microhm_${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setMicrohmExporting(false);
    }
  };

  const handleMicrohmExcel = () => {
    if (!microhmResult) return;
    exportMicrohmExcel({
      ...microhmInput,
      ...microhmResult,
      ...microhmMeta,
    });
  };

  const handleHipotPDF = async () => {
    if (!hipotResult) return;
    setHipotExporting(true);
    try {
      const blob = await exportHipotPDF({
        ...hipotInput,
        ...hipotResult,
        ...hipotMeta,
      });
      triggerBlobDownload(blob, `relatorio_hipot_${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setHipotExporting(false);
    }
  };

  const handleHipotExcel = () => {
    if (!hipotResult) return;
    exportHipotExcel({
      ...hipotInput,
      ...hipotResult,
      ...hipotMeta,
    });
  };

  const inputClass = "w-full px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600 transition-all";

  const MetaFields = ({ meta, setMeta }: { meta: typeof microhmMeta; setMeta: React.Dispatch<React.SetStateAction<typeof microhmMeta>> }) => (
    <div className="p-3 rounded-lg bg-gray-950/60 border border-gray-800 space-y-2.5">
      <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Identificação (Opcional)</p>
      <input type="text" placeholder="Tag" value={meta.tag} onChange={(e) => setMeta(p => ({ ...p, tag: e.target.value }))} className={inputClass} />
      <input type="text" placeholder="Cliente" value={meta.client} onChange={(e) => setMeta(p => ({ ...p, client: e.target.value }))} className={inputClass} />
      <input type="text" placeholder="Operador" value={meta.operator} onChange={(e) => setMeta(p => ({ ...p, operator: e.target.value }))} className={inputClass} />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-gray-500 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-all"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Ferramentas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Microhmímetro e Hi-Pot</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('microhm')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'microhm'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
          }`}
        >
          <BeakerIcon className="w-4 h-4" />
          Microhmímetro
        </button>
        <button
          onClick={() => setActiveTab('hipot')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'hipot'
              ? 'bg-orange-600 text-white shadow-md'
              : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
          }`}
        >
          <BoltIcon className="w-4 h-4" />
          Hi-Pot
        </button>
      </div>

      {/* ========= MICROHM ========= */}
      {activeTab === 'microhm' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/15 rounded-lg">
              <BeakerIcon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Microhmímetro</h2>
              <p className="text-xs text-gray-500">R = V/I · Δ% {'>'} 50% indica possível mau contato</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Tensão (V)</label>
                <input type="number" step="0.01" value={microhmInput.voltage_V}
                  onChange={(e) => setMicrohmInput(prev => ({ ...prev, voltage_V: parseFloat(e.target.value) || 0 }))}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Corrente (A)</label>
                <input type="number" step="0.001" value={microhmInput.current_A}
                  onChange={(e) => setMicrohmInput(prev => ({ ...prev, current_A: parseFloat(e.target.value) || 0 }))}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Referência (Ω)</label>
                <input type="number" step="0.0001" value={microhmInput.reference_Ohm}
                  onChange={(e) => setMicrohmInput(prev => ({ ...prev, reference_Ohm: parseFloat(e.target.value) || 0 }))}
                  className={inputClass} />
              </div>
              <MetaFields meta={microhmMeta} setMeta={setMicrohmMeta} />
              <button onClick={handleMicrohmCalc}
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold rounded-lg transition-colors">
                Calcular
              </button>
            </div>

            <div>
              {microhmResult ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">R medida</p>
                      <p className="text-xl font-bold text-white font-mono">{microhmResult.R_Ohm} Ω</p>
                    </div>
                    <div className={`border rounded-lg p-4 ${microhmResult.possibleBadContact ? 'bg-red-950/30 border-red-500/30' : 'bg-emerald-950/30 border-emerald-500/30'}`}>
                      <p className="text-xs text-gray-500 mb-1">Desvio</p>
                      <p className={`text-xl font-bold font-mono ${microhmResult.possibleBadContact ? 'text-red-400' : 'text-emerald-400'}`}>
                        {microhmResult.percentDelta.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium ${
                    microhmResult.possibleBadContact
                      ? 'bg-red-950/30 border-red-500/30 text-red-300'
                      : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                  }`}>
                    {microhmResult.possibleBadContact
                      ? <><ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" /> Possível mau contato (desvio {'>'} 50%)</>
                      : <><CheckCircleIcon className="w-4 h-4 flex-shrink-0" /> Desvio aceitável</>
                    }
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={handleMicrohmPDF} disabled={microhmExporting}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
                      {microhmExporting ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ArrowDownTrayIcon className="w-4 h-4" />}
                      PDF
                    </button>
                    <button onClick={handleMicrohmExcel}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg transition-colors">
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Excel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mb-3">
                    <BeakerIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-500">Preencha e clique em Calcular</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========= HIPOT ========= */}
      {activeTab === 'hipot' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500/15 rounded-lg">
              <BoltIcon className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Hi-Pot</h2>
              <p className="text-xs text-gray-500">Vteste = 2·Vnom + 1000 V (industrial) ou 1.5·Vnom</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Tensão Nominal (V)</label>
                <input type="number" min="0" value={hipotInput.nominalVoltage_V}
                  onChange={(e) => setHipotInput(prev => ({ ...prev, nominalVoltage_V: parseFloat(e.target.value) || 0 }))}
                  className={inputClass} />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-lg bg-gray-950/60 border border-gray-800">
                <input type="checkbox" checked={hipotInput.useIndustrialFormula}
                  onChange={(e) => setHipotInput(prev => ({ ...prev, useIndustrialFormula: e.target.checked }))}
                  className="w-3.5 h-3.5 rounded border-gray-700 text-blue-600 bg-gray-900 focus:ring-blue-500" />
                <span className="text-sm text-gray-300">Fórmula industrial (2·V+1000)</span>
              </label>
              <MetaFields meta={hipotMeta} setMeta={setHipotMeta} />
              <button onClick={handleHipotCalc}
                className="w-full py-2.5 bg-orange-700 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors">
                Calcular
              </button>
            </div>

            <div>
              {hipotResult ? (
                <div className="space-y-3">
                  <div className="bg-gray-950/60 border border-orange-500/30 rounded-lg p-5">
                    <p className="text-xs text-gray-500 mb-1.5">Tensão de Teste</p>
                    <p className="text-4xl font-bold text-orange-400 font-mono">{hipotResult.Vteste_V} <span className="text-xl text-orange-500">V</span></p>
                    <p className="text-xs text-gray-600 mt-2">Fórmula: {hipotResult.formulaUsed}</p>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={handleHipotPDF} disabled={hipotExporting}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
                      {hipotExporting ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ArrowDownTrayIcon className="w-4 h-4" />}
                      PDF
                    </button>
                    <button onClick={handleHipotExcel}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg transition-colors">
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Excel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mb-3">
                    <BoltIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-500">Preencha e clique em Calcular</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tools;
