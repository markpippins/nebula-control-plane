import React from 'react';
import {
  Terminal,
  Search,
  Sun,
  Moon,
  Radio,
  Settings,
  Server,
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';

export const AddressBar: React.FC = () => {
  const {
    activeTab,
    theme,
    toggleTheme,
    setSearchOpen,
    apiConfig,
    wsConnected,
    activeWsClients,
    setActiveTab,
  } = useNebula();

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'System Overview & Analytics';
      case 'systems':
        return 'Systems & Subsystems Hierarchy';
      case 'kanban':
        return 'Requirements Process Control Kanban';
      case 'harvests':
        return 'Harvest Transcripts & CPF Candidates';
      case 'questions':
        return 'Open Questions & Deliberation';
      case 'execution':
        return 'Execution Pipeline & Leases';
      case 'audit':
        return 'Agent Audit Records & Logs';
      case 'knowledge':
        return 'Knowledge Graph & Cross-References';
      case 'opregistry':
        return 'Opcode Sequence Registry';
      case 'plansdocs':
        return 'Implementation Plans & Audit Docs';
      case 'settings':
        return 'Mock Engine & API Configuration';
      default:
        return 'IDE Control Panel';
    }
  };

  return (
    <header className="h-12 bg-slate-200 dark:bg-slate-950 border-b border-slate-300 dark:border-slate-800/80 px-3 flex items-center justify-between text-xs font-mono select-none text-slate-800 dark:text-slate-200 shrink-0 z-30 shadow-xs">
      {/* Top Left: Branding Box */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2 px-2.5 py-1 bg-sky-100 dark:bg-indigo-950/80 border border-sky-300 dark:border-indigo-500/60 rounded text-sky-900 dark:text-indigo-300 hover:bg-sky-200 dark:hover:bg-indigo-900/90 cursor-pointer transition-all tracking-wider font-semibold shadow-xs"
          title="Nebula IDE Process Control Engine"
        >
          <Terminal className="w-3.5 h-3.5 text-sky-700 dark:text-indigo-400 animate-pulse" />
          <span className="font-bold text-sky-900 dark:text-indigo-300">[NEBULA.IDE // PROCESS CONTROL]</span>
        </div>

        {/* Breadcrumb Path */}
        <div className="hidden md:flex items-center gap-1.5 text-slate-600 dark:text-slate-400 bg-slate-300/60 dark:bg-slate-900/60 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700/50">
          <Layers className="w-3 h-3 text-slate-500" />
          <span>http://localhost:3101/api</span>
          <span className="text-slate-400 dark:text-slate-600">/</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{activeTab}</span>
          <span className="text-slate-400 dark:text-slate-600">—</span>
          <span className="text-slate-800 dark:text-slate-300 truncate max-w-[200px]">{getTabLabel(activeTab)}</span>
        </div>
      </div>

      {/* Top Right: Status, Search, Theme Toggle, Mock Switcher */}
      <div className="flex items-center gap-2">
        {/* Real-time WebSocket Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${
            wsConnected
              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800/50'
              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-800/50'
          }`}
          title={wsConnected ? `WebSocket Synced (${activeWsClients} Connected)` : 'Reconnecting to WS...'}
        >
          <Radio className={`w-3 h-3 ${wsConnected ? 'animate-pulse text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
          <span className="hidden sm:inline font-mono font-bold">
            {wsConnected ? `WS SYNC (${activeWsClients})` : 'RECONNECTING'}
          </span>
        </div>

        {/* API Target Mode */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
            apiConfig.useMock
              ? 'bg-sky-100 dark:bg-blue-950/60 text-sky-900 dark:text-blue-300 border-sky-300 dark:border-blue-800/50 hover:bg-sky-200 dark:hover:bg-blue-900/60'
              : 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-800/50 hover:bg-purple-200 dark:hover:bg-purple-900/60'
          }`}
          title="Click to configure API Mocking Scheme"
        >
          <Server className="w-3 h-3" />
          <span className="hidden sm:inline font-mono font-bold">{apiConfig.useMock ? 'LOCAL MOCK' : 'PROD API'}</span>
        </button>

        {/* Global Search Bar Trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 bg-slate-300/80 hover:bg-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-400 dark:border-slate-700 text-slate-800 dark:text-slate-300 px-2.5 py-1 rounded transition-colors text-xs"
          title="Search all 13 nebula entities (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          <span className="hidden lg:inline text-slate-600 dark:text-slate-400">Search 13 entities...</span>
          <kbd className="hidden lg:inline text-[10px] bg-slate-200 dark:bg-slate-900 px-1 py-0.2 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-mono">
            Ctrl K
          </kbd>
        </button>

        {/* Dark/Light Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 px-2 rounded bg-slate-300 hover:bg-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 border border-slate-400 dark:border-slate-700 transition-colors flex items-center gap-1.5 font-mono font-bold"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] hidden sm:inline text-amber-300">LIGHT</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-sky-700" />
              <span className="text-[10px] hidden sm:inline text-sky-800">DARK</span>
            </>
          )}
        </button>

        {/* Settings button */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`p-1.5 rounded border transition-colors ${
            activeTab === 'settings'
              ? 'bg-sky-600 dark:bg-indigo-600 text-white border-sky-500 dark:border-indigo-500'
              : 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 border-slate-400 dark:border-slate-700'
          }`}
          title="Settings & Mock API controls"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
