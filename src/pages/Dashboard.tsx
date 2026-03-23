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
  ClockIcon,
  ArrowRightIcon,
  BeakerIcon,
  ScaleIcon,
  WrenchScrewdriverIcon,
  Squares2X2Icon
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
      return `${report.reports.length} Fases – ${report.reports[0]?.id || 'N/A'}`;
    } else {
      const r = report as IRReport;
      return `${r.category.charAt(0).toUpperCase() + r.category.slice(1)} – ${r.tag || 'Sem Tag'}`;
    }
  };

  const formatReportDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getReportIcon = (report: IRReport | MultiPhaseReport) => {
    if ('reports' in report) return <ChartBarIcon className="w-4 h-4" />;
    return <DocumentTextIcon className="w-4 h-4" />;
  };

  const handleExport = async (report: any) => {
    console.log('Exportando relatório:', report.id);
  };

  const statCards = [
    {
      label: 'Total Relatórios',
      value: stats.totalReports,
      icon: DocumentTextIcon,
      color: 'blue',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      iconColor: 'text-blue-400',
      valueColor: 'text-blue-400',
    },
    {
      label: 'Salvos Hoje',
      value: stats.savedToday,
      icon: FolderIcon,
      color: 'green',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      iconColor: 'text-emerald-400',
      valueColor: 'text-emerald-400',
    },
    {
      label: 'Multi-Fase',
      value: stats.multiPhase,
      icon: ChartBarIcon,
      color: 'purple',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      iconColor: 'text-purple-400',
      valueColor: 'text-purple-400',
    },
    {
      label: 'IA Aprendendo',
      value: stats.aiLearning,
      icon: CpuChipIcon,
      color: 'orange',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      iconColor: 'text-orange-400',
      valueColor: 'text-orange-400',
    },
  ];

  const modules = [
    {
      to: '/generate',
      label: 'Megger',
      sub: 'Resistência de Isolamento',
      icon: BoltIcon,
      tags: ['Colocar', 'Gerar', 'PDF', 'Excel'],
      border: 'border-blue-500/30 hover:border-blue-400/60',
      bg: 'hover:bg-blue-500/5',
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-400',
      dot: 'bg-blue-500',
    },
    {
      to: '/tools',
      label: 'Microhm',
      sub: 'Resistência de Contato',
      icon: WrenchScrewdriverIcon,
      tags: ['Calcular', 'PDF', 'Excel'],
      border: 'border-purple-500/30 hover:border-purple-400/60',
      bg: 'hover:bg-purple-500/5',
      iconBg: 'bg-purple-500/15',
      iconColor: 'text-purple-400',
      dot: 'bg-purple-500',
    },
    {
      to: '/tools',
      label: 'Hi-Pot',
      sub: 'Tensão de Teste',
      icon: BoltIcon,
      tags: ['Calcular', 'PDF', 'Excel'],
      border: 'border-orange-500/30 hover:border-orange-400/60',
      bg: 'hover:bg-orange-500/5',
      iconBg: 'bg-orange-500/15',
      iconColor: 'text-orange-400',
      dot: 'bg-orange-500',
    },
    {
      to: '/cable',
      label: 'Cabo',
      sub: 'Lançamento de Cabo',
      icon: BeakerIcon,
      tags: ['Dimensionar', 'PDF', 'Excel'],
      border: 'border-cyan-500/30 hover:border-cyan-400/60',
      bg: 'hover:bg-cyan-500/5',
      iconBg: 'bg-cyan-500/15',
      iconColor: 'text-cyan-400',
      dot: 'bg-cyan-500',
    },
    {
      to: '/breaker',
      label: 'Disjuntor',
      sub: 'Teste de DJs',
      icon: ScaleIcon,
      tags: ['Calcular', 'PDF', 'Excel'],
      border: 'border-amber-500/30 hover:border-amber-400/60',
      bg: 'hover:bg-amber-500/5',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-400',
      dot: 'bg-amber-500',
    },
  ];

  const extras = [
    { to: '/multiphase', label: 'Multi-Fase', sub: 'Megger multi-fase', icon: ChartBarIcon, iconBg: 'bg-purple-500/15', iconColor: 'text-purple-400' },
    { to: '/panel', label: 'Painel', sub: 'Visão combinada', icon: Squares2X2Icon, iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400' },
    { to: '/parameters', label: 'Parâmetros', sub: 'Perfis e IA', icon: CogIcon, iconBg: 'bg-gray-500/20', iconColor: 'text-gray-400' },
    { to: '/reports', label: 'Relatórios', sub: 'Ver todos salvos', icon: DocumentTextIcon, iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">EletriLab</h1>
          <p className="text-gray-500 mt-1 text-sm">Gerador de Relatórios de Qualidade Elétrica</p>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
          <span className="text-xs text-green-400 font-medium">IA Ativa</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`rounded-xl p-5 border bg-gray-900 ${c.border}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{c.label}</p>
                <div className={`p-1.5 rounded-lg ${c.bg}`}>
                  <Icon className={`w-4 h-4 ${c.iconColor}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold ${c.valueColor}`}>{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Módulos */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BoltIcon className="w-5 h-5 text-yellow-400" />
            <h2 className="text-base font-semibold text-white">Módulos de Relatório</h2>
          </div>
          <span className="text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-medium">PDF + Excel</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {modules.map(m => {
            const Icon = m.icon;
            return (
              <Link
                key={m.label}
                to={m.to}
                className={`group relative flex flex-col p-4 rounded-xl border bg-gray-950/50 transition-all duration-200 ${m.border} ${m.bg}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${m.iconBg}`}>
                  <Icon className={`w-5 h-5 ${m.iconColor}`} />
                </div>
                <h3 className="font-semibold text-white text-sm mb-0.5">{m.label}</h3>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{m.sub}</p>
                <div className="flex flex-wrap gap-1 mt-auto">
                  {m.tags.map(t => (
                    <span key={t} className="text-[10px] bg-gray-800 text-gray-400 border border-gray-700/60 px-1.5 py-0.5 rounded font-medium">
                      {t}
                    </span>
                  ))}
                </div>
                <ArrowRightIcon className="absolute right-3 top-4 w-3.5 h-3.5 text-gray-600 group-hover:text-gray-300 transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Extras + Recentes */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Mais acessos */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Squares2X2Icon className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-white">Mais</h2>
          </div>
          <div className="space-y-2">
            {extras.map(e => {
              const Icon = e.icon;
              return (
                <Link
                  key={e.to}
                  to={e.to}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-950/50 hover:bg-gray-800 border border-gray-800/60 hover:border-gray-700 transition-all group"
                >
                  <div className={`p-1.5 rounded-lg ${e.iconBg}`}>
                    <Icon className={`w-4 h-4 ${e.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 group-hover:text-white">{e.label}</p>
                    <p className="text-xs text-gray-600">{e.sub}</p>
                  </div>
                  <ArrowRightIcon className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-400 transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recentes */}
        <div className="xl:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-white">Relatórios Recentes</h2>
            </div>
            <Link to="/reports" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
              Ver todos <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>

          {stats.recentReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
                <DocumentTextIcon className="w-6 h-6 text-gray-600" />
              </div>
              <p className="text-sm text-gray-500">Nenhum relatório ainda</p>
              <p className="text-xs text-gray-600 mt-1">Gere seu primeiro relatório para vê-lo aqui</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recentReports.slice(0, 5).map((report: any) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-950/50 border border-gray-800/60 hover:border-gray-700 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                      report.type === 'multi' || report.reports
                        ? 'bg-purple-500/15 text-purple-400'
                        : 'bg-blue-500/15 text-blue-400'
                    }`}>
                      {getReportIcon(report)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{formatReportTitle(report)}</p>
                      <p className="text-xs text-gray-600">{formatReportDate(report.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {(report as any).isSaved && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-medium">
                        Salvo
                      </span>
                    )}
                    <Link
                      to={`/report/${report.type || 'ir'}/${report.id}`}
                      className="p-1.5 text-gray-600 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleExport(report)}
                      className="p-1.5 text-gray-600 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
