import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Equipamentos
        </h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingEquipment(null);
            resetForm();
          }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Equipamento
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {editingEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Tag</label>
                <input
                  type="text"
                  className="input"
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Categoria</label>
                <select
                  className="input"
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
                <label className="label">Descrição</label>
                <input
                  type="text"
                  className="input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Localização</label>
                <input
                  type="text"
                  className="input"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Fabricante</label>
                <input
                  type="text"
                  className="input"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Modelo</label>
                <input
                  type="text"
                  className="input"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Número de Série</label>
                <input
                  type="text"
                  className="input"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Data de Instalação</label>
                <input
                  type="date"
                  className="input"
                  value={formData.installationDate}
                  onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Última Manutenção</label>
                <input
                  type="date"
                  className="input"
                  value={formData.lastMaintenance}
                  onChange={(e) => setFormData({ ...formData, lastMaintenance: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="input"
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
                <label className="label">Observações</label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingEquipment(null);
                  resetForm();
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                {editingEquipment ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Equipamentos */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Lista de Equipamentos
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar equipamentos..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Localização
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEquipment.map((equip) => (
                <tr key={equip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {equip.tag || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {equip.description || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {equip.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {equip.location || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`
                      badge
                      ${equip.status === 'ativo' ? 'badge-success' : ''}
                      ${equip.status === 'inativo' ? 'badge-danger' : ''}
                      ${equip.status === 'manutencao' ? 'badge-warning' : ''}
                    `}>
                      {(equip.status || 'ativo').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(equip)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(equip.id || 0)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
