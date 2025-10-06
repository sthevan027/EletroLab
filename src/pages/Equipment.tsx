import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, CircleStackIcon } from '@heroicons/react/24/outline';
import * as db from '../services/db-compat';
import { Equipment, EquipmentCategory } from '../types';
import { validateEquipment } from '../utils/validation';

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({
    tag: '',
    category: 'motor' as EquipmentCategory,
    description: '',
    location: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    installationDate: '',
    lastMaintenance: '',
    status: 'ativo' as Equipment['status'],
    notes: ''
  });

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const equipmentList = await db.getAllEquipment();
      setEquipment(equipmentList);
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const equipmentData = {
        ...formData,
        name: formData.tag || formData.description,
        id: editingEquipment?.id
      };
      
      const validation = validateEquipment(equipmentData);
      if (!validation.ok) {
        alert('Erro de validação: ' + validation.errors.join(', '));
        return;
      }

      if (editingEquipment && editingEquipment.id !== undefined) {
        await db.updateEquipment(editingEquipment.id, equipmentData);
      } else {
        await db.addEquipment(equipmentData);
      }

      setShowForm(false);
      setEditingEquipment(null);
      resetForm();
      loadEquipment();
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
      alert('Erro ao salvar equipamento');
    }
  };

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setFormData({
      tag: equipment.tag || '',
      category: equipment.category,
      description: equipment.description || '',
      location: equipment.location || '',
      manufacturer: equipment.manufacturer || '',
      model: equipment.model || '',
      serialNumber: equipment.serialNumber || '',
      installationDate: equipment.installationDate || '',
      lastMaintenance: equipment.lastMaintenance || '',
      status: equipment.status || 'ativo',
      notes: equipment.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string | number) => {
    if (confirm('Tem certeza que deseja excluir este equipamento?')) {
      try {
        await db.deleteEquipment(id);
        loadEquipment();
      } catch (error) {
        console.error('Erro ao deletar equipamento:', error);
        alert('Erro ao deletar equipamento');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      tag: '',
      category: 'motor',
      description: '',
      location: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      installationDate: '',
      lastMaintenance: '',
      status: 'ativo',
      notes: ''
    });
  };

  const filteredEquipment = equipment.filter(equip =>
    (equip.tag || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (equip.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (equip.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-400 mt-4">Carregando equipamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Lista de Equipamentos
          </h1>
          <p className="text-gray-400">
            Gerencie todos os equipamentos do sistema
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingEquipment(null);
            resetForm();
          }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Novo Equipamento</span>
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 shadow-xl">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-blue-100 rounded-xl mr-4">
              <PlusIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {editingEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}
              </h2>
              <p className="text-gray-400">
                {editingEquipment ? 'Atualize as informações do equipamento' : 'Adicione um novo equipamento ao sistema'}
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Tag *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  placeholder="Ex: MOTOR-01, TRAFO-02"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Categoria *</label>
                <select
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as EquipmentCategory })}
                  required
                >
                  <option value="motor">Motor</option>
                  <option value="transformador">Transformador</option>
                  <option value="gerador">Gerador</option>
                  <option value="painel">Painel</option>
                  <option value="cabo">Cabo</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-200 mb-2">Descrição *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição detalhada do equipamento"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Localização *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: Sala 01, Subestação A"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Fabricante *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="Ex: WEG, Siemens, ABB"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Modelo *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Ex: W22, 1LA7"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Número de Série *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="Número de série do equipamento"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Data de Instalação *</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={formData.installationDate}
                  onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Última Manutenção</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={formData.lastMaintenance}
                  onChange={(e) => setFormData({ ...formData, lastMaintenance: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Status *</label>
                <select
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Equipment['status'] })}
                  required
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="manutencao">Manutenção</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-200 mb-2">Observações</label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações adicionais sobre o equipamento"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingEquipment(null);
                  resetForm();
                }}
                className="px-6 py-3 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-semibold"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {editingEquipment ? 'Atualizar Equipamento' : 'Salvar Equipamento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Equipamentos */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl mr-4">
              <CircleStackIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Equipamentos Cadastrados
              </h2>
              <p className="text-gray-400">
                {filteredEquipment.length} equipamento(s) encontrado(s)
              </p>
            </div>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar equipamentos..."
              className="w-80 pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-700">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                  Tag
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                  Localização
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                  Status
                </th>
                <th className="relative px-6 py-4">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <CircleStackIcon className="h-12 w-12 text-gray-500 mb-4" />
                      <h3 className="text-lg font-medium text-gray-400 mb-2">
                        Nenhum equipamento encontrado
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {searchTerm ? 'Tente ajustar os termos de busca' : 'Comece adicionando um novo equipamento'}
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={() => {
                            setShowForm(true);
                            setEditingEquipment(null);
                            resetForm();
                          }}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <PlusIcon className="h-5 w-5" />
                          <span>Adicionar Equipamento</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEquipment.map((equip) => (
                  <tr key={equip.id} className="hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {equip.tag || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {equip.description || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                        {equip.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {equip.location || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                        ${equip.status === 'ativo' ? 'bg-green-500/20 text-green-400' : ''}
                        ${equip.status === 'inativo' ? 'bg-red-500/20 text-red-400' : ''}
                        ${equip.status === 'manutencao' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                      `}>
                        {(equip.status || 'ativo').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEdit(equip)}
                          className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-blue-500/10 transition-all duration-200"
                          title="Editar equipamento"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(equip.id || 0)}
                          className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-all duration-200"
                          title="Excluir equipamento"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
