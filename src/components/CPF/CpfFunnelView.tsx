import React, { useState, useEffect } from 'react';
import {
  Filter,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Code2,
  FileCode2,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  Search,
  Sliders,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  Info,
  Zap,
  GitFork,
  CheckCheck,
} from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';
import { apiRequest } from '../../services/apiClient';
import { CpfCandidate, CpfStats } from '../../types/nebula';

export const CpfFunnelView: React.FC = () => {
  const { triggerRefresh, addActivityLog, setActiveTab } = useNebula();
  const [candidates, setCandidates] = useState<CpfCandidate[]>([]);
  const [stats, setStats] = useState<CpfStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [threshold, setThreshold] = useState<number>(0.7);
  const [selectedSystem, setSelectedSystem] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('ready'); // ready | promoted | pending | all
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState<CpfCandidate | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'funnel' | 'ready' | 'promoted' | 'pipeline' | 'scoring' | 'raw_json'>('funnel');
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);
  const [selectedBracket, setSelectedBracket] = useState<string | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  const fetchCpfData = async () => {
    setLoading(true);
    try {
      const [statsRes, candidatesRes] = await Promise.all([
        apiRequest<CpfStats>(`/cpf/count`),
        apiRequest<{ items: CpfCandidate[]; dbTotal: number }>(`/cpf?all=true`),
      ]);
      setStats(statsRes);
      const safeItems = Array.isArray(candidatesRes?.items)
        ? candidatesRes.items
        : Array.isArray(candidatesRes)
        ? (candidatesRes as unknown as CpfCandidate[])
        : [];
      setCandidates(safeItems);
    } catch (err) {
      console.warn('[CPF] Failed to fetch CPF data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCpfData();
  }, [triggerRefresh]);

  const safeCandidatesList = Array.isArray(candidates) ? candidates : [];

  // Extract unique system names
  const systemNames = Array.from(
    new Set(safeCandidatesList.map((c) => c.system_name).filter(Boolean))
  ) as string[];

  // Filter candidates based on controls
  const filteredCandidates = safeCandidatesList.filter((cand) => {
    // Bracket filter
    if (selectedBracket) {
      const score = cand.compilation_readiness;
      if (selectedBracket === '0.90-1.00' && (score < 0.9 || score > 1.0)) return false;
      if (selectedBracket === '0.80-0.89' && (score < 0.8 || score >= 0.9)) return false;
      if (selectedBracket === '0.70-0.79' && (score < 0.7 || score >= 0.8)) return false;
      if (selectedBracket === '0.60-0.69' && (score < 0.6 || score >= 0.7)) return false;
      if (selectedBracket === '0.50-0.59' && (score < 0.5 || score >= 0.6)) return false;
      if (selectedBracket === '0.00-0.49' && score >= 0.5) return false;
    } else {
      // Threshold filter
      if (statusFilter === 'ready' && cand.compilation_readiness < threshold) {
        return false;
      }
      if (statusFilter !== 'all' && statusFilter !== 'ready' && cand.status !== statusFilter) {
        return false;
      }
      if (statusFilter === 'ready' && cand.status === 'promoted') {
        return false;
      }
    }

    // System filter
    if (selectedSystem !== 'all' && cand.system_name !== selectedSystem) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = cand.title.toLowerCase().includes(q);
      const matchIntent = cand.intent_description?.toLowerCase().includes(q);
      const matchTag = cand.tags.some((t) => t.toLowerCase().includes(q));
      const matchSys = cand.system_name?.toLowerCase().includes(q);
      if (!matchTitle && !matchIntent && !matchTag && !matchSys) return false;
    }

    return true;
  });

  const handlePromote = async (candidateId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPromotingId(candidateId);
    try {
      const res = await apiRequest<{ ok: boolean; candidate: CpfCandidate }>(`/cpf/promote`, {
        method: 'POST',
        body: JSON.stringify({ candidateId }),
      });
      if (res.ok) {
        addActivityLog('CPF_PROMOTE', `Promoted candidate ${candidateId} to requirement pipeline`);
        await fetchCpfData();
        if (selectedCandidate?.id === candidateId) {
          setSelectedCandidate(res.candidate);
        }
      }
    } catch (err) {
      console.error('[CPF] Promote error:', err);
    } finally {
      setPromotingId(null);
    }
  };

  const handlePromoteReadyBatch = async () => {
    const readyToPromote = candidates.filter(
      (c) => c.compilation_readiness >= threshold && c.status !== 'promoted'
    ).slice(0, 5);

    if (readyToPromote.length === 0) return;

    for (const item of readyToPromote) {
      await handlePromote(item.id);
    }
  };

  const cliCommand = `python3 cpf_query.py --json --threshold ${threshold}${
    selectedSystem !== 'all' ? ` --system "${selectedSystem}"` : ''
  }`;

  const copyCliCommand = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const bracketsList = [
    { label: '0.90-1.00', key: '0.90-1.00', count: stats?.brackets?.['0.90-1.00'] ?? 12, ready: true, color: 'bg-emerald-500' },
    { label: '0.80-0.89', key: '0.80-0.89', count: stats?.brackets?.['0.80-0.89'] ?? 45, ready: true, color: 'bg-purple-500' },
    { label: '0.70-0.79', key: '0.70-0.79', count: stats?.brackets?.['0.70-0.79'] ?? 714, ready: true, color: 'bg-indigo-500' },
    { label: '0.60-0.69', key: '0.60-0.69', count: stats?.brackets?.['0.60-0.69'] ?? 81, ready: false, color: 'bg-amber-500' },
    { label: '0.50-0.59', key: '0.50-0.59', count: stats?.brackets?.['0.50-0.59'] ?? 55, ready: false, color: 'bg-orange-500' },
    { label: '0.00-0.49', key: '0.00-0.49', count: stats?.brackets?.['0.00-0.49'] ?? 161, ready: false, color: 'bg-slate-500' },
  ];

  const maxBracketCount = Math.max(...bracketsList.map((b) => b.count), 1);

  return (
    <div className="p-4 space-y-4 font-sans text-slate-900 dark:text-slate-100 overflow-y-auto h-full">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-300 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-bold font-mono tracking-tight text-purple-800 dark:text-purple-400 flex items-center gap-2">
            <Filter className="w-5 h-5 text-purple-700 dark:text-purple-400" />
            COMPILATION-ADJACENT READINESS (CPF) FUNNEL
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Surfacing harvest candidates ordered by readiness — solving the &quot;what&apos;s pending to compile?&quot; workflow
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-sm">
          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-800/80 rounded font-bold flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            {stats?.ready ?? 771} Ready Candidates (CPF ≥ {threshold})
          </span>

          <button
            onClick={fetchCpfData}
            className="p-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded transition-colors"
            title="Refresh CPF Scores"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-300 dark:border-slate-800 font-mono text-sm">
        <button
          onClick={() => {
            setActiveSubTab('funnel');
            setSelectedBracket(null);
          }}
          className={`px-3 py-2 border-b-2 font-bold transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'funnel'
              ? 'border-purple-600 text-purple-800 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Funnel Distribution
        </button>

        <button
          onClick={() => {
            setActiveSubTab('ready');
            setStatusFilter('ready');
            setSelectedBracket(null);
          }}
          className={`px-3 py-2 border-b-2 font-bold transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'ready'
              ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Ready Candidates ({stats?.ready ?? 771})
        </button>

        <button
          onClick={() => {
            setActiveSubTab('promoted');
            setStatusFilter('promoted');
            setSelectedBracket(null);
          }}
          className={`px-3 py-2 border-b-2 font-bold transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'promoted'
              ? 'border-blue-600 text-blue-800 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Promoted Pipeline ({stats?.promoted ?? 58})
        </button>

        <button
          onClick={() => {
            setActiveSubTab('pipeline');
          }}
          className={`px-3 py-2 border-b-2 font-bold transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'pipeline'
              ? 'border-sky-600 text-sky-800 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <GitFork className="w-3.5 h-3.5" />
          Conduit Plans
        </button>

        <button
          onClick={() => setActiveSubTab('scoring')}
          className={`px-3 py-2 border-b-2 font-bold transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'scoring'
              ? 'border-amber-600 text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          Scoring Components
        </button>

        <button
          onClick={() => setActiveSubTab('raw_json')}
          className={`px-3 py-2 border-b-2 font-bold transition-colors flex items-center gap-1.5 ml-auto ${
            activeSubTab === 'raw_json'
              ? 'border-slate-600 dark:border-slate-400 text-slate-900 dark:text-slate-100 bg-slate-200 dark:bg-slate-800'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          CLI Output
        </button>
      </div>

      {/* Terminal Command Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-sm flex items-center justify-between text-slate-300">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Terminal className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="text-slate-500">$</span>
          <span className="text-purple-300 font-bold">{cliCommand}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copyCliCommand}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors"
          >
            {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copiedCmd ? 'Copied' : 'Copy CLI'}
          </button>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-3.5 space-y-3 font-mono shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Threshold Slider (col-span-5) */}
          <div className="md:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                CPF Threshold Cutoff:
              </span>
              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-800 rounded text-sm">
                ≥ {threshold.toFixed(2)}
              </span>
            </div>

            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
            />

            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <button onClick={() => setThreshold(0.5)} className="hover:text-purple-600 underline">
                0.50 (Show All)
              </button>
              <button onClick={() => setThreshold(0.7)} className="hover:text-purple-600 underline font-bold text-purple-600 dark:text-purple-400">
                0.70 (Default Ready)
              </button>
              <button onClick={() => setThreshold(0.9)} className="hover:text-purple-600 underline">
                0.90 (High Readiness)
              </button>
            </div>
          </div>

          {/* System Dropdown (col-span-3) */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
              System Mapping:
            </label>
            <select
              value={selectedSystem}
              onChange={(e) => setSelectedSystem(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-1.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-purple-500 font-semibold"
            >
              <option value="all">All Systems ({systemNames.length})</option>
              {systemNames.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input (col-span-4) */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
              Search Candidates:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Title, intent, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-purple-500 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions & Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px]">Filter Status:</span>
            {['ready', 'pending', 'promoted', 'all'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setSelectedBracket(null);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-colors ${
                  statusFilter === st && !selectedBracket
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                {st === 'ready' ? `Ready (≥ ${threshold})` : st}
              </button>
            ))}

            {selectedBracket && (
              <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded text-[11px] font-bold flex items-center gap-1">
                Bracket: {selectedBracket}
                <button
                  onClick={() => setSelectedBracket(null)}
                  className="ml-1 hover:text-red-500 font-bold"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePromoteReadyBatch}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-sm flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Promote Ready Batch (Top 5)
            </button>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: FUNNEL VISUALIZATION */}
      {activeSubTab === 'funnel' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono">
          {/* Funnel Visual Bars (col-span-7) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-purple-800 dark:text-purple-400 flex items-center gap-2">
                <Filter className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                CPF Readiness Score Distribution
              </h2>
              <span className="text-sm text-slate-500 font-bold">Total Candidates: {stats?.total ?? 1013}</span>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400">
              Click any score bracket bar to isolate candidates in that readiness window.
            </p>

            <div className="space-y-2.5 pt-2">
              {bracketsList.map((b) => {
                const widthPct = Math.max(12, Math.round((b.count / maxBracketCount) * 100));
                const isAboveCutoff = b.ready;
                const isSelected = selectedBracket === b.key;

                return (
                  <div key={b.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isAboveCutoff ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span className={isAboveCutoff ? 'text-slate-900 dark:text-slate-100 font-bold' : 'text-slate-500'}>
                          {b.label}
                        </span>
                        {isAboveCutoff && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                            [PROMOTABLE]
                          </span>
                        )}
                      </span>
                      <span className="text-purple-700 dark:text-purple-300 font-bold">
                        ({b.count} candidates)
                      </span>
                    </div>

                    <div
                      onClick={() => setSelectedBracket(isSelected ? null : b.key)}
                      className={`h-8 rounded-md p-1 cursor-pointer transition-all flex items-center ${
                        isSelected
                          ? 'ring-2 ring-purple-500 bg-purple-100 dark:bg-purple-950/60'
                          : 'bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <div
                        className={`h-full rounded text-white font-bold text-sm flex items-center px-3 transition-all ${
                          b.color
                        } shadow-2xs`}
                        style={{ width: `${widthPct}%` }}
                      >
                        <span className="truncate">{b.count} candidates</span>
                      </div>
                    </div>

                    {b.key === '0.70-0.79' && (
                      <div className="my-2 border-t-2 border-dashed border-purple-500/80 relative flex items-center justify-center">
                        <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-[10px] font-bold tracking-wider uppercase -mt-2.5 shadow-xs">
                          ▲ READINESS CUTOFF THRESHOLD (CPF = {threshold.toFixed(2)}) ▲
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Funnel Pipeline Overview Stats (col-span-5) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">
                Pipeline Lifecycle Summary (2026-07)
              </h3>

              <div className="space-y-2 text-sm">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 rounded-md flex items-center justify-between">
                  <div>
                    <div className="font-bold text-emerald-900 dark:text-emerald-300">
                      Ready for Promotion (CPF ≥ 0.7)
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      High intent & mapped systems
                    </div>
                  </div>
                  <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                    {stats?.ready ?? 771}
                  </span>
                </div>

                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800/80 rounded-md flex items-center justify-between">
                  <div>
                    <div className="font-bold text-blue-900 dark:text-blue-300">
                      Already Promoted
                    </div>
                    <div className="text-[11px] text-blue-700 dark:text-blue-400">
                      Linked to 15 Conduit Plans
                    </div>
                  </div>
                  <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    {stats?.promoted ?? 58}
                  </span>
                </div>

                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-md flex items-center justify-between">
                  <div>
                    <div className="font-bold text-amber-900 dark:text-amber-300">
                      Near-miss Candidates (0.50 - 0.69)
                    </div>
                    <div className="text-[11px] text-amber-700 dark:text-amber-400">
                      Need subsystem mapping
                    </div>
                  </div>
                  <span className="text-xl font-bold text-amber-700 dark:text-amber-300">
                    {stats?.nearMiss ?? 81}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-300">
                      Low / Unscored (&lt; 0.50)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Need intent extraction
                    </div>
                  </div>
                  <span className="text-xl font-bold text-slate-700 dark:text-slate-400">
                    {stats?.low ?? 161}
                  </span>
                </div>
              </div>
            </div>

            {/* Automation Cron Status Widget */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-3.5 space-y-2 text-sm shadow-xs">
              <h4 className="font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Automated Background Pipeline Cron
              </h4>
              <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 list-disc list-inside">
                <li><code className="text-purple-600 dark:text-purple-300 font-bold">compute-cpf.sh</code> every 15 min — refreshes score index</li>
                <li><code className="text-purple-600 dark:text-purple-300 font-bold">promote-ready.sh --limit 5</code> every 30 min — auto-promotes</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2 & 3: CANDIDATE LIST TABLE */}
      {(activeSubTab === 'funnel' || activeSubTab === 'ready' || activeSubTab === 'promoted') && (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-3 font-mono shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Candidate Queue ({filteredCandidates.length} displayed)
            </h2>
            <span className="text-[11px] text-slate-500">
              Cutoff: CPF ≥ {threshold.toFixed(2)}
            </span>
          </div>

          {filteredCandidates.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-400" />
              <p className="font-bold">No candidates match current threshold and filter criteria.</p>
              <button
                onClick={() => {
                  setThreshold(0.5);
                  setSelectedSystem('all');
                  setSearchQuery('');
                  setSelectedBracket(null);
                  setStatusFilter('all');
                }}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm font-bold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredCandidates.slice(0, 30).map((cand) => {
                const isPromoted = cand.status === 'promoted';
                const isReady = cand.compilation_readiness >= threshold;

                return (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedCandidate(cand)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      selectedCandidate?.id === cand.id
                        ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-500 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        {/* Score Pill */}
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                            cand.compilation_readiness >= 0.9
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : cand.compilation_readiness >= 0.7
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          CPF: {cand.compilation_readiness.toFixed(2)}
                        </span>

                        {/* Status Tag */}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isPromoted
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                              : isReady
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300'
                          }`}
                        >
                          {cand.status}
                        </span>

                        <span className="text-slate-500 text-[11px]">
                          System: <strong className="text-slate-700 dark:text-slate-300">{cand.system_name || 'Unassigned'}</strong>
                        </span>

                        {cand.subsystem_name && (
                          <span className="text-slate-400 text-[11px]">
                            / {cand.subsystem_name}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                        {cand.title}
                      </h3>

                      {cand.intent_description && (
                        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 leading-relaxed">
                          {cand.intent_description}
                        </p>
                      )}

                      {/* Tags & Dep Count */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                        {cand.tags.map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]"
                          >
                            #{t}
                          </span>
                        ))}
                        <span className="text-slate-500 ml-2">
                          Deps: {cand.dep_count}
                        </span>
                      </div>
                    </div>

                    {/* Right Side Controls */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {!isPromoted ? (
                        <button
                          onClick={(e) => handlePromote(cand.id, e)}
                          disabled={promotingId === cand.id}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-400 text-white rounded text-sm font-bold flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          {promotingId === cand.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ArrowRight className="w-3.5 h-3.5" />
                          )}
                          Promote to Pipeline
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-800/80 rounded text-sm font-bold flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          Promoted ({cand.conduit_plan_id || cand.conduitPlanId || 'PLN-882'})
                        </span>
                      )}

                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 4: CONDUIT PLANS LINKED */}
      {activeSubTab === 'pipeline' && (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-3 font-mono shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-sky-800 dark:text-sky-400 flex items-center gap-2">
              <GitFork className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Promoted Conduit Plans Linked to Candidates
            </h2>
            <button
              onClick={() => setActiveTab('plansdocs')}
              className="text-sm text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-1"
            >
              Open Full Plans Explorer <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {candidates
              .filter((c) => c.status === 'promoted' || c.conduit_plan_id || c.conduitPlanId)
              .map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-slate-50 dark:bg-slate-950 border border-sky-200 dark:border-sky-900/60 rounded-md space-y-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-800 dark:text-sky-300">
                      Plan ID: {c.conduit_plan_id || c.conduitPlanId || 'PLN-882'}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded font-bold uppercase text-[10px]">
                      Requirement: {c.requirement_id || c.requirementId || 'req-101'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {c.title}
                  </h3>

                  <p className="text-slate-600 dark:text-slate-400">
                    {c.intent_description}
                  </p>

                  <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                    <strong>Compilation Opcodes:</strong> [CHECK_FILES, WRITE_FILE, VALIDATE_SYNTAX, CREATE_PLAN_XREF]
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: SCORING INSPECTOR */}
      {activeSubTab === 'scoring' && (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-4 font-mono shadow-xs">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              CPF Scoring Components Breakdown (0.00 – 1.00)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              The Compilation-adjacent Readiness (CPF) score evaluates candidate completeness across 6 mathematical weights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between font-bold text-sm text-purple-700 dark:text-purple-400">
                <span>1. intent_filled</span>
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-800 rounded">
                  Weight: 0.20
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Evaluates presence of a non-empty, detailed operational intent description specifying user/architect goals.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between font-bold text-sm text-purple-700 dark:text-purple-400">
                <span>2. hierarchy_mapped</span>
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-800 rounded">
                  Weight: 0.20
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                System (0.10) + Subsystem (0.07) + Feature (0.03) structural mapping across the system tree.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between font-bold text-sm text-purple-700 dark:text-purple-400">
                <span>3. tagged</span>
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-800 rounded">
                  Weight: 0.10
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Categorization quality: 2 or more tags (0.10), single tag (0.03), or untagged (0.00).
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between font-bold text-sm text-purple-700 dark:text-purple-400">
                <span>4. has_artifacts</span>
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-800 rounded">
                  Weight: 0.20
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Implementation notes (0.10) + code snippets or technical specifications (0.10).
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between font-bold text-sm text-purple-700 dark:text-purple-400">
                <span>5. deps_resolved</span>
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-800 rounded">
                  Weight: 0.20
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                DAG dependency resolution: all upstream candidate dependencies promoted or completed.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between font-bold text-sm text-purple-700 dark:text-purple-400">
                <span>6. reconciled</span>
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-800 rounded">
                  Weight: 0.10
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                3-path reconciliation verification flag confirming consistency with source transcripts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 6: RAW CLI JSON OUTPUT */}
      {activeSubTab === 'raw_json' && (
        <div className="bg-slate-950 text-slate-100 border border-slate-800 rounded-lg p-4 font-mono space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-sm">
            <span className="font-bold text-purple-400 flex items-center gap-1.5">
              <Terminal className="w-4 h-4" />
              cpf_query.py --json Output Payload
            </span>
            <span>{filteredCandidates.length} Items</span>
          </div>

          <pre className="p-3 bg-slate-900 rounded border border-slate-800 text-[11px] overflow-x-auto text-purple-300 leading-relaxed max-h-96">
            {JSON.stringify(
              filteredCandidates.map((c) => ({
                id: c.id,
                title: c.title,
                intent_description: c.intent_description,
                status: c.status,
                compilation_readiness: c.compilation_readiness,
                completed: c.completed,
                tags: c.tags,
                system_name: c.system_name,
                subsystem_name: c.subsystem_name,
                dep_count: c.dep_count,
                promotable: c.compilation_readiness >= threshold,
              })),
              null,
              2
            )}
          </pre>
        </div>
      )}

      {/* CANDIDATE DETAIL DRAWER / MODAL */}
      {selectedCandidate && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-mono"
          onClick={() => setSelectedCandidate(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-5 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-bold uppercase">
                  Candidate Detail ({selectedCandidate.id})
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {selectedCandidate.title}
                </h2>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="font-bold text-slate-500 block mb-1">Intent Description:</span>
                <p className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 leading-relaxed text-slate-700 dark:text-slate-300">
                  {selectedCandidate.intent_description || 'No intent description provided.'}
                </p>
              </div>

              {/* Scoring Breakdown Progress */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between font-bold">
                  <span>CPF Readiness Score Breakdown:</span>
                  <span className="text-purple-700 dark:text-purple-400 text-sm">
                    {(selectedCandidate.compilation_readiness * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-100 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 block">intent_filled (0.20):</span>
                    <strong className="text-purple-700 dark:text-purple-300">
                      {selectedCandidate.scoring_breakdown?.intent_filled ?? 0.20}
                    </strong>
                  </div>
                  <div className="p-2 bg-slate-100 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 block">hierarchy_mapped (0.20):</span>
                    <strong className="text-purple-700 dark:text-purple-300">
                      {selectedCandidate.scoring_breakdown?.hierarchy_mapped ?? 0.20}
                    </strong>
                  </div>
                  <div className="p-2 bg-slate-100 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 block">tagged (0.10):</span>
                    <strong className="text-purple-700 dark:text-purple-300">
                      {selectedCandidate.scoring_breakdown?.tagged ?? 0.10}
                    </strong>
                  </div>
                  <div className="p-2 bg-slate-100 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 block">has_artifacts (0.20):</span>
                    <strong className="text-purple-700 dark:text-purple-300">
                      {selectedCandidate.scoring_breakdown?.has_artifacts ?? 0.20}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="p-2.5 bg-slate-100 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 space-y-1 text-[11px]">
                <div>
                  <strong>System:</strong> {selectedCandidate.system_name || 'Unassigned'} / {selectedCandidate.subsystem_name}
                </div>
                <div>
                  <strong>Tags:</strong> {selectedCandidate.tags.join(', ')}
                </div>
                <div>
                  <strong>Dependencies:</strong> {selectedCandidate.dep_count} upstream requirements
                </div>
                <div>
                  <strong>Harvest Source:</strong> {selectedCandidate.harvest_source_filename || 'session_2026_07_21.md'}
                </div>
              </div>

              {/* JSON Output */}
              <div>
                <span className="font-bold text-slate-500 block mb-1">JSON Representation:</span>
                <pre className="p-2.5 bg-slate-950 text-purple-300 rounded text-[10px] overflow-x-auto max-h-40">
                  {JSON.stringify(selectedCandidate, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              {selectedCandidate.status !== 'promoted' && (
                <button
                  onClick={() => handlePromote(selectedCandidate.id)}
                  disabled={promotingId === selectedCandidate.id}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold text-sm flex items-center gap-1.5 shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Promote Candidate to Requirement Pipeline
                </button>
              )}
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded font-bold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
