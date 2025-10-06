import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  DocumentCheckIcon, 
  CpuChipIcon, 
  CogIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Category, CategoryProfile, Parameter, SystemConfig } from '../types';
import { dbUtils } from '../db/database';

const Parameters: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    id: '',
    defaultOperator: '',
    defaultClient: '',
    defaultSite: '',
    aiEnabled: true,
    aiLearningRate: 0.1,
    defaultLimitTOhm: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const [categoryProfiles, setCategoryProfiles] = useState<CategoryProfile[]>([]);
  const [editingProfile, setEditingProfile] = useState<CategoryProfile | null>(null);
  const [showNewProfile, setShowNewProfile] = useState(false);

  const categories: Category[] = ['cabo', 'motor', 'bomba', 'trafo', 'outro'];

  useEffect(() => {
    loadParameters();
  }, []);

  const loadParameters = async () => {
    try {
      setLoading(true);
      
      const [config, profiles] = await Promise.all([
        dbUtils.getSystemConfig(),
        dbUtils.getCategoryProfiles()
      ]);

      if (config) {
        setSystemConfig(config);
      }

      setCategoryProfiles(profiles);
      
    } catch (error) {
      console.error('Erro ao carregar parâmetros:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSystemConfig = async () => {
    try {
      setSaving(true);
      await dbUtils.saveSystemConfig(systemConfig);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const saveCategoryProfile = async (profile: CategoryProfile) => {
    try {
      setSaving(true);
      
      if (profile.id) {
        // Atualizar perfil existente
        await dbUtils.saveCategoryProfile(profile);
      } else {
        // Criar novo perfil
        await dbUtils.saveCategoryProfile(profile);
      }
      
      await loadParameters();
      setEditingProfile(null);
      setShowNewProfile(false);
      alert('Perfil salvo com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const deleteCategoryProfile = async (profileId: string) => {
    if (!confirm('Tem certeza que deseja excluir este perfil?')) return;

    try {
      setSaving(true);
      await dbUtils.deleteCategoryProfile(profileId);
      await loadParameters();
      alert('Perfil excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir perfil:', error);
      alert('Erro ao excluir perfil');
    } finally {
      setSaving(false);
    }
  };

  const getDefaultProfile = (category: Category): CategoryProfile => ({
    id: '',
    category,
    name: `Perfil ${category.charAt(0).toUpperCase() + category.slice(1)}`,
    description: `Perfil padrão para ${category}`,
    baseResistance: {
      min: 1e6, // 1 MΩ
      max: 1e9, // 1 GΩ
      decay: 0.1 // 10% de decaimento
    },
    temperature: {
      min: 20,
      max: 30,
      effect: 0.02 // 2% por grau
    },
    humidity: {
      min: 40,
      max: 60,
      effect: 0.01 // 1% por % de umidade
    },
    aiConfidence: 0.9,
    createdAt: new Date()
  });

  const handleSystemConfigChange = (field: keyof SystemConfig, value: any) => {
    setSystemConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileChange = (field: keyof CategoryProfile, value: any) => {
    if (editingProfile) {
      setEditingProfile(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando parâmetros...</p>
        </div>
      </div>
    );
  }

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
                aria-label="Voltar"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Parâmetros e Configurações
                </h1>
                <p className="text-gray-400 mt-1">Configure perfis por categoria e sistema de IA</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center text-sm text-gray-200 bg-blue-500/15 px-4 py-2 rounded-full border border-blue-500/30 shadow-inner">
                <span className="relative mr-2 block w-2 h-2 rounded-full bg-blue-400">
                  <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-60"></span>
                </span>
                <CpuChipIcon className="w-4 h-4 mr-1 text-blue-400" />
                <span className="font-medium">IA Ativa</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configurações do Sistema */}
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/20">
            <div className="px-6 py-4 border-b border-gray-700/40">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <CogIcon className="w-5 h-5 mr-2 text-blue-400" />
                Configurações do Sistema
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Configurações Padrão */}
              <div>
                <h3 className="text-md font-medium text-white mb-4">Configurações Padrão</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Operador Padrão
                    </label>
                    <input
                      type="text"
                      value={systemConfig.defaultOperator}
                      onChange={(e) => handleSystemConfigChange('defaultOperator', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Cliente Padrão
                    </label>
                    <input
                      type="text"
                      value={systemConfig.defaultClient}
                      onChange={(e) => handleSystemConfigChange('defaultClient', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Local Padrão
                    </label>
                    <input
                      type="text"
                      value={systemConfig.defaultSite}
                      onChange={(e) => handleSystemConfigChange('defaultSite', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Limite OVRG Padrão (TΩ)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={systemConfig.defaultLimitTOhm}
                      onChange={(e) => handleSystemConfigChange('defaultLimitTOhm', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Configurações de IA */}
              <div>
                <h3 className="text-md font-medium text-white mb-4 flex items-center">
                  <CpuChipIcon className="w-4 h-4 mr-2 text-blue-400" />
                  Configurações de IA
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="aiEnabled"
                      checked={systemConfig.aiEnabled}
                      onChange={(e) => handleSystemConfigChange('aiEnabled', e.target.checked)}
                      className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                    />
                    <label htmlFor="aiEnabled" className="ml-2 block text-sm text-gray-200">
                      IA Habilitada
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Taxa de Aprendizado da IA
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={systemConfig.aiLearningRate}
                      onChange={(e) => handleSystemConfigChange('aiLearningRate', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Controla a velocidade de aprendizado da IA (0.0 - 1.0)
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={saveSystemConfig}
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <DocumentCheckIcon className="w-5 h-5 mr-2" />
                    Salvar Configurações
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Perfis por Categoria */}
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/20">
            <div className="px-6 py-4 border-b border-gray-700/40">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <CpuChipIcon className="w-5 h-5 mr-2 text-blue-400" />
                  Perfis por Categoria
                </h2>
                <button
                  onClick={() => setShowNewProfile(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {categoryProfiles.length === 0 ? (
                <div className="text-center py-8">
                  <CpuChipIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300">Nenhum perfil configurado</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Crie perfis para melhorar a precisão da IA
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categoryProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="border border-gray-700 rounded-lg p-4 hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-white">{profile.name}</h3>
                          <p className="text-sm text-gray-300">{profile.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                            {profile.category}
                          </span>
                          <button
                            onClick={() => setEditingProfile(profile)}
                            className="p-1 text-gray-300 hover:text-white"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCategoryProfile(profile.id)}
                            className="p-1 text-gray-300 hover:text-red-400"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-300">Confiança IA:</span>
                          <span className="ml-2 text-white">{(profile.aiConfidence * 100).toFixed(0)}%</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-300">Resistência Base:</span>
                          <span className="ml-2 text-white">
                            {profile.baseResistance.min.toExponential(1)} - {profile.baseResistance.max.toExponential(1)} Ω
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Edição/Criação de Perfil */}
        {(editingProfile || showNewProfile) && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-700/40">
                <h3 className="text-lg font-semibold text-white">
                  {editingProfile ? 'Editar Perfil' : 'Novo Perfil'}
                </h3>
              </div>
              <div className="p-6">
                <ProfileForm
                  profile={editingProfile || getDefaultProfile('cabo')}
                  onSave={saveCategoryProfile}
                  onCancel={() => {
                    setEditingProfile(null);
                    setShowNewProfile(false);
                  }}
                  onChange={handleProfileChange}
                  saving={saving}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de formulário de perfil
interface ProfileFormProps {
  profile: CategoryProfile;
  onSave: (profile: CategoryProfile) => void;
  onCancel: () => void;
  onChange: (field: keyof CategoryProfile, value: any) => void;
  saving: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ profile, onSave, onCancel, onChange, saving }) => {
  return (
    <div className="space-y-6 text-gray-200">
      {/* Informações básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Nome do Perfil
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => onChange('name', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Categoria
          </label>
          <select
            value={profile.category}
            onChange={(e) => onChange('category', e.target.value as Category)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="cabo">Cabo</option>
            <option value="motor">Motor</option>
            <option value="bomba">Bomba</option>
            <option value="trafo">Transformador</option>
            <option value="outro">Outro</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Descrição
        </label>
        <textarea
          value={profile.description}
          onChange={(e) => onChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Configurações de resistência */}
      <div>
        <h4 className="text-md font-medium text-white mb-4">Resistência Base</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Mínima (Ω)
            </label>
            <input
              type="number"
              value={profile.baseResistance.min}
              onChange={(e) => onChange('baseResistance', { ...profile.baseResistance, min: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Máxima (Ω)
            </label>
            <input
              type="number"
              value={profile.baseResistance.max}
              onChange={(e) => onChange('baseResistance', { ...profile.baseResistance, max: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Decaimento (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={profile.baseResistance.decay * 100}
              onChange={(e) => onChange('baseResistance', { ...profile.baseResistance, decay: parseFloat(e.target.value) / 100 })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Configurações de temperatura */}
      <div>
        <h4 className="text-md font-medium text-white mb-4">Temperatura</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Mínima (°C)
            </label>
            <input
              type="number"
              value={profile.temperature.min}
              onChange={(e) => onChange('temperature', { ...profile.temperature, min: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Máxima (°C)
            </label>
            <input
              type="number"
              value={profile.temperature.max}
              onChange={(e) => onChange('temperature', { ...profile.temperature, max: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Efeito (%/°C)
            </label>
            <input
              type="number"
              step="0.001"
              value={profile.temperature.effect * 100}
              onChange={(e) => onChange('temperature', { ...profile.temperature, effect: parseFloat(e.target.value) / 100 })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Configurações de umidade */}
      <div>
        <h4 className="text-md font-medium text-white mb-4">Umidade</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Mínima (%)
            </label>
            <input
              type="number"
              value={profile.humidity.min}
              onChange={(e) => onChange('humidity', { ...profile.humidity, min: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Máxima (%)
            </label>
            <input
              type="number"
              value={profile.humidity.max}
              onChange={(e) => onChange('humidity', { ...profile.humidity, max: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Efeito (%/%)
            </label>
            <input
              type="number"
              step="0.001"
              value={profile.humidity.effect * 100}
              onChange={(e) => onChange('humidity', { ...profile.humidity, effect: parseFloat(e.target.value) / 100 })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Confiança da IA */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Confiança da IA (0-100%)
        </label>
        <input
          type="number"
          min="0"
          max="100"
          value={profile.aiConfidence * 100}
          onChange={(e) => onChange('aiConfidence', parseFloat(e.target.value) / 100)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Botões */}
      <div className="flex space-x-3 pt-4">
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-700 text-gray-200 py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Cancelar
        </button>
        <button
          onClick={() => onSave(profile)}
          disabled={saving}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-md hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {saving ? (
            <>
              <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <DocumentCheckIcon className="w-4 h-4 mr-2" />
              Salvar Perfil
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Parameters;

