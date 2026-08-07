import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  Kanban,
  Wheat,
  Filter,
  HelpCircle,
  Zap,
  FileCheck,
  GitFork,
  Code2,
  FileText,
  Sliders,
  ChevronRight,
  Activity,
  Cpu,
} from 'lucide-react';
import { useNebula, NavTab } from '../../context/NebulaContext';

export const SidebarNav: React.FC = () => {
  const { activeTab, setActiveTab, counts } = useNebula();

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number | null;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'cpf',
      label: 'CPF Funnel',
      icon: Filter,
      badge: 771,
      badgeColor: 'bg-purple-600 text-white font-bold',
    },
    {
      id: 'systems',
      label: 'Systems & Hierarchy',
      icon: Boxes,
    },
    {
      id: 'kanban',
      label: 'Requirements Kanban',
      icon: Kanban,
      badge: counts?.requirements || null,
      badgeColor: 'bg-indigo-600 text-white',
    },
    {
      id: 'harvests',
      label: 'Harvests & Candidates',
      icon: Wheat,
      badge: counts?.candidates || null,
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'questions',
      label: 'Open Questions',
      icon: HelpCircle,
      badge: counts?.openQuestions || null,
      badgeColor: 'bg-amber-600 text-white',
    },
    {
      id: 'execution',
      label: 'Execution Pipeline',
      icon: Zap,
    },
    {
      id: 'audit',
      label: 'Agent Audit Records',
      icon: FileCheck,
      badge: counts?.agentRecords || null,
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      id: 'knowledge',
      label: 'Knowledge Graph',
      icon: GitFork,
    },
    {
      id: 'opregistry',
      label: 'OP Registry',
      icon: Code2,
      badge: counts?.intents || null,
      badgeColor: 'bg-purple-600 text-white',
    },
    {
      id: 'plansdocs',
      label: 'Plans & Audit Files',
      icon: FileText,
    },
    {
      id: 'settings',
      label: 'Mock Engine & Settings',
      icon: Sliders,
    },
  ];

  return (
    <aside className="w-56 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shrink-0 select-none z-20 font-sans shadow-2xs">
      {/* Upper Navigation List */}
      <div className="p-2 space-y-1 overflow-y-auto">
        <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 flex items-center justify-between">
          <span>PROCESS NAVIGATION</span>
          <Cpu className="w-3 h-3 text-slate-600 dark:text-slate-600" />
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== null && item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badgeColor || 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / System Status */}
      <div className="p-2.5 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 font-mono text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm">
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">nebula-srv v2.4</span>
          </span>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 font-bold">
            PORT 3101
          </span>
        </div>
        <div className="text-[10px] text-slate-500 dark:text-slate-500 leading-tight">
          Database: PostgreSQL (<span className="text-slate-700 dark:text-slate-400 font-semibold">nebula</span>)
          <br />
          Cache: Redis
        </div>
      </div>
    </aside>
  );
};
