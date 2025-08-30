import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  FolderIcon, 
  ChartBarIcon, 
  CpuChipIcon,
  BoltIcon,
  CogIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { DashboardStats, IRReport, MultiPhaseReport } from '../types';
import { dbUtils } from '../db/database';
import { cloud } from '../db/cloud';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    totalEquipment: 0,
    totalTests: 0,
    savedToday: 0,
    multiPhase: 0,
    aiLearning: 0,
    resultsDistribution: { BOM: 0, ACEITÁVEL: 0, REPROVADO: 0 },
    categoryDistribution: {
      motor: 0,
      painel: 0,
      cabo: 0,
      megger: 0,
      outros: 0
    },
    recentReports: [],
    recentTests: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const dashboardStats = await dbUtils.getDashboardStats();

      // Se nuvem estiver ativa, buscar recentes remotos e mesclar
      if (cloud.isEnabled()) {
        try {
          const remote = await cloud.getRecentReports(cloud.getUserId(), 5);
          if (remote.length > 0) {
            setStats({ ...dashboardStats, recentReports: remote as any });
          } else {
            setStats(dashboardStats);
          }
        } catch {
          setStats(dashboardStats);
        }
      } else {
        setStats(dashboardStats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatReportTitle = (report: IRReport | MultiPhaseReport) => {
    if ('reports' in report && report.reports) {
      // MultiPhaseReport
      return `${report.reports.length} Fases - ${report.reports[0]?.id || 'N/A'}`;
    } else {
      // IRReport
      return `${(report as IRReport).category.toUpperCase()} - ${(report as IRReport).tag || 'Sem Tag'}`;
    }
  };

  const formatReportDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getReportIcon = (report: IRReport | MultiPhaseReport) => {
    if ('reports' in report) {
      return <ChartBarIcon className="w-4 h-4" />;
    } else {
      return <DocumentTextIcon className="w-4 h-4" />;
    }
  };

  const handleExport = async (report: any) => {
    try {
      // Implementar exportação aqui
      console.log('Exportando relatório:', report.id);
    } catch (error) {
      console.error('Erro ao exportar:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">EletriLab</h1>
          <p className="text-gray-400 mt-2 text-lg">Gerador de Relatórios Megger/IR com IA</p>
        </div>
        <div className="flex items-center space-x-2 text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">IA Ativa</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Relatórios</p>
              <p className="text-2xl font-bold text-white">{stats.totalReports}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Salvos Hoje</p>
              <p className="text-2xl font-bold text-white">{stats.savedToday}</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <FolderIcon className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Multi-Fase</p>
              <p className="text-2xl font-bold text-white">{stats.multiPhase}</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">IA Aprendendo</p>
              <p className="text-2xl font-bold text-white">{stats.aiLearning}</p>
            </div>
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <CpuChipIcon className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center space-x-2 mb-6">
          <BoltIcon className="w-6 h-6 text-yellow-400" />
          <h2 className="text-xl font-semibold text-white">Ações Rápidas</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/generate"
            className="p-6 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Gerar Rápido</h3>
                <p className="text-sm text-gray-400">Relatório único sem salvar</p>
              </div>
            </div>
          </Link>

          <Link
            to="/multiphase"
            className="p-6 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Gerar Multi-Fase</h3>
                <p className="text-sm text-gray-400">Múltiplos relatórios com IA</p>
              </div>
            </div>
          </Link>

          <Link
            to="/parameters"
            className="p-6 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-500/20 rounded-lg">
                <CogIcon className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Parâmetros</h3>
                <p className="text-sm text-gray-400">Configurar perfis e IA</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Relatórios Recentes</h2>
          </div>
          <Link
            to="/reports"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            Ver todos →
          </Link>
        </div>
        
        {stats.recentReports.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Nenhum relatório recente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.recentReports.slice(0, 5).map((report: any) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${
                    report.type === 'multi' || report.reports 
                      ? 'bg-purple-500/20 text-purple-400' 
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {getReportIcon(report)}
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{formatReportTitle(report)}</h3>
                    <p className="text-sm text-gray-400">{formatReportDate(report.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {(report as any).isSaved && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                      Salvo
                    </span>
                  )}
                  <Link
                    to={`/report/${report.type || 'ir'}/${report.id}`}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                    title="Visualizar"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleExport(report)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                    title="Exportar"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Statistics */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center space-x-2 mb-6">
          <CpuChipIcon className="w-6 h-6 text-orange-400" />
          <h2 className="text-xl font-semibold text-white">Estatísticas de IA</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">94%</div>
            <p className="text-gray-400">Precisão Geral</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">89%</div>
            <p className="text-gray-400">Aprendizado</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">92%</div>
            <p className="text-gray-400">Eficiência</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
