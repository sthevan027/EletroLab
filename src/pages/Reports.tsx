import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  ChartBarIcon, 
  EyeIcon, 
  ArrowDownTrayIcon,
  CalendarIcon,
  TagIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { dbUtils } from '../db/database';
import { cloud } from '../db/cloud';
import { exportIRReport, exportMultiPhaseReport } from '../utils/export';

type ModuleFilter = 'all' | 'megger' | 'microhm' | 'hipot' | 'cabo' | 'disjuntor' | 'multi';

interface Report {
  id: string;
  type: 'ir' | 'multi';
  module: ModuleFilter;
  title: string;
  createdAt: Date;
  equipment?: string;
  category?: string;
  isSaved?: boolean;
}

const MODULE_LABELS: Record<ModuleFilter, string> = {
  all: 'Todos',
  megger: 'Megger',
  microhm: 'Microhm',
  hipot: 'Hi-Pot',
  cabo: 'Cabo',
  disjuntor: 'Disjuntor',
  multi: 'Multi-Fase',
};

const MODULE_COLORS: Record<ModuleFilter, string> = {
  all: 'bg-gray-500/20 text-gray-400',
  megger: 'bg-blue-500/20 text-blue-400',
  microhm: 'bg-purple-500/20 text-purple-400',
  hipot: 'bg-orange-500/20 text-orange-400',
  cabo: 'bg-cyan-500/20 text-cyan-400',
  disjuntor: 'bg-amber-500/20 text-amber-400',
  multi: 'bg-indigo-500/20 text-indigo-400',
};

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState<ModuleFilter>('all');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // Buscar relatórios locais
      const localIR = await dbUtils.getAllIRReports();
      const localMulti = await dbUtils.getMultiPhaseReports();
      
      let allReports: Report[] = [
        ...localIR.map(r => ({
          id: r.id,
          type: 'ir' as const,
          module: 'megger' as ModuleFilter,
          title: `Megger - ${r.category?.toUpperCase() || 'Sem Categoria'} - ${r.tag || 'Sem Tag'}`,
          createdAt: r.createdAt,
          equipment: r.tag,
          category: r.category,
          isSaved: r.isSaved
        })),
        ...localMulti.map(r => ({
          id: r.id,
          type: 'multi' as const,
          module: 'multi' as ModuleFilter,
          title: `Multi-Fase - ${r.equipment?.model || 'Sem Modelo'}`,
          createdAt: r.createdAt,
          equipment: r.equipment?.model,
          category: 'Multi-Fase',
          isSaved: true
        }))
      ];

      // Se nuvem estiver ativa, buscar também
      if (cloud.isEnabled()) {
        try {
          const cloudReports = await cloud.getRecentReports(cloud.getUserId(), 50);
          const cloudFormatted = cloudReports.map((r: any) => ({
            id: r.id,
            type: r.type as 'ir' | 'multi',
            module: (r.type === 'ir' ? 'megger' : 'multi') as ModuleFilter,
            title: r.type === 'ir' 
              ? `Megger - ${r.category || 'Sem Categoria'} - ${r.equipment || 'Sem Equipamento'}`
              : `Multi-Fase - ${r.equipment?.model || 'Sem Modelo'}`,
            createdAt: r.createdAt?.toDate?.() || new Date(r.createdAt),
            equipment: r.type === 'ir' ? r.equipment : r.equipment?.model,
            category: r.type === 'ir' ? r.category : 'Multi-Fase',
            isSaved: true
          }));
          
          // Mesclar e remover duplicados
          const merged = [...allReports, ...cloudFormatted];
          const unique = merged.filter((report, index, self) => 
            index === self.findIndex(r => r.id === report.id)
          );
          allReports = unique;
        } catch (error) {
          console.log('Erro ao carregar da nuvem:', error);
        }
      }

      // Ordenar por data mais recente
      allReports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setReports(allReports);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.equipment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesModule = filterModule === 'all' || report.module === filterModule;
    
    return matchesSearch && matchesModule;
  });

  const handleExport = async (report: Report) => {
    try {
      if (report.type === 'ir') {
        const irReport = await dbUtils.getIRReport(report.id);
        if (irReport) {
          await exportIRReport(irReport);
        }
      } else {
        const multiReport = await dbUtils.getMultiPhaseReport(report.id);
        if (multiReport) {
          await exportMultiPhaseReport(multiReport);
        }
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar relatório');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Relatórios</h1>
          <p className="text-sm text-gray-500 mt-0.5">Visualize e gerencie todos os relatórios salvos</p>
        </div>
        <span className="text-xs text-gray-600 bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-full">
          {filteredReports.length} de {reports.length}
        </span>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            type="text"
            placeholder="Buscar por equipamento, categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(MODULE_LABELS) as ModuleFilter[]).map((mod) => (
            <button
              key={mod}
              onClick={() => setFilterModule(mod)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                filterModule === mod
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-gray-950/50 text-gray-500 border-gray-800 hover:border-gray-700 hover:text-gray-300'
              }`}
            >
              {MODULE_LABELS[mod]}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mb-3">
              <DocumentTextIcon className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">Nenhum relatório encontrado</p>
            <p className="text-xs text-gray-600">
              {searchTerm || filterModule !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Gere o seu primeiro relatório para começar'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {filteredReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${MODULE_COLORS[report.module] || MODULE_COLORS.all}`}>
                    {report.type === 'multi' ? (
                      <ChartBarIcon className="w-4 h-4" />
                    ) : (
                      <DocumentTextIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white">{report.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <CalendarIcon className="w-3 h-3" />
                        <span>{formatDate(report.createdAt)}</span>
                      </div>
                      {report.equipment && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <TagIcon className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{report.equipment}</span>
                        </div>
                      )}
                      {report.isSaved && (
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-medium">
                          Salvo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                  <Link
                    to={`/report/${report.type}/${report.id}`}
                    className="p-1.5 text-gray-600 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleExport(report)}
                    className="p-1.5 text-gray-600 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
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
  );
};

export default Reports;
