import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Plus, 
  Settings, 
  Menu
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Novo Relatório', href: '/new-report', icon: Plus },
  { name: 'Equipamentos', href: '/equipment', icon: Settings },
  { name: 'Parâmetros', href: '/parameters', icon: Settings },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Força o tema escuro
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar para desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 px-6 pb-4 border-r border-gray-200 dark:border-gray-700">
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center space-x-3">
              <img src="/src/assets/logo-512.png" alt="EletriLab Logo" className="h-8 w-8 rounded-lg" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">EletriLab</h1>
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={`
                            group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors
                            ${isActive 
                              ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' 
                              : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-primary-400 dark:hover:bg-gray-700'
                            }
                          `}
                        >
                          <item.icon 
                            className={`h-6 w-6 shrink-0 ${
                              isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                            }`} 
                          />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Sidebar para mobile */}
      <div className={`lg:hidden ${sidebarOpen ? 'fixed inset-0 z-50' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800">
          <div className="flex h-16 shrink-0 items-center px-6">
            <div className="flex items-center space-x-3">
              <img src="/src/assets/logo-512.png" alt="EletriLab Logo" className="h-8 w-8 rounded-lg" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">EletriLab</h1>
            </div>
          </div>
          <nav className="flex flex-1 flex-col px-6 pb-4">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors
                            ${isActive 
                              ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' 
                              : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-primary-400 dark:hover:bg-gray-700'
                            }
                          `}
                        >
                          <item.icon 
                            className={`h-6 w-6 shrink-0 ${
                              isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                            }`} 
                          />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="lg:pl-72">
        {/* Header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Abrir sidebar</span>
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {navigation.find(item => item.href === location.pathname)?.name || 'EletriLab'}
              </h2>
            </div>
          </div>
        </div>

        {/* Conteúdo da página */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
