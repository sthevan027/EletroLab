import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  FileText, 
  Settings, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  Download,
  Eye
} from 'lucide-react';
import { dbUtils } from '../db/database';
import { DashboardStats } from '../types';
import { formatDate } from '../utils/validation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    totalEquipment: 0,
    totalTests: 0,
    resultsDistribution: { BOM: 0, ACEITÁVEL: 0, REPROVADO: 0 },
    categoryDistribution: {
      motor: 0,
      transformador: 0,
      gerador: 0,
      painel: 0,
      cabo: 0,
      outro: 0
    },
    recentReports: [],
    recentTests: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [reports, tests, equipment] = await Promise.all([
        dbUtils.getAllReports(),
        dbUtils.getAllTests(),
        dbUtils.getAllEquipment()
      ]);

      // Calcular distribuição de resultados
      const resultsDistribution = { BOM: 0, ACEITÁVEL: 0, REPROVADO: 0 };
      tests.forEach(test => {
        resultsDistribution[test.result]++;
      });

      // Calcular distribuição por categoria
      const categoryDistribution = {
        motor: 0,
        transformador: 0,
        gerador: 0,
        painel: 0,
        cabo: 0,
        outro: 0
      };
      equipment.forEach(equip => {
        categoryDistribution[equip.category]++;
      });

      // Relatórios recentes (últimos 5)
      const recentReports = reports
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      // Testes recentes (últimos 5)
      const recentTests = tests
        .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())
        .slice(0, 5);

      setStats({
        totalReports: reports.length,
        totalEquipment: equipment.length,
        totalTests: tests.length,
        resultsDistribution,
        categoryDistribution,
        recentReports,
        recentTests
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    results: {
      labels: ['BOM', 'ACEITÁVEL', 'REPROVADO'],
      datasets: [
        {
          data: [
            stats.resultsDistribution.BOM,
            stats.resultsDistribution.ACEITÁVEL,
            stats.resultsDistribution.REPROVADO
          ],
          backgroundColor: [
            'rgb(34, 197, 94)', // success-500
            'rgb(245, 158, 11)', // warning-500
            'rgb(239, 68, 68)'   // danger-500
          ],
          borderWidth: 0,
        },
      ],
    },
    categories: {
      labels: ['Motor', 'Transformador', 'Gerador', 'Painel', 'Cabo', 'Outro'],
      datasets: [
        {
          label: 'Equipamentos por Categoria',
          data: [
            stats.categoryDistribution.motor,
            stats.categoryDistribution.transformador,
            stats.categoryDistribution.gerador,
            stats.categoryDistribution.painel,
            stats.categoryDistribution.cabo,
            stats.categoryDistribution.outro
          ],
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
      ],
    },
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
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
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Total de Relatórios
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {stats.totalReports}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Settings className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Total de Equipamentos
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {stats.totalEquipment}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Total de Testes
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {stats.totalTests}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-danger-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Testes Reprovados
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {stats.resultsDistribution.REPROVADO}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Distribuição de Resultados
          </h3>
          <div className="h-64">
            <Doughnut data={chartData.results} options={chartOptions} />
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Equipamentos por Categoria
          </h3>
          <div className="h-64">
            <Bar data={chartData.categories} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Ações Rápidas
        </h3>
        <div className="flex flex-wrap gap-4">
          <Link to="/new-report" className="btn-primary">
            <Plus className="h-5 w-5 mr-2" />
            Novo Relatório
          </Link>
          <Link to="/generate" className="btn-secondary">
            <Plus className="h-5 w-5 mr-2" />
            Gerar Rápido
          </Link>
          <Link
            to="/equipment"
            className="btn-secondary"
          >
            <Settings className="h-5 w-5 mr-2" />
            Gerenciar Equipamentos
          </Link>
          <button
            onClick={() => {/* TODO: Implementar exportação */}}
            className="btn-secondary"
          >
            <Download className="h-5 w-5 mr-2" />
            Exportar Dados
          </button>
        </div>
      </div>

      {/* Relatórios Recentes */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Relatórios Recentes
          </h3>
          <Link
            to="/reports"
            className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            Ver todos
          </Link>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Data
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
              {stats.recentReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {report.number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {report.client}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(report.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`
                      badge
                      ${report.status === 'aprovado' ? 'badge-success' : ''}
                      ${report.status === 'reprovado' ? 'badge-danger' : ''}
                      ${report.status === 'finalizado' ? 'badge-info' : ''}
                      ${report.status === 'rascunho' ? 'badge-warning' : ''}
                    `}>
                      {report.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/report/${report.id}`}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
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
