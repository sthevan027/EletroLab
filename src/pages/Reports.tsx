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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Relatórios</h1>
          <p className="text-gray-400 mt-1">Visualize e gerencie todos os relatórios salvos</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            {filteredReports.length} de {reports.length} relatórios
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por equipamento, categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Module Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(MODULE_LABELS) as ModuleFilter[]).map((mod) => (
            <button
              key={mod}
              onClick={() => setFilterModule(mod)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterModule === mod
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
              }`}
            >
              {MODULE_LABELS[mod]}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-8 text-center">
            <DocumentTextIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">Nenhum relatório encontrado</h3>
            <p className="text-gray-500">
              {searchTerm || filterModule !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Crie seu primeiro relatório para começar'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredReports.map((report) => (
                             <div key={report.id} className="p-6 hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-lg ${MODULE_COLORS[report.module] || MODULE_COLORS.all}`}>
                      {report.type === 'multi' ? (
                        <ChartBarIcon className="w-6 h-6" />
                      ) : (
                        <DocumentTextIcon className="w-6 h-6" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-white">{report.title}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{formatDate(report.createdAt)}</span>
                        </div>
                        {report.equipment && (
                          <div className="flex items-center space-x-1">
                            <TagIcon className="w-4 h-4" />
                            <span>{report.equipment}</span>
                          </div>
                        )}
                        {report.isSaved && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                            Salvo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/report/${report.type}/${report.id}`}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      title="Visualizar"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleExport(report)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      title="Exportar"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5" />
                    </button>
                  </div>
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
