import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, ArrowLeft } from 'lucide-react';
import * as db from '../services/db-compat';
import { IRReport as Report, Test, Equipment } from '../types';
import { formatDate, formatTestValue } from '../utils/validation';

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadReportData(id);
    }
  }, [id]);

  const loadReportData = async (reportId: string) => {
    try {
      setLoading(true);
      const [reportData, testsData, equipmentData] = await Promise.all([
        db.getReportById(reportId),
        db.getTestsByReportId(reportId),
        db.getAllEquipment()
      ]);

      if (reportData) {
        setReport(reportData);
        setTests(testsData);
        setEquipment(equipmentData);
      }
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Relatório não encontrado
        </h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Relatório {report.number}
          </h1>
        </div>
        <button
          onClick={() => {/* TODO: Implementar exportação */}}
          className="btn-primary"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </button>
      </div>

      {/* Informações do Relatório */}
      <div className="card p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Informações do Relatório
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Número</label>
            <p className="text-sm text-gray-900 dark:text-white">{report.number}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Data</label>
            <p className="text-sm text-gray-900 dark:text-white">{formatDate(report.date)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</label>
            <p className="text-sm text-gray-900 dark:text-white">{report.client}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Local</label>
            <p className="text-sm text-gray-900 dark:text-white">{report.location}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Responsável</label>
            <p className="text-sm text-gray-900 dark:text-white">{report.responsible}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
            <span className={`
              badge
              ${report.status === 'aprovado' ? 'badge-success' : ''}
              ${report.status === 'reprovado' ? 'badge-danger' : ''}
              ${report.status === 'finalizado' ? 'badge-info' : ''}
              ${report.status === 'rascunho' ? 'badge-warning' : ''}
            `}>
              {report.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Testes */}
      {tests.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Resultados dos Testes
          </h2>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Equipamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Resultado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Responsável
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tests.map((test) => {
                  const equip = equipment.find(e => e.id === test.equipmentId);
                  return (
                    <tr key={test.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {equip ? equip.tag : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {test.testType.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatTestValue(test.value, test.unit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`
                          badge
                          ${test.result === 'BOM' ? 'badge-success' : ''}
                          ${test.result === 'ACEITÁVEL' ? 'badge-warning' : ''}
                          ${test.result === 'REPROVADO' ? 'badge-danger' : ''}
                        `}>
                          {test.result}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(test.performedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {test.performedBy}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Observações e Recomendações */}
      {(report.observations || report.recommendations) && (
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Observações e Recomendações
          </h2>
          <div className="space-y-4">
            {report.observations && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Observações</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{report.observations}</p>
              </div>
            )}
            {report.recommendations && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Recomendações</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{report.recommendations}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
