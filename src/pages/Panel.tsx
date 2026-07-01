import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  Squares2X2Icon,
  BoltIcon,
  PlusIcon,
  TrashIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { generatePanelReport } from '../utils/reports/panel';

const Panel: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    panelTag: '',
    client: '',
    site: '',
    // Megger
    meggerGauge: 2.5,
    meggerMaterial: 'XLPE' as const,
    meggerLength: 50,
    meggerTemp: 25,
    meggerHumidity: 55,
    includeMegger: true,
    // Cable
    cablePower: 5000,
    cableVoltage: 220,
    cableFP: 0.92,
    cableSystem: 'monofasico' as const,
    cableDistance: 30,
    cableDrop: 4,
    cableLoadType: 'tomada' as const,
    includeCable: true,
    // Breaker
    breakerLoad: 15,
    breakerLoadType: 'tomada' as const,
    breakerCableMax: 21,
    includeBreaker: false,
    // Hipot
    hipotVnom: 220,
    hipotIndustrial: true,
    includeHipot: true
  });

  const [result, setResult] = useState<ReturnType<typeof generatePanelReport> | null>(null);

  type Circuit = { name: string; loadType: string; power: number; qty: number };
  const [circuits, setCircuits] = useState<Circuit[]>([
    { name: 'Iluminação', loadType: 'iluminacao', power: 500, qty: 1 },
    { name: 'Tomadas', loadType: 'tomada', power: 1000, qty: 2 },
  ]);
  const [panelVoltage, setPanelVoltage] = useState<number>(220);

  const addCircuit = () =>
    setCircuits(prev => [...prev, { name: '', loadType: 'tomada', power: 500, qty: 1 }]);

  const removeCircuit = (i: number) =>
    setCircuits(prev => prev.filter((_, idx) => idx !== i));

  const updateCircuit = (i: number, field: keyof Circuit, value: string | number) =>
    setCircuits(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

  const totalWatts = circuits.reduce((sum, c) => sum + c.power * c.qty, 0);
  const totalAmps = panelVoltage > 0 ? (totalWatts / panelVoltage).toFixed(1) : '0';
  const totalKVA = (totalWatts / 1000).toFixed(2);
  const suggestedBreaker = (() => {
    const A = parseFloat(totalAmps);
    const sizes = [10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];
    return sizes.find(s => s >= A * 1.25) ?? 125;
  })();

  const handleCalculate = () => {
    const report = generatePanelReport({
      panelTag: config.panelTag,
      client: config.client,
      site: config.site,
      megger: config.includeMegger ? {
        gauge: config.meggerGauge,
        material: config.meggerMaterial,
        length: config.meggerLength,
        temperature: config.meggerTemp,
        humidity: config.meggerHumidity
      } : undefined,
      cable: config.includeCable ? {
        power: config.cablePower,
        voltage: config.cableVoltage,
        powerFactor: config.cableFP,
        systemType: config.cableSystem,
        distance: config.cableDistance,
        voltageDropPercent: config.cableDrop,
        loadType: config.cableLoadType
      } : undefined,
      breaker: config.includeBreaker ? {
        loadCurrent_A: config.breakerLoad,
        loadType: config.breakerLoadType,
        cableMaxCurrent_A: config.breakerCableMax || undefined
      } : undefined,
      hipot: config.includeHipot ? {
        nominalVoltage_V: config.hipotVnom,
        useIndustrialFormula: config.hipotIndustrial
      } : undefined
    });
    setResult(report);
  };

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
                  Painel
                </h1>
                <p className="text-gray-400 mt-1">Megger + Cabo + Disjuntor + Hi-Pot</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/20 p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-blue-500/20 rounded-xl mr-4">
                <Squares2X2Icon className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Configuração</h2>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <input
                type="text"
                placeholder="Tag do painel"
                value={config.panelTag}
                onChange={(e) => setConfig(c => ({ ...c, panelTag: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500"
              />

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.includeMegger}
                    onChange={(e) => setConfig(c => ({ ...c, includeMegger: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-white">Megger (cabo)</span>
                </label>
                {config.includeMegger && (
                  <div className="grid grid-cols-2 gap-2 ml-4">
                    <input type="number" placeholder="Bitola" value={config.meggerGauge} onChange={(e) => setConfig(c => ({ ...c, meggerGauge: parseFloat(e.target.value) || 0 }))} className="px-3 py-2 bg-gray-700 rounded-lg text-white text-sm" />
                    <input type="number" placeholder="Comprimento" value={config.meggerLength} onChange={(e) => setConfig(c => ({ ...c, meggerLength: parseFloat(e.target.value) || 0 }))} className="px-3 py-2 bg-gray-700 rounded-lg text-white text-sm" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.includeCable}
                    onChange={(e) => setConfig(c => ({ ...c, includeCable: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-white">Dimensionamento de Cabos</span>
                </label>
                {config.includeCable && (
                  <div className="grid grid-cols-2 gap-2 ml-4">
                    <input type="number" placeholder="Potência" value={config.cablePower} onChange={(e) => setConfig(c => ({ ...c, cablePower: parseFloat(e.target.value) || 0 }))} className="px-3 py-2 bg-gray-700 rounded-lg text-white text-sm" />
                    <input type="number" placeholder="Distância" value={config.cableDistance} onChange={(e) => setConfig(c => ({ ...c, cableDistance: parseFloat(e.target.value) || 0 }))} className="px-3 py-2 bg-gray-700 rounded-lg text-white text-sm" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.includeHipot}
                    onChange={(e) => setConfig(c => ({ ...c, includeHipot: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-white flex items-center gap-1">
                    <BoltIcon className="w-4 h-4 text-yellow-400 opacity-80" />
                    Hi-Pot
                  </span>
                </label>
                {config.includeHipot && (
                  <input type="number" placeholder="V nominal" value={config.hipotVnom} onChange={(e) => setConfig(c => ({ ...c, hipotVnom: parseFloat(e.target.value) || 0 }))} className="ml-4 px-3 py-2 bg-gray-700 rounded-lg text-white text-sm w-32" />
                )}
              </div>

              <button
                onClick={handleCalculate}
                className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
              >
                Calcular Painel
              </button>
            </div>
          </div>

          {/* Resultado */}
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/20 p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-green-500/20 rounded-xl mr-4">
                <CheckCircleIcon className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Resultado</h2>
            </div>

            {!result ? (
              <div className="text-center py-16 text-gray-500">
                Configure e clique em Calcular Painel
              </div>
            ) : (
              <div className="space-y-4">
                {result.megger && (
                  <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                    <p className="text-gray-400 text-sm mb-1">Megger</p>
                    <p className="font-bold text-white">R = {result.megger.meggerResult.R_MOhm.toFixed(2)} MΩ • {result.megger.meggerResult.status}</p>
                    <p className="text-xs text-gray-500">Rmin = {result.megger.meggerResult.Rmin_MOhm.toFixed(2)} MΩ</p>
                  </div>
                )}
                {result.cable && (
                  <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                    <p className="text-gray-400 text-sm mb-1">Cabo</p>
                    <p className="font-bold text-white">I = {result.cable.cableResult.current_A} A • S = {result.cable.cableResult.minSection_mm2} mm²</p>
                    <p className="text-xs text-gray-500">Queda {result.cable.cableResult.voltageDropPercent}%</p>
                  </div>
                )}
                {result.breaker && (
                  <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                    <p className="text-gray-400 text-sm mb-1">Disjuntor</p>
                    <p className="font-bold text-white">{result.breaker.In_A} A - Curva {result.breaker.curve}</p>
                  </div>
                )}
                {result.hipot && result.hipot[0] && (
                  <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                    <p className="text-gray-400 text-sm mb-1">Hi-Pot</p>
                    <p className="font-bold text-white">Vteste = {result.hipot[0].Vteste_V} V</p>
                  </div>
                )}

                {result.validationNBR5410.errors.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-400 font-semibold text-sm mb-1">NBR 5410</p>
                    {result.validationNBR5410.errors.map((e, i) => (
                      <p key={i} className="text-red-300 text-sm">• {e.message}</p>
                    ))}
                  </div>
                )}
                {result.validationNBR5410.passed.length > 0 && result.validationNBR5410.errors.length === 0 && (
                  <div className="flex items-center text-green-400 text-sm">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Validação NBR 5410: OK
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QDL/QDF — Carga Instalada por Quadro */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/20 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center">
              <div className="p-3 bg-amber-500/20 rounded-xl mr-4">
                <TableCellsIcon className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Carga Instalada — QDL/QDF</h2>
                <p className="text-xs text-gray-400 mt-0.5">Dimensionamento da carga total do quadro de distribuição</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-3 py-2"
                value={panelVoltage}
                onChange={e => setPanelVoltage(Number(e.target.value))}
              >
                <option value={127}>127 V</option>
                <option value={220}>220 V</option>
                <option value={380}>380 V</option>
              </select>
              <button
                onClick={addCircuit}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-semibold transition-all"
              >
                <PlusIcon className="w-4 h-4" /> Adicionar Circuito
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-700/80 text-gray-300 text-xs uppercase">
                  <th className="px-4 py-3 text-left">Circuito</th>
                  <th className="px-4 py-3 text-left">Tipo de Carga</th>
                  <th className="px-4 py-3 text-left">Potência (W)</th>
                  <th className="px-4 py-3 text-left">Qtd</th>
                  <th className="px-4 py-3 text-left">Total (W)</th>
                  <th className="px-4 py-3 text-left">Corrente (A)</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {circuits.map((c, i) => (
                  <tr key={i} className="border-t border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-2">
                      <input
                        className="bg-gray-700 border border-gray-600 text-white rounded-lg px-2 py-1 text-sm w-full"
                        value={c.name}
                        onChange={e => updateCircuit(i, "name", e.target.value)}
                        placeholder="Nome do circuito"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className="bg-gray-700 border border-gray-600 text-white rounded-lg px-2 py-1 text-sm"
                        value={c.loadType}
                        onChange={e => updateCircuit(i, "loadType", e.target.value)}
                      >
                        <option value="iluminacao">Iluminacao</option>
                        <option value="tomada">Tomada</option>
                        <option value="motor">Motor</option>
                        <option value="ar">Ar-Cond.</option>
                        <option value="outro">Outro</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number" min={1}
                        className="bg-gray-700 border border-gray-600 text-white rounded-lg px-2 py-1 text-sm w-24"
                        value={c.power}
                        onChange={e => updateCircuit(i, "power", Number(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number" min={1}
                        className="bg-gray-700 border border-gray-600 text-white rounded-lg px-2 py-1 text-sm w-16"
                        value={c.qty}
                        onChange={e => updateCircuit(i, "qty", Number(e.target.value) || 1)}
                      />
                    </td>
                    <td className="px-4 py-2 font-mono text-white">{(c.power * c.qty).toLocaleString("pt-BR")} W</td>
                    <td className="px-4 py-2 font-mono text-white">
                      {panelVoltage > 0 ? ((c.power * c.qty) / panelVoltage).toFixed(2) : "0"} A
                    </td>
                    <td className="px-4 py-2">
                      <button onClick={() => removeCircuit(i)} className="text-red-400 hover:text-red-300 transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {circuits.length > 0 && (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                <p className="text-xs text-gray-400 mb-1">Carga Total Instalada</p>
                <p className="text-xl font-bold text-white">{totalWatts.toLocaleString("pt-BR")} W</p>
              </div>
              <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                <p className="text-xs text-gray-400 mb-1">Potencia em kVA</p>
                <p className="text-xl font-bold text-blue-300">{totalKVA} kVA</p>
              </div>
              <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                <p className="text-xs text-gray-400 mb-1">Corrente Total ({panelVoltage} V)</p>
                <p className="text-xl font-bold text-amber-300">{totalAmps} A</p>
              </div>
              <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                <p className="text-xs text-green-400 mb-1">Disjuntor Sugerido (125%)</p>
                <p className="text-xl font-bold text-green-300">{suggestedBreaker} A</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Panel;


