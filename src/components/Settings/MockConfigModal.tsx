import React from 'react';
import {
  Sliders,
  Server,
  Code2,
  RefreshCw,
  Radio,
  CheckCircle2,
  Database,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';

export const MockConfigModal: React.FC = () => {
  const { apiConfig, updateApiConfig, wsConnected, activeWsClients, refreshCounts } = useNebula();

  const handleToggleMock = (useMock: boolean) => {
    updateApiConfig({
      useMock,
      baseUrl: useMock ? '/api' : 'http://localhost:3101/api',
    });
  };

  return (
    <div className="p-4 space-y-4 font-sans text-slate-900 dark:text-slate-100 overflow-y-auto h-full font-mono text-xs">
      <div className="border-b border-slate-300 dark:border-slate-800 pb-3">
        <h1 className="text-lg font-bold tracking-tight text-sky-700 dark:text-indigo-400 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-sky-700 dark:text-indigo-400" />
          MOCKING SCHEME & API ENGINE CONFIGURATION
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Easy-to-replace mocking scheme mirroring production nebula-srv structure & behavior
        </p>
      </div>

      {/* Target API Mode Selection */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-3 shadow-xs">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-sky-600 dark:text-indigo-400" />
          Active Backend Endpoint Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Local Mock Option */}
          <div
            onClick={() => handleToggleMock(true)}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
              apiConfig.useMock
                ? 'bg-sky-50 dark:bg-blue-950/60 border-sky-500 dark:border-blue-500 text-sky-900 dark:text-blue-200 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between font-bold mb-1">
              <span>LOCAL EXPRESS MOCK (Default)</span>
              {apiConfig.useMock && <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-blue-400" />}
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
              Base URL: <code className="text-emerald-700 dark:text-emerald-400 font-bold">/api</code>
            </div>
            <p className="text-[11px] mt-2 leading-relaxed text-slate-700 dark:text-slate-300">
              Runs in-memory inside <code className="text-sky-800 dark:text-indigo-300 font-semibold">server.ts</code> with realistic seed store, 8-status Kanban move locking, WorkRequest IR compiler, and native WebSockets.
            </p>
          </div>

          {/* Production nebula-srv Option */}
          <div
            onClick={() => handleToggleMock(false)}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
              !apiConfig.useMock
                ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-900 dark:text-purple-200 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between font-bold mb-1">
              <span>PRODUCTION NEBULA-SRV</span>
              {!apiConfig.useMock && <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
              Base URL: <code className="text-emerald-700 dark:text-emerald-400 font-bold">http://localhost:3101/api</code>
            </div>
            <p className="text-[11px] mt-2 leading-relaxed text-slate-700 dark:text-slate-300">
              Routes directly to live <code className="text-purple-800 dark:text-purple-300 font-semibold">nebula-srv</code> Express backend on port 3101 backed by PostgreSQL and Redis.
            </p>
          </div>
        </div>
      </div>

      {/* Real-time WebSockets Engine */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-2 shadow-xs">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Real-Time WebSocket Synchronization Status
        </h2>

        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-300 dark:border-slate-800">
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200">WebSocket Engine: /ws</div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400">
              Connected Clients: <span className="text-emerald-700 dark:text-emerald-400 font-bold">{activeWsClients}</span>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded font-bold text-[11px] ${
              wsConnected
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
            }`}
          >
            {wsConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
      </div>

      {/* Code Snippet for Replacing the Mock */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-2 shadow-xs">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Code2 className="w-4 h-4 text-sky-600 dark:text-indigo-400" />
          How to Replace or Connect External API
        </h2>

        <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
          The application uses standardized <code className="text-sky-800 dark:text-indigo-300 font-semibold">apiRequest()</code> in <code className="text-sky-800 dark:text-indigo-300 font-semibold">/src/services/apiClient.ts</code>. To plug into another server or staging instance, simply pass your custom base URL or edit the configuration:
        </p>

        <pre className="p-3 bg-slate-100 dark:bg-slate-950 rounded border border-slate-300 dark:border-slate-800 text-[11px] text-slate-800 dark:text-slate-300 overflow-x-auto leading-normal font-mono">
{`import { setApiConfig } from './services/apiClient';

// Replace local mock with custom endpoint:
setApiConfig({
  useMock: false,
  baseUrl: 'https://your-custom-nebula-srv-domain.com/api',
});`}
        </pre>
      </div>
    </div>
  );
};
