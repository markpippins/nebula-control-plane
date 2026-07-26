import React, { useEffect, useState } from 'react';
import {
  Kanban,
  Zap,
  HelpCircle,
  Wheat,
  FileCheck,
  Code2,
  RefreshCw,
  TrendingUp,
  Activity,
  Boxes,
  Layers,
  ArrowUpRight,
  Sparkles,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useNebula } from '../../context/NebulaContext';
import { apiRequest } from '../../services/apiClient';
import { Requirement } from '../../types/nebula';

export const DashboardView: React.FC = () => {
  const { counts, refreshCounts, activityLogs, triggerRefresh, setActiveTab } = useNebula();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cpfCount, setCpfCount] = useState<{ ready: number; promoted: number; nearMiss: number; low: number }>({
    ready: 0,
    promoted: 0,
    nearMiss: 0,
    low: 0,
  });

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [reqData, cpfData] = await Promise.all([
        apiRequest<Requirement[]>('/requirements'),
        apiRequest<{ ready: number; promoted: number; nearMiss: number; low: number }>('/cpf/count').catch(
          () => ({ ready: 1, promoted: 2, nearMiss: 1, low: 0 })
        ),
      ]);
      setRequirements(reqData);
      setCpfCount(cpfData);
    } catch (err) {
      console.warn('[Dashboard] Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [triggerRefresh]);

  // Aggregate requirement counts across canonical 8 statuses
  const statusMap: Record<string, number> = {
    Backlog: 0,
    ToDo: 0,
    InProgress: 0,
    Active: 0,
    Blocked: 0,
    Done: 0,
    Cancelled: 0,
    Accepted: 0,
  };

  requirements.forEach((r) => {
    if (statusMap[r.status] !== undefined) {
      statusMap[r.status]++;
    } else {
      statusMap.Backlog++;
    }
  });

  const chartData = Object.keys(statusMap).map((key) => ({
    name: key,
    count: statusMap[key],
  }));

  const COLORS = ['#64748b', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#059669', '#6b7280', '#8b5cf6'];

  return (
    <div className="p-4 space-y-4 font-sans text-slate-900 dark:text-slate-100 overflow-y-auto h-full">
      {/* Title & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-300 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-bold font-mono tracking-tight flex items-center gap-2 text-sky-700 dark:text-indigo-400">
            <Boxes className="w-5 h-5 text-sky-700 dark:text-indigo-400" />
            PROCESS CONTROL DASHBOARD // NEBULA-SRV
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Real-time synchronization & compiler lifecycle monitoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refreshCounts();
              loadDashboardData();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono transition-colors font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Signals
          </button>
        </div>
      </div>

      {/* Top 4 Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        <div
          onClick={() => setActiveTab('kanban')}
          className="bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-300 dark:border-slate-800/90 rounded-lg p-3 cursor-pointer transition-all hover:border-sky-500/60 dark:hover:border-indigo-500/50 group shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1">
            <span className="text-xs font-mono font-medium">REQUIREMENTS</span>
            <Kanban className="w-4 h-4 text-sky-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-sky-800 dark:text-indigo-300">
            {counts?.requirements ?? requirements.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>Canonical 8 Statuses</span>
            <ArrowUpRight className="w-3 h-3 text-sky-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('harvests')}
          className="bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-300 dark:border-slate-800/90 rounded-lg p-3 cursor-pointer transition-all hover:border-emerald-500/60 dark:hover:border-emerald-500/50 group shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1">
            <span className="text-xs font-mono font-medium">HARVEST CANDIDATES</span>
            <Wheat className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {counts?.candidates ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>CPF Promotable: {cpfCount.ready}</span>
            <ArrowUpRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('questions')}
          className="bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-300 dark:border-slate-800/90 rounded-lg p-3 cursor-pointer transition-all hover:border-amber-500/60 dark:hover:border-amber-500/50 group shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1">
            <span className="text-xs font-mono font-medium">OPEN QUESTIONS</span>
            <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {counts?.openQuestions ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>Role Deliberation Active</span>
            <ArrowUpRight className="w-3 h-3 text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('audit')}
          className="bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-300 dark:border-slate-800/90 rounded-lg p-3 cursor-pointer transition-all hover:border-blue-500/60 dark:hover:border-blue-500/50 group shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1">
            <span className="text-xs font-mono font-medium">AGENT AUDIT LOGS</span>
            <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {counts?.agentRecords ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>Architect & Engineer Audits</span>
            <ArrowUpRight className="w-3 h-3 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Requirement Status Lifecycle Distribution */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800/80 pb-2">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-700 dark:text-indigo-400" />
              Requirements Lifecycle Distribution
            </h2>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              8 Canonical Status Breakdown
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--steel-card)',
                    borderColor: 'var(--steel-border)',
                    color: 'var(--steel-text)',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CPF Compilation Readiness & Execution State */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800/80 pb-2">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                CPF Readiness Framework
              </h2>
              <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 font-bold">
                Score Threshold ≥ 0.7
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-950/60 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Ready for Plan Promotion</span>
                <span className="text-emerald-800 dark:text-emerald-300 font-bold">{cpfCount.ready}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-950/60 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-blue-700 dark:text-blue-400 font-semibold">Promoted Candidates</span>
                <span className="text-blue-800 dark:text-blue-300 font-bold">{cpfCount.promoted}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-950/60 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-amber-700 dark:text-amber-400 font-semibold">Near-Miss (0.6 - 0.8)</span>
                <span className="text-amber-800 dark:text-amber-300 font-bold">{cpfCount.nearMiss}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-950/60 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Low Score (&lt; 0.6)</span>
                <span className="text-slate-800 dark:text-slate-300">{cpfCount.low}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('cpf')}
            className="w-full mt-4 py-2 bg-purple-100 dark:bg-purple-950/80 hover:bg-purple-200 dark:hover:bg-purple-900/80 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-800/80 rounded text-xs font-mono font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <Filter className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            Open Full CPF Funnel Dashboard
          </button>
        </div>
      </div>

      {/* Real-time WebSocket Event Log */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 font-mono shadow-xs">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-700 dark:text-indigo-400 animate-pulse" />
            Live WebSocket Real-Time Event Stream
          </h2>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Broadcasted to all connected clients
          </span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
          {activityLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 p-1.5 rounded bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-300"
            >
              <span className="text-slate-500 shrink-0 text-[10px]">{log.timestamp}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-sky-100 dark:bg-indigo-950 text-sky-800 dark:text-indigo-400 border border-sky-300 dark:border-indigo-800 shrink-0 font-semibold">
                {log.type}
              </span>
              <span className="truncate">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
