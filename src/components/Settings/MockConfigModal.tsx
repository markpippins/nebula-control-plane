import React, { useState } from 'react';
import {
  Sliders,
  Server,
  Code2,
  RefreshCw,
  Radio,
  CheckCircle2,
  XCircle,
  Database,
  ExternalLink,
  Info,
  Palette,
  Sun,
  Moon,
  Shield,
  Activity,
  Terminal,
  Play,
  Zap,
} from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';
import { checkBackendHealth, apiRequest } from '../../services/apiClient';

export const MockConfigModal: React.FC = () => {
  const { apiConfig, updateApiConfig, wsConnected, activeWsClients, theme, setTheme, addActivityLog, refreshCounts } = useNebula();
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(apiConfig.baseUrl);
  const [customWsUrl, setCustomWsUrl] = useState<string>(apiConfig.wsUrl || '');
  const [healthStatus, setHealthStatus] = useState<{ testing: boolean; result: { ok: boolean; message: string; db?: boolean } | null }>({
    testing: false,
    result: null,
  });
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleToggleMock = (useMock: boolean) => {
    const newBase = useMock ? '/api' : 'http://localhost:3101/api';
    setCustomBaseUrl(newBase);
    updateApiConfig({
      useMock,
      baseUrl: newBase,
      wsUrl: useMock ? '' : 'ws://localhost:3200/ws',
    });
  };

  const handleSaveCustomUrls = () => {
    updateApiConfig({
      baseUrl: customBaseUrl,
      wsUrl: customWsUrl,
    });
    setActionMessage('Backend configuration saved & WebSocket reconnected.');
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleTestHealth = async () => {
    setHealthStatus({ testing: true, result: null });
    const res = await checkBackendHealth(customBaseUrl);
    setHealthStatus({ testing: false, result: res });
  };

  const runControlAction = async (endpoint: string, label: string) => {
    setActionMessage(`Executing ${label}...`);
    try {
      const res = await apiRequest<any>(endpoint, { method: 'POST' });
      addActivityLog('CONTROL_PLANE', `${label} executed successfully`);
      setActionMessage(`${label} complete: ${JSON.stringify(res)}`);
      refreshCounts();
    } catch (err: any) {
      setActionMessage(`Error running ${label}: ${err.message}`);
    }
  };

  return (
    <div className="p-4 space-y-4 font-sans text-slate-900 dark:text-slate-100 overflow-y-auto h-full font-mono text-xs">
      <div className="border-b border-slate-300 dark:border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-sky-700 dark:text-indigo-400 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-700 dark:text-indigo-400" />
            MOCKING SCHEME & CONTROL PLANE ENGINE
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Configure REST endpoint targets, real-time WebSocket event buses, and control plane triggers
          </p>
        </div>

        {actionMessage && (
          <div className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 rounded font-bold animate-fade-in text-[11px]">
            {actionMessage}
          </div>
        )}
      </div>

      {/* Visual Theme Selection (Light, Dark, Steel) */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-3 shadow-2xs">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          IDE Color Scheme & Visual Theme Selection
        </h2>

        <p className="text-xs text-slate-600 dark:text-slate-400">
          Switch between Light, Dark (carbon-black), and Industrial Steel color schemes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Light Theme Card */}
          <div
            onClick={() => setTheme('light')}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
              theme === 'light'
                ? 'bg-amber-50 border-amber-500 text-amber-950 shadow-2xs font-bold ring-2 ring-amber-400'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-300">
                <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                LIGHT MODE
              </span>
              {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
            </div>
            <p className="text-[11px] font-normal leading-relaxed text-slate-600 dark:text-slate-400">
              Clean, bright canvas with soft white containers, slate borders, and rich typography.
            </p>
          </div>

          {/* Dark Theme Card */}
          <div
            onClick={() => setTheme('dark')}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
              theme === 'dark'
                ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 shadow-2xs font-bold ring-2 ring-indigo-500'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 font-bold text-xs text-indigo-400">
                <Moon className="w-4 h-4 text-indigo-400" />
                DARK MODE (CARBON BLACK)
              </span>
              {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
            </div>
            <p className="text-[11px] font-normal leading-relaxed text-slate-600 dark:text-slate-400">
              Deep zinc/carbon black canvas (#09090b) with high legibility and minimal blue bleed.
            </p>
          </div>

          {/* Steel Theme Card */}
          <div
            onClick={() => setTheme('steel')}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
              theme === 'steel'
                ? 'bg-sky-950/70 border-sky-400 text-sky-200 shadow-2xs font-bold ring-2 ring-sky-400'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 font-bold text-xs text-sky-400">
                <Shield className="w-4 h-4 text-sky-400" />
                STEEL MODE
              </span>
              {theme === 'steel' && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
            </div>
            <p className="text-[11px] font-normal leading-relaxed text-slate-600 dark:text-slate-400">
              Industrial gunmetal steel palette with metallic slate containers and chrome highlights.
            </p>
          </div>
        </div>
      </div>

      {/* Target API Mode Selection */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-3 shadow-2xs">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-sky-600 dark:text-indigo-400" />
          Active Backend Endpoint & Health Verification
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Local Mock Option */}
          <div
            onClick={() => handleToggleMock(true)}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
              apiConfig.useMock
                ? 'bg-sky-50 dark:bg-blue-950/60 border-sky-500 dark:border-blue-500 text-sky-900 dark:text-blue-200 shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between font-bold mb-1">
              <span>LOCAL EXPRESS MOCK</span>
              {apiConfig.useMock && <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-blue-400" />}
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
              Base URL: <code className="text-emerald-700 dark:text-emerald-400 font-bold">/api</code>
            </div>
            <p className="text-[11px] mt-2 leading-relaxed text-slate-700 dark:text-slate-300">
              In-memory Express engine (<code className="text-sky-800 dark:text-indigo-300 font-semibold">server.ts</code>) with full seed dataset, 8-status Kanban moves, WorkRequest IR compiler, and mock WebSockets.
            </p>
          </div>

          {/* Production nebula-srv Option */}
          <div
            onClick={() => handleToggleMock(false)}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
              !apiConfig.useMock
                ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-900 dark:text-purple-200 shadow-2xs'
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
              Connects directly to live <code className="text-purple-800 dark:text-purple-300 font-semibold">nebula-srv</code> Express backend on port 3101 (PostgreSQL & Redis).
            </p>
          </div>
        </div>

        {/* Custom Target URL Input & Health Check */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-300 dark:border-slate-800 space-y-3 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                REST API Base URL
              </label>
              <input
                type="text"
                value={customBaseUrl}
                onChange={(e) => setCustomBaseUrl(e.target.value)}
                placeholder="/api or http://localhost:3101/api"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                WebSocket Event Bus URL (e.g. ui-event-bus :3200)
              </label>
              <input
                type="text"
                value={customWsUrl}
                onChange={(e) => setCustomWsUrl(e.target.value)}
                placeholder="ws://localhost:3200/ws (Leave empty for auto)"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleSaveCustomUrls}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold transition-colors cursor-pointer"
            >
              Apply Base URL & WS Settings
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTestHealth}
                disabled={healthStatus.testing}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                {healthStatus.testing ? 'Testing /health...' : 'Test Backend Liveness'}
              </button>

              {healthStatus.result && (
                <span
                  className={`px-2.5 py-1 rounded font-bold text-[11px] flex items-center gap-1 ${
                    healthStatus.result.ok
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-800'
                  }`}
                >
                  {healthStatus.result.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {healthStatus.result.ok ? `LIVE (Status: ${healthStatus.result.message})` : healthStatus.result.message}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Control Plane Operations Surface */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-3 shadow-2xs">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          Control Plane Operational Endpoints
        </h2>

        <p className="text-xs text-slate-600 dark:text-slate-400">
          Execute write & sync operations against the active backend server:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            onClick={() => runControlAction('/refresh-stats', 'Refresh Materialized Views')}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 rounded-lg text-left transition-colors cursor-pointer space-y-1"
          >
            <div className="font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              POST /refresh-stats
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Refresh all materialized views in PostgreSQL schema
            </div>
          </button>

          <button
            onClick={() => runControlAction('/audit/sync', 'Sync Filesystem Audit Logs')}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 rounded-lg text-left transition-colors cursor-pointer space-y-1"
          >
            <div className="font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              POST /audit/sync
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Scan audit directory & upsert markdown records
            </div>
          </button>

          <button
            onClick={() => runControlAction('/seed', 'Seed Initial Dataset')}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 rounded-lg text-left transition-colors cursor-pointer space-y-1"
          >
            <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5" />
              POST /seed
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Seed database with initial system & requirement records
            </div>
          </button>

          <button
            onClick={() => runControlAction('/harvest-candidates/discover', 'Discover Harvest Candidates')}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 rounded-lg text-left transition-colors cursor-pointer space-y-1"
          >
            <div className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              POST /candidates/discover
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Scan unprocessed harvests for potential candidates
            </div>
          </button>
        </div>
      </div>

      {/* Real-time WebSockets Engine */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-2 shadow-2xs">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Real-Time WebSocket Synchronization Status
        </h2>

        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-300 dark:border-slate-800">
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200">WebSocket Target: {apiConfig.wsUrl || (apiConfig.useMock ? '/ws' : 'ws://localhost:3200/ws')}</div>
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
    </div>
  );
};
