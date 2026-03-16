import { NavLink } from 'react-router-dom';
import { 
  Database, 
  Clock, 
  TrendingUp, 
  Settings,
  HelpCircle
} from 'lucide-react';

export const Sidebar = ({ activeTab, onTabChange, newCount }) => {
  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-white border-r border-slate-200 flex flex-col" data-testid="sidebar">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Valencia
            </h1>
            <p className="text-xs text-slate-500">Investor Database</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Database
          </p>
          
          <button
            onClick={() => onTabChange('all')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-orange-50 text-orange-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            data-testid="nav-all-investors"
          >
            <Database className="h-4 w-4" />
            All Investors
          </button>

          <button
            onClick={() => onTabChange('new')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'new'
                ? 'bg-orange-50 text-orange-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            data-testid="nav-new-investors"
          >
            <Clock className="h-4 w-4" />
            New Today
            {newCount > 0 && (
              <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-600 rounded-full">
                {newCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-200">
        <div className="space-y-1">
          <a
            href="#help"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            Help & Support
          </a>
        </div>
        <div className="mt-4 px-3">
          <p className="text-xs text-slate-400">
            Powered by AI • Built for Founders
          </p>
        </div>
      </div>
    </aside>
  );
};
