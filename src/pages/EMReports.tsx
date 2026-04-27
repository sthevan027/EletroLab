import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownTrayIcon, EyeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import type { EletroMecanicoReport } from '../types';
import { dbUtils } from '../db/database';

const EMReports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<EletroMecanicoReport[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const all = await dbUtils.getAllEMReports();
        setReports(all);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(r => {
      const hay = [
        r.header.reportNumber,
        r.header.client,
        r.header.site,
        r.header.tag,
        r.header.responsible?.name,
        r.module,
        r.discipline,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [reports, search]);

  const formatDate = (d: Date) =>
    (d instanceof Date ? d : new Date(d)).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Relatórios EM</h1>
          <p className="text-sm text-gray-500 mt-0.5">Eletromecânico (unificado)</p>
        </div>
        <span className="text-xs text-gray-600 bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-full">
          {filtered.length} de {reports.length}
        </span>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, local, tag, número..."
          className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600"
        />
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mb-3">
              <DocumentTextIcon className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">Nenhum relatório EM encontrado</p>
            <p className="text-xs text-gray-600">Gere um Megger e salve como EM para começar</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors group">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white">
                    {r.header.reportNumber ? `${r.header.reportNumber} · ` : ''}
                    {r.module.toUpperCase()} · {r.header.tag || 'Sem TAG'}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {r.header.client} · {r.header.site} · {formatDate(r.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                  <Link
                    to={`/em/report/${r.id}`}
                    className="p-1.5 text-gray-600 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Ver"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Link>
                  <button
                    className="p-1.5 text-gray-600 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Exportar"
                    onClick={() => alert('Exportação corporativa será habilitada quando o PDF base for fornecido')}
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

export default EMReports;

