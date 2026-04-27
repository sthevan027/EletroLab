import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  BoltIcon, 
  CogIcon, 
  CircleStackIcon,
  ChartBarIcon,
  DocumentTextIcon,
  BeakerIcon,
  ScaleIcon,
  WrenchScrewdriverIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const moduleItems = [
    { path: '/generate', label: 'Megger', icon: BoltIcon, color: 'text-blue-400' },
    { path: '/tools', label: 'Microhm / Hi-Pot', icon: WrenchScrewdriverIcon, color: 'text-purple-400' },
    { path: '/cable', label: 'Cabo', icon: BeakerIcon, color: 'text-cyan-400' },
    { path: '/breaker', label: 'Disjuntor', icon: ScaleIcon, color: 'text-amber-400' },
  ];

  const otherItems = [
    { path: '/multiphase', label: 'Multi-Fase', icon: ChartBarIcon, color: 'text-gray-400' },
    { path: '/panel', label: 'Painel', icon: Squares2X2Icon, color: 'text-gray-400' },
    { path: '/em-reports', label: 'Eletromecânico', icon: DocumentTextIcon, color: 'text-gray-400' },
    { path: '/reports', label: 'Relatórios', icon: DocumentTextIcon, color: 'text-gray-400' },
    { path: '/parameters', label: 'Parâmetros', icon: CogIcon, color: 'text-gray-400' },
    { path: '/equipment', label: 'Equipamentos', icon: CircleStackIcon, color: 'text-gray-400' },
  ];

  const NavItem = ({ path, label, icon: Icon, color }: { path: string; label: string; icon: React.ElementType; color: string }) => {
    const isActive = location.pathname === path;
    return (
      <Link
        to={path}
        className={`group flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative ${
          isActive
            ? 'bg-blue-600/20 text-white'
            : 'text-gray-400 hover:bg-gray-700/60 hover:text-gray-100'
        }`}
      >
        {isActive && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-blue-500 rounded-full" />
        )}
        <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-blue-400' : color} group-hover:text-gray-200`} style={{ width: 18, height: 18 }} />
        <span className={`font-medium text-sm ${isActive ? 'text-white' : ''}`}>{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-60 bg-gray-900 border-r border-gray-800/80 flex flex-col">
        {/* Logo */}
        <div className="flex items-center h-16 px-5 border-b border-gray-800/80">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50 mr-3 flex-shrink-0">
            <BoltIcon className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <span className="text-base font-bold text-white">EletriLab</span>
            <span className="block text-[10px] text-gray-500 leading-none -mt-0.5">Qualidade Elétrica</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavItem path="/" label="Dashboard" icon={HomeIcon} color="text-gray-400" />

          <div className="pt-5 pb-1.5 px-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Relatórios</span>
          </div>
          {moduleItems.map(item => (
            <NavItem key={item.path} {...item} />
          ))}

          <div className="pt-5 pb-1.5 px-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Sistema</span>
          </div>
          {otherItems.map(item => (
            <NavItem key={item.path} {...item} />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-800/80">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs text-gray-500 font-medium">IA Ativa</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-60 min-h-screen">
        <main className="p-6 max-w-[1400px]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
