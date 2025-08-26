import { useState, useEffect } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { dbUtils, defaultTestConfiguration } from '../db/database';
import { TestConfiguration, TestLimit } from '../types';
import { validateTestLimits } from '../utils/validation';

export default function Parameters() {
  const [config, setConfig] = useState<TestConfiguration>(defaultTestConfiguration);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const currentConfig = await dbUtils.getConfiguration();
      setConfig(currentConfig);
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);

      // Validar todos os limites
      for (const testType of ['megger', 'hipot'] as const) {
        for (const category of ['motor', 'transformador', 'gerador', 'painel', 'cabo', 'outro'] as const) {
          const validation = validateTestLimits(config[testType][category]);
          if (!validation.isValid) {
            alert(`Erro de validação em ${testType} - ${category}: ` + validation.errors.map(e => e.message).join(', '));
            return;
          }
        }
      }

      await dbUtils.updateConfiguration(config);
      alert('Configuração salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      alert('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      setConfig(defaultTestConfiguration);
    }
  };

  const updateLimit = (testType: 'megger' | 'hipot', category: keyof TestConfiguration['megger'], field: keyof TestLimit, value: number) => {
    setConfig(prev => ({
      ...prev,
      [testType]: {
        ...prev[testType],
        [category]: {
          ...prev[testType][category],
          [field]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Parâmetros de Teste
        </h1>
        <button
          onClick={resetToDefaults}
          className="btn-secondary"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Restaurar Padrões
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Teste Megger */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Teste Megger - Limites de Resistência (MΩ)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Limite Mínimo (ACEITÁVEL)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Limite Bom (BOM)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {(['motor', 'transformador', 'gerador', 'painel', 'cabo', 'outro'] as const).map((category) => (
                  <tr key={category}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        className="input w-32"
                        value={config.megger[category].min}
                        onChange={(e) => updateLimit('megger', category, 'min', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        className="input w-32"
                        value={config.megger[category].good}
                        onChange={(e) => updateLimit('megger', category, 'good', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Teste Hipot */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Teste Hipot - Limites de Tensão (V)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Limite Mínimo (ACEITÁVEL)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Limite Bom (BOM)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {(['motor', 'transformador', 'gerador', 'painel', 'cabo', 'outro'] as const).map((category) => (
                  <tr key={category}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        className="input w-32"
                        value={config.hipot[category].min}
                        onChange={(e) => updateLimit('hipot', category, 'min', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        className="input w-32"
                        value={config.hipot[category].good}
                        onChange={(e) => updateLimit('hipot', category, 'good', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Informações */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Informações sobre os Limites
          </h2>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Classificação dos Resultados:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>BOM:</strong> Valor maior ou igual ao Limite Bom</li>
                <li><strong>ACEITÁVEL:</strong> Limite Mínimo menor ou igual ao Valor menor que Limite Bom</li>
                <li><strong>REPROVADO:</strong> Valor menor que Limite Mínimo</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Distribuição de Probabilidade para Valores Aleatórios:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>60%</strong> dos valores serão classificados como BOM</li>
                <li><strong>25%</strong> dos valores serão classificados como ACEITÁVEL</li>
                <li><strong>15%</strong> dos valores serão classificados como REPROVADO</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Configuração
          </button>
        </div>
      </form>
    </div>
  );
}
