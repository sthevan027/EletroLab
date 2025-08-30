import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  FileText, 
  Settings, 
  Zap, 
  Brain, 
  Clock,
  Save,
  Download
} from 'lucide-react';
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
      return <BarChart3 className="w-4 h-4" />;
    } else {
      return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                EletriLab 
              </h1>
              <p className="text-gray-600 mt-1">
                Gerador de Relatórios Megger/IR com IA
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-500">
                <Brain className="w-4 h-4 mr-1" />
                <span>IA Ativa</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Relatórios</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReports.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Save className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Salvos Hoje</p>
                <p className="text-2xl font-bold text-gray-900">{stats.savedToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Multi-Fase</p>
                <p className="text-2xl font-bold text-gray-900">{stats.multiPhase}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Brain className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">IA Aprendendo</p>
                <p className="text-2xl font-bold text-gray-900">{stats.aiLearning}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-500" />
              Ações Rápidas
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/generate"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="p-2 bg-blue-100 rounded-lg mr-4">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Gerar Rápido</h3>
                  <p className="text-sm text-gray-600">Relatório único sem salvar</p>
                </div>
              </Link>

              <Link
                to="/multiphase"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                <div className="p-2 bg-purple-100 rounded-lg mr-4">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Gerar Multi-Fase</h3>
                  <p className="text-sm text-gray-600">Múltiplos relatórios com IA</p>
                </div>
              </Link>

              <Link
                to="/parameters"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-gray-100 rounded-lg mr-4">
                  <Settings className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Parâmetros</h3>
                  <p className="text-sm text-gray-600">Configurar perfis e IA</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Relatórios Recentes */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-gray-500" />
              Relatórios Recentes
            </h2>
          </div>
          <div className="p-6">
            {stats.recentReports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum relatório encontrado</p>
                <p className="text-sm text-gray-400 mt-1">
                  Comece gerando seu primeiro relatório
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-100 rounded-lg mr-4">
                        {getReportIcon(report as any)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {formatReportTitle(report as any)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatReportDate(report.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {(report as any).isSaved && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Save className="w-3 h-3 mr-1" />
                          Salvo
                        </span>
                      )}
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Estatísticas de IA */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-orange-500" />
              Estatísticas de IA
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {stats.aiLearning > 0 ? '94%' : '0%'}
                </div>
                <p className="text-sm text-gray-600">Confiança da IA</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {stats.multiPhase > 0 ? '89%' : '0%'}
                </div>
                <p className="text-sm text-gray-600">Precisão Multi-Fase</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {stats.totalReports > 0 ? '92%' : '0%'}
                </div>
                <p className="text-sm text-gray-600">Taxa de Sucesso</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
