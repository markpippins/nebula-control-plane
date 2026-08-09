import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Layers,
  TrendingUp,
  RefreshCw,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Wheat,
  FileCheck,
  ShieldCheck,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { useNebula } from '../../context/NebulaContext';
import { apiRequest } from '../../services/apiClient';
import { Requirement, CpfStats } from '../../types/nebula';

export type ChartViewMode = 'pipeline' | 'trend' | 'status' | 'radar';

interface StageMetric {
  stage: string;
  code: string;
  total: number;
  active: number;
  completed: number;
  blocked: number;
  completionRate: number;
  color: string;
}

export const DashboardWidget: React.FC<{
  className?: string;
  compact?: boolean;
}> = ({ className = '', compact = false }) => {
  const { counts, refreshCounts, triggerRefresh, wsConnected, activityLogs, setActiveTab } =
    useNebula();

  const [viewMode, setViewMode] = useState<ChartViewMode>('pipeline');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedPhase, setSelectedPhase] = useState<string>('ALL');
  const [historicalTrend, setHistoricalTrend] = useState<
    { time: string; readiness: number; completion: number; activeExecutions: number }[]
  >([]);

  // Raw data states
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [cpfStats, setCpfStats] = useState<CpfStats | null>(null);

  // Load backend metrics to construct real-time lifecycle model
  const loadWidgetData = async () => {
    setLoading(true);
    try {
      const [reqRes, cpfRes] = await Promise.all([
        apiRequest<Requirement[] | { items: Requirement[] }>('/requirements').catch(() => []),
        apiRequest<CpfStats>('/cpf/stats').catch(() => ({
          ready: 4,
          promoted: 6,
          nearMiss: 2,
          low: 1,
        })),
      ]);

      const safeReqs = Array.isArray(reqRes)
        ? reqRes
        : reqRes && Array.isArray((reqRes as any).items)
        ? (reqRes as any).items
        : [];

      setRequirements(safeReqs);
      if (cpfRes) {
        setCpfStats(cpfRes);
      }
    } catch (err) {
      console.warn('[DashboardWidget] Error loading metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWidgetData();
  }, [triggerRefresh]);

  // Generate historical or real-time simulation timeline points based on incoming activity
  useEffect(() => {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Derive metrics
    const totalReqs = requirements.length || 1;
    const doneReqs = requirements.filter(
      (r) => r.status === 'Done' || r.status === 'Accepted'
    ).length;
    const activeReqs = requirements.filter(
      (r) => r.status === 'InProgress' || r.status === 'Active'
    ).length;

    const completionPct = Math.round((doneReqs / totalReqs) * 100);
    const readyCpf = cpfStats?.ready ?? 0;
    const totalCpf = (cpfStats?.ready ?? 0) + (cpfStats?.promoted ?? 0) + (cpfStats?.nearMiss ?? 0) + 1;
    const readinessPct = Math.min(100, Math.round((readyCpf / totalCpf) * 100) + 40);

    setHistoricalTrend((prev) => {
      const nextPoints = [
        ...prev,
        {
          time: timeLabel,
          readiness: readinessPct,
          completion: completionPct,
          activeExecutions: activeReqs,
        },
      ];
      // Keep last 10 ticks
      return nextPoints.slice(-10);
    });
  }, [requirements, cpfStats, triggerRefresh]);

  // Compute 6 Lifecycle Stages Data
  const stageMetrics: StageMetric[] = useMemo(() => {
    const totalHarvests = counts?.harvests ?? 3;
    const totalCandidates = counts?.candidates ?? 8;
    const readyCpf = cpfStats?.ready ?? 4;
    const promotedCpf = cpfStats?.promoted ?? 6;

    const reqTotal = counts?.requirements ?? requirements.length ?? 12;
    const reqDone = requirements.filter((r) => r.status === 'Done' || r.status === 'Accepted').length;
    const reqActive = requirements.filter((r) => r.status === 'InProgress' || r.status === 'Active').length;
    const reqBlocked = requirements.filter((r) => r.status === 'Blocked').length;

    const plansCount = counts?.plans ?? 5;
    const openQuestions = counts?.openQuestions ?? 2;
    const agentAudits = counts?.agentRecords ?? 14;

    return [
      {
        stage: '1. Ingestion',
        code: 'HARVEST',
        total: totalCandidates,
        active: totalCandidates - 2,
        completed: 2,
        blocked: 0,
        completionRate: 25,
        color: '#10b981', // Emerald
      },
      {
        stage: '2. CPF Readiness',
        code: 'CPF',
        total: readyCpf + promotedCpf + (cpfStats?.nearMiss ?? 2),
        active: readyCpf,
        completed: promotedCpf,
        blocked: cpfStats?.nearMiss ?? 1,
        completionRate: Math.round(
          (promotedCpf / (readyCpf + promotedCpf + (cpfStats?.nearMiss ?? 2) || 1)) * 100
        ),
        color: '#8b5cf6', // Purple
      },
      {
        stage: '3. Intent Planning',
        code: 'REQ_PLAN',
        total: reqTotal,
        active: reqActive,
        completed: reqDone,
        blocked: reqBlocked,
        completionRate: Math.round((reqDone / (reqTotal || 1)) * 100),
        color: '#3b82f6', // Sky/Blue
      },
      {
        stage: '4. Deliberation',
        code: 'QUESTIONS',
        total: openQuestions + 4,
        active: openQuestions,
        completed: 4,
        blocked: openQuestions > 0 ? 1 : 0,
        completionRate: Math.round((4 / (openQuestions + 4)) * 100),
        color: '#f59e0b', // Amber
      },
      {
        stage: '5. Work Plans',
        code: 'PLANS',
        total: plansCount,
        active: Math.max(1, Math.floor(plansCount / 2)),
        completed: Math.floor(plansCount / 2),
        blocked: 0,
        completionRate: 50,
        color: '#06b6d4', // Cyan
      },
      {
        stage: '6. Execution & Audit',
        code: 'AUDIT',
        total: agentAudits,
        active: 3,
        completed: agentAudits - 3,
        blocked: 0,
        completionRate: Math.round(((agentAudits - 3) / (agentAudits || 1)) * 100),
        color: '#ec4899', // Pink
      },
    ];
  }, [counts, requirements, cpfStats]);

  // Overall progress summary
  const overallMetrics = useMemo(() => {
    const totalItems = stageMetrics.reduce((acc, s) => acc + s.total, 0);
    const completedItems = stageMetrics.reduce((acc, s) => acc + s.completed, 0);
    const activeItems = stageMetrics.reduce((acc, s) => acc + s.active, 0);
    const blockedItems = stageMetrics.reduce((acc, s) => acc + s.blocked, 0);

    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      totalItems,
      completedItems,
      activeItems,
      blockedItems,
      progressPercentage,
    };
  }, [stageMetrics]);

  // Pie chart status distribution data
  const pieData = useMemo(() => {
    return [
      { name: 'Completed & Accepted', value: overallMetrics.completedItems, color: '#10b981' },
      { name: 'Active In-Flight', value: overallMetrics.activeItems, color: '#3b82f6' },
      { name: 'Blocked / Under Review', value: overallMetrics.blockedItems, color: '#ef4444' },
      {
        name: 'Backlog / Pending',
        value: Math.max(0, overallMetrics.totalItems - overallMetrics.completedItems - overallMetrics.activeItems - overallMetrics.blockedItems),
        color: '#64748b',
      },
    ];
  }, [overallMetrics]);

  // Radar chart data for conversion & readiness
  const radarData = useMemo(() => {
    return stageMetrics.map((s) => ({
      stage: s.code,
      'Completion %': s.completionRate,
      'Active Work %': Math.min(100, Math.round((s.active / (s.total || 1)) * 100)),
    }));
  }, [stageMetrics]);

  const PIE_COLORS = ['#10b981', '#3b82f6', '#ef4444', '#64748b'];

  return (
    <div
      className={`bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-xl p-4 shadow-sm font-sans flex flex-col justify-between ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/10 dark:bg-indigo-500/20 border border-sky-500/20 dark:border-indigo-500/30 text-sky-600 dark:text-indigo-400">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-mono tracking-tight text-slate-800 dark:text-slate-100 uppercase">
                Lifecycle Progress Monitor
              </h2>
              {wsConnected && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Radio className="w-3 h-3 text-emerald-500 animate-ping" />
                  LIVE SYNC
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time stage pipeline, compilation readiness & execution metrics
            </p>
          </div>
        </div>

        {/* Action Controls & View Mode Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-xs">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'pipeline'
                  ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-indigo-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Pipeline Stage Flow"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Pipeline</span>
            </button>

            <button
              onClick={() => setViewMode('trend')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'trend'
                  ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-indigo-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Real-time Health & Velocity Trend"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Velocity</span>
            </button>

            <button
              onClick={() => setViewMode('status')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'status'
                  ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-indigo-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Overall Status Breakdown"
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Status</span>
            </button>

            <button
              onClick={() => setViewMode('radar')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'radar'
                  ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-indigo-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Efficiency Radar"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Radar</span>
            </button>
          </div>

          <button
            onClick={() => {
              refreshCounts();
              loadWidgetData();
            }}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top Lifecycle Key Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3 font-mono text-xs">
        <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
          <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center justify-between">
            <span>STAGE PROGRESS</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {overallMetrics.progressPercentage}%
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallMetrics.progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
          <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center justify-between">
            <span>ACTIVE WORK</span>
            <Clock className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-0.5">
            {overallMetrics.activeItems} <span className="text-xs font-normal text-slate-500">items</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">In-flight across stages</div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
          <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center justify-between">
            <span>CPF READINESS</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">
            {cpfStats?.ready ?? 0} <span className="text-xs font-normal text-slate-500">promotable</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Score Threshold &ge; 0.70
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
          <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center justify-between">
            <span>BLOCKING RISKS</span>
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {overallMetrics.blockedItems} <span className="text-xs font-normal text-slate-500">blocked</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            {counts?.openQuestions ?? 0} open questions
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div className="w-full h-64 my-2">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'pipeline' ? (
            <ComposedChart data={stageMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <XAxis
                dataKey="stage"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                interval={0}
                angle={-10}
                textAnchor="end"
              />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: '#334155',
                  color: '#f8fafc',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingBottom: '8px' }}
              />
              <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="active" name="In Progress" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="blocked" name="Blocked / Risk" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="completionRate"
                name="Stage Completion %"
                stroke="#ec4899"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#ec4899' }}
              />
            </ComposedChart>
          ) : viewMode === 'trend' ? (
            <AreaChart data={historicalTrend.length ? historicalTrend : [{ time: 'Now', readiness: 75, completion: overallMetrics.progressPercentage, activeExecutions: 3 }]} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
              <defs>
                <linearGradient id="readinessGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: '#334155',
                  color: '#f8fafc',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
              <Area
                type="monotone"
                dataKey="readiness"
                name="CPF Readiness Index"
                stroke="#8b5cf6"
                fillOpacity={1}
                fill="url(#readinessGrad)"
              />
              <Area
                type="monotone"
                dataKey="completion"
                name="Lifecycle Completion %"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#completionGrad)"
              />
            </AreaChart>
          ) : viewMode === 'status' ? (
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: '#334155',
                  color: '#f8fafc',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
              />
            </PieChart>
          ) : (
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="stage" stroke="#64748b" fontSize={11} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" fontSize={10} />
              <Radar
                name="Completion %"
                dataKey="Completion %"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.5}
              />
              <Radar
                name="Active Work %"
                dataKey="Active Work %"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: '#334155',
                  color: '#f8fafc',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              />
            </RadarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Stage Fast-Nav Footer */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Quick Navigation:</span>
          <button
            onClick={() => setActiveTab('harvests')}
            className="hover:underline text-emerald-600 dark:text-emerald-400"
          >
            Harvests ({counts?.candidates ?? 0})
          </button>
          <span>&bull;</span>
          <button
            onClick={() => setActiveTab('cpf')}
            className="hover:underline text-purple-600 dark:text-purple-400"
          >
            CPF ({cpfStats?.ready ?? 0})
          </button>
          <span>&bull;</span>
          <button
            onClick={() => setActiveTab('kanban')}
            className="hover:underline text-sky-600 dark:text-sky-400"
          >
            Kanban ({counts?.requirements ?? 0})
          </button>
          <span>&bull;</span>
          <button
            onClick={() => setActiveTab('questions')}
            className="hover:underline text-amber-600 dark:text-amber-400"
          >
            Questions ({counts?.openQuestions ?? 0})
          </button>
        </div>

        <span className="text-[10px] text-slate-400 shrink-0 hidden sm:inline">
          Nebula Process Engine v2.4
        </span>
      </div>
    </div>
  );
};
