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

interface Report {
  id: string;
  type: 'ir' | 'multi';
  title: string;
  createdAt: Date;
  equipment?: string;
  category?: string;
  isSaved?: boolean;
}

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ir' | 'multi'>('all');

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
          title: `${r.category || 'Sem Categoria'} - ${r.tag || 'Sem Tag'}`,
          createdAt: r.createdAt,
          equipment: r.tag,
          category: r.category,
          isSaved: r.isSaved
        })),
        ...localMulti.map(r => ({
          id: r.id,
          type: 'multi' as const,
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
            title: r.type === 'ir' 
              ? `${r.category || 'Sem Categoria'} - ${r.equipment || 'Sem Equipamento'}`
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
    
    const matchesType = filterType === 'all' || report.type === filterType;
    
    return matchesSearch && matchesType;
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

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'ir' | 'multi')}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os tipos</option>
            <option value="ir">Relatórios IR</option>
            <option value="multi">Multi-Fase</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-8 text-center">
            <DocumentTextIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">Nenhum relatório encontrado</h3>
            <p className="text-gray-500">
              {searchTerm || filterType !== 'all' 
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
                    <div className={`p-3 rounded-lg ${
                      report.type === 'ir' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {report.type === 'ir' ? (
                        <DocumentTextIcon className="w-6 h-6" />
                      ) : (
                        <ChartBarIcon className="w-6 h-6" />
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
