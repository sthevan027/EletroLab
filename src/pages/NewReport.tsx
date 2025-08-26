import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Save, X, Zap } from 'lucide-react';
import { dbUtils } from '../db/database';
import { Equipment, TestType } from '../types';
import { 
  validateReport, 
  validateTest, 
  generateRandomTestValue, 
  classifyTest 
} from '../utils/validation';

interface TestForm {
  equipmentId: string;
  testType: TestType;
  value: number;
  unit: string;
  result: string;
  notes: string;
  performedBy: string;
  performedAt: string;
}

export default function NewReport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [tests, setTests] = useState<TestForm[]>([]);
  const [reportForm, setReportForm] = useState({
    number: '',
    date: new Date().toISOString().split('T')[0],
    client: '',
    location: '',
    responsible: '',
    observations: '',
    recommendations: ''
  });

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const equipmentList = await dbUtils.getAllEquipment();
      setEquipment(equipmentList);
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
    }
  };

  const addTest = () => {
    const newTest: TestForm = {
      equipmentId: '',
      testType: 'megger',
      value: 0,
      unit: 'MΩ',
      result: '',
      notes: '',
      performedBy: '',
      performedAt: new Date().toISOString().split('T')[0]
    };
    setTests([...tests, newTest]);
  };

  const removeTest = (index: number) => {
    setTests(tests.filter((_, i) => i !== index));
  };

  const updateTest = (index: number, field: keyof TestForm, value: any) => {
    const updatedTests = [...tests];
    updatedTests[index] = { ...updatedTests[index], [field]: value };
    
    // Atualizar unidade baseada no tipo de teste
    if (field === 'testType') {
      updatedTests[index].unit = value === 'megger' ? 'MΩ' : 'V';
      updatedTests[index].value = 0;
      updatedTests[index].result = '';
    }
    
    setTests(updatedTests);
  };

  const generateRandomValue = async (index: number) => {
    const test = tests[index];
    if (!test.equipmentId) return;

    const selectedEquipment = equipment.find(e => e.id === test.equipmentId);
    if (!selectedEquipment) return;

    try {
      const config = await dbUtils.getConfiguration();
      const limits = config[test.testType][selectedEquipment.category];
      
      const randomValue = generateRandomTestValue(test.testType, selectedEquipment.category);
      const result = classifyTest(test.testType, randomValue, limits);
      
      updateTest(index, 'value', randomValue);
      updateTest(index, 'result', result);
    } catch (error) {
      console.error('Erro ao gerar valor aleatório:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Validar relatório
      const reportValidation = validateReport(reportForm);
      if (!reportValidation.isValid) {
        alert('Erro de validação no relatório: ' + reportValidation.errors.map(e => e.message).join(', '));
        return;
      }

      // Validar testes
      for (let i = 0; i < tests.length; i++) {
        const testValidation = validateTest(tests[i]);
        if (!testValidation.isValid) {
          alert(`Erro de validação no teste ${i + 1}: ` + testValidation.errors.map(e => e.message).join(', '));
          return;
        }
      }

      // Criar relatório
      const reportId = await dbUtils.addReport({
        ...reportForm,
        status: 'rascunho',
        tests: [],
        attachments: []
      });

      // Criar testes
      const config = await dbUtils.getConfiguration();
      for (const testForm of tests) {
        const selectedEquipment = equipment.find(e => e.id === testForm.equipmentId);
        if (!selectedEquipment) continue;

        const limits = config[testForm.testType][selectedEquipment.category];
        
        await dbUtils.addTest({
          reportId,
          equipmentId: testForm.equipmentId,
          testType: testForm.testType,
          value: testForm.value,
          unit: testForm.unit,
          result: testForm.result as any,
          limits,
          notes: testForm.notes,
          performedBy: testForm.performedBy,
          performedAt: testForm.performedAt
        });
      }

      navigate(`/report/${reportId}`);
    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
      alert('Erro ao salvar relatório');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Novo Relatório
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informações do Relatório */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Informações do Relatório
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="label">Número do Relatório</label>
              <input
                type="text"
                className="input"
                value={reportForm.number}
                onChange={(e) => setReportForm({ ...reportForm, number: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Data</label>
              <input
                type="date"
                className="input"
                value={reportForm.date}
                onChange={(e) => setReportForm({ ...reportForm, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Cliente</label>
              <input
                type="text"
                className="input"
                value={reportForm.client}
                onChange={(e) => setReportForm({ ...reportForm, client: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Local</label>
              <input
                type="text"
                className="input"
                value={reportForm.location}
                onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Responsável</label>
              <input
                type="text"
                className="input"
                value={reportForm.responsible}
                onChange={(e) => setReportForm({ ...reportForm, responsible: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* Testes */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Testes
            </h2>
            <button
              type="button"
              onClick={addTest}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Teste
            </button>
          </div>

          {tests.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Nenhum teste adicionado. Clique em "Adicionar Teste" para começar.
            </div>
          ) : (
            <div className="space-y-6">
              {tests.map((test, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white">
                      Teste {index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeTest(index)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="label">Equipamento</label>
                      <select
                        className="input"
                        value={test.equipmentId}
                        onChange={(e) => updateTest(index, 'equipmentId', e.target.value)}
                        required
                      >
                        <option value="">Selecione um equipamento</option>
                        {equipment.map((equip) => (
                          <option key={equip.id} value={equip.id}>
                            {equip.tag} - {equip.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label">Tipo de Teste</label>
                      <select
                        className="input"
                        value={test.testType}
                        onChange={(e) => updateTest(index, 'testType', e.target.value)}
                        required
                      >
                        <option value="megger">Megger</option>
                        <option value="hipot">Hipot</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">Valor</label>
                      <div className="flex">
                        <input
                          type="number"
                          step="0.1"
                          className="input rounded-r-none"
                          value={test.value}
                          onChange={(e) => updateTest(index, 'value', parseFloat(e.target.value) || 0)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => generateRandomValue(index)}
                          className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                          title="Gerar valor aleatório"
                        >
                          <Zap className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="label">Unidade</label>
                      <input
                        type="text"
                        className="input"
                        value={test.unit}
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="label">Resultado</label>
                      <input
                        type="text"
                        className="input"
                        value={test.result}
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="label">Data do Teste</label>
                      <input
                        type="date"
                        className="input"
                        value={test.performedAt}
                        onChange={(e) => updateTest(index, 'performedAt', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Responsável pelo Teste</label>
                      <input
                        type="text"
                        className="input"
                        value={test.performedBy}
                        onChange={(e) => updateTest(index, 'performedBy', e.target.value)}
                        required
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="label">Observações</label>
                      <textarea
                        className="input"
                        rows={2}
                        value={test.notes}
                        onChange={(e) => updateTest(index, 'notes', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Observações e Recomendações */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Observações e Recomendações
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Observações</label>
              <textarea
                className="input"
                rows={4}
                value={reportForm.observations}
                onChange={(e) => setReportForm({ ...reportForm, observations: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Recomendações</label>
              <textarea
                className="input"
                rows={4}
                value={reportForm.recommendations}
                onChange={(e) => setReportForm({ ...reportForm, recommendations: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Relatório
          </button>
        </div>
      </form>
    </div>
  );
}
