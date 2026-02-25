import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BeakerIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { calculateMicrohm } from '../utils/calculations/microhm';
import { calculateHipot } from '../utils/calculations/hipot';

const Tools: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'microhm' | 'hipot'>('microhm');

  // Microhm state
  const [microhmInput, setMicrohmInput] = useState({
    voltage_V: 1,
    current_A: 0.1,
    reference_Ohm: 0.01
  });
  const [microhmResult, setMicrohmResult] = useState<ReturnType<typeof calculateMicrohm> | null>(null);

  // Hipot state
  const [hipotInput, setHipotInput] = useState({
    nominalVoltage_V: 220,
    useIndustrialFormula: true
  });
  const [hipotResult, setHipotResult] = useState<ReturnType<typeof calculateHipot> | null>(null);

  const handleMicrohmCalc = () => {
    setMicrohmResult(calculateMicrohm(microhmInput));
  };

  const handleHipotCalc = () => {
    setHipotResult(calculateHipot(hipotInput));
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
                  Ferramentas
                </h1>
                <p className="text-gray-400 mt-1">Microhmímetro e Hi-Pot</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('microhm')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'microhm' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Microhmímetro
          </button>
          <button
            onClick={() => setActiveTab('hipot')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'hipot' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Hi-Pot
          </button>
        </div>

        {activeTab === 'microhm' && (
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/20 p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-purple-500/20 rounded-xl mr-4">
                <BeakerIcon className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Microhmímetro</h2>
                <p className="text-gray-400 text-sm">R = V/I • %Δ {'>'} 50% = possível mau contato</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Tensão (V)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={microhmInput.voltage_V}
                    onChange={(e) => setMicrohmInput(prev => ({ ...prev, voltage_V: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Corrente (A)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={microhmInput.current_A}
                    onChange={(e) => setMicrohmInput(prev => ({ ...prev, current_A: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Referência (Ω)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={microhmInput.reference_Ohm}
                    onChange={(e) => setMicrohmInput(prev => ({ ...prev, reference_Ohm: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleMicrohmCalc}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors"
                >
                  Calcular
                </button>
              </div>

              <div>
                {microhmResult ? (
                  <div className="space-y-4">
                    <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                      <p className="text-gray-400 text-sm">R medida</p>
                      <p className="text-2xl font-bold text-white">{microhmResult.R_Ohm} Ω</p>
                    </div>
                    <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                      <p className="text-gray-400 text-sm">Desvio %</p>
                      <p className={`text-2xl font-bold ${microhmResult.possibleBadContact ? 'text-red-400' : 'text-green-400'}`}>
                        {microhmResult.percentDelta.toFixed(2)}%
                      </p>
                    </div>
                    {microhmResult.possibleBadContact ? (
                      <div className="flex items-center text-red-400 text-sm">
                        <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                        Possível mau contato (desvio {'>'} 50%)
                      </div>
                    ) : (
                      <div className="flex items-center text-green-400 text-sm">
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        Desvio aceitável
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Preencha e clique em Calcular
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hipot' && (
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/20 p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-orange-500/20 rounded-xl mr-4">
                <BoltIcon className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Hi-Pot</h2>
                <p className="text-gray-400 text-sm">Vteste = 2·Vnom + 1000 ou 1.5×Vnom</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Tensão Nominal (V)</label>
                  <input
                    type="number"
                    min="0"
                    value={hipotInput.nominalVoltage_V}
                    onChange={(e) => setHipotInput(prev => ({ ...prev, nominalVoltage_V: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hipotInput.useIndustrialFormula}
                      onChange={(e) => setHipotInput(prev => ({ ...prev, useIndustrialFormula: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-sm text-white">Usar fórmula industrial (2·V+1000)</span>
                  </label>
                </div>
                <button
                  onClick={handleHipotCalc}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl transition-colors"
                >
                  Calcular
                </button>
              </div>

              <div>
                {hipotResult ? (
                  <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                    <p className="text-gray-400 text-sm mb-1">Tensão de Teste</p>
                    <p className="text-3xl font-bold text-orange-400">{hipotResult.Vteste_V} V</p>
                    <p className="text-gray-500 text-sm mt-2">Fórmula: {hipotResult.formulaUsed}</p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Preencha e clique em Calcular
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tools;
