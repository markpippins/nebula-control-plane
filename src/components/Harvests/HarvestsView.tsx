import React, { useEffect, useMemo, useState } from 'react';
import {
  Wheat,
  Sparkles,
  CheckCircle2,
  FileText,
  Tag,
  ArrowRight,
  TrendingUp,
  Search,
  Code2,
  Compass,
  Rocket,
  ChevronDown,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';
import { apiRequest } from '../../services/apiClient';
import { Harvest, HarvestCandidate } from '../../types/nebula';

// Per-block transcript turn from GET /api/harvests/:id/transcript. Each block
// is the real turn source: it carries its own provenance.role (user|assistant).
interface TranscriptTurn {
  turn_index: number;
  role: string | null;
  block_type: string | null;
  content: string | null;
  items: string[] | null;
  seg_index: number | null;
}

const ROLE_LABEL = (role: string | null | undefined): string => {
  if (role === 'user') return 'User';
  if (role === 'assistant') return 'Assistant';
  return 'Turn';
};

const turnToText = (t: TranscriptTurn): string => {
  if (t.block_type === 'list' && t.items) return t.items.join('\n');
  if (t.block_type === 'separator') return '---';
  return t.content || '';
};

export const HarvestsView: React.FC = () => {
  const { triggerRefresh, refreshCounts } = useNebula();
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [candidates, setCandidates] = useState<HarvestCandidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'candidates' | 'transcripts'>('candidates');

  // Discover state
  const [discovering, setDiscovering] = useState<boolean>(false);

  // Spawn Plan state
  const [spawningCandId, setSpawningCandId] = useState<string | null>(null);
  const [spawnTitle, setSpawnTitle] = useState('');

  // Transcript viewer state (per-block turns from /harvests/:id/transcript)
  const [viewingHarvest, setViewingHarvest] = useState<Harvest | null>(null);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [turnsLoading, setTurnsLoading] = useState(false);
  const [turnsError, setTurnsError] = useState<string | null>(null);
  const [turnSearch, setTurnSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'assistant'>('all');
  const [collapsedSegs, setCollapsedSegs] = useState<Set<number>>(new Set());

  const loadData = async () => {
    setLoading(true);
    try {
      const [hRes, cRes] = await Promise.all([
        apiRequest<{ items: Harvest[] } | Harvest[]>('/harvests'),
        apiRequest<{ items: HarvestCandidate[] } | HarvestCandidate[]>('/harvest-candidates'),
      ]);
      const safeH = Array.isArray(hRes)
        ? hRes
        : Array.isArray((hRes as any)?.items)
        ? (hRes as any).items
        : [];
      const safeC = Array.isArray(cRes)
        ? cRes
        : Array.isArray((cRes as any)?.items)
        ? (cRes as any).items
        : [];
      setHarvests(safeH);
      setCandidates(safeC);
    } catch (err) {
      console.warn('[HarvestsView] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [triggerRefresh]);

  const openTranscript = async (h: Harvest) => {
    setViewingHarvest(h);
    setTurns([]);
    setTurnSearch('');
    setRoleFilter('all');
    setCollapsedSegs(new Set());
    setTurnsError(null);
    setTurnsLoading(true);
    try {
      const res = await apiRequest<{ units?: TranscriptTurn[] }>(`/harvests/${h.id}/transcript`);
      setTurns(Array.isArray(res?.units) ? res.units : []);
    } catch (err: any) {
      setTurnsError(err?.message || 'Failed to load transcript');
    } finally {
      setTurnsLoading(false);
    }
  };

  const closeTranscript = () => {
    setViewingHarvest(null);
    setTurns([]);
    setTurnSearch('');
  };

  // Filtered turns: role filter + content search (block content only —
  // the auto-generated arc heading was retired as an unreliable label).
  const visibleTurns = useMemo(() => {
    const q = turnSearch.trim().toLowerCase();
    return turns.filter((t) => {
      if (roleFilter !== 'all' && (t.role || 'unknown') !== roleFilter) return false;
      if (q && !turnToText(t).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [turns, turnSearch, roleFilter]);

  const userTurnCount = useMemo(() => turns.filter((t) => t.role === 'user').length, [turns]);
  const assistantTurnCount = useMemo(() => turns.filter((t) => t.role === 'assistant').length, [turns]);

  const toggleSeg = (seg: number) => {
    setCollapsedSegs((prev) => {
      const next = new Set(prev);
      if (next.has(seg)) next.delete(seg);
      else next.add(seg);
      return next;
    });
  };

  const handlePromoteCandidate = async (candId: string) => {
    try {
      await apiRequest(`/cpf/promote`, {
        method: 'POST',
        body: JSON.stringify({ candidateId: candId }),
      });
      loadData();
      refreshCounts();
    } catch (err: any) {
      alert(`Promotion failed: ${err.message}`);
    }
  };

  // Trigger Candidate Discovery (`POST /api/harvest-candidates/discover`)
  const handleDiscoverCandidates = async () => {
    setDiscovering(true);
    try {
      const res = await apiRequest<{ discovered: HarvestCandidate[] }>('/harvest-candidates/discover', {
        method: 'POST',
        body: JSON.stringify({ scope: 'FULL' }),
      });
      alert(`Candidate discovery complete! Found ${res?.discovered?.length || 0} candidate(s).`);
      loadData();
      refreshCounts();
    } catch (err: any) {
      alert(`Discovery failed: ${err.message}`);
    } finally {
      setDiscovering(false);
    }
  };

  // Spawn Plan directly from Candidate (`POST /api/harvest-candidates/:id/spawn-plan`)
  const handleSpawnPlan = async (candId: string) => {
    try {
      const res = await apiRequest<any>(`/harvest-candidates/${candId}/spawn-plan`, {
        method: 'POST',
        body: JSON.stringify({ title: spawnTitle }),
      });
      alert(`Plan successfully spawned! Plan ID: ${res?.plan?.id || res?.id || 'new-plan'}`);
      setSpawningCandId(null);
      setSpawnTitle('');
      loadData();
      refreshCounts();
    } catch (err: any) {
      alert(`Spawn plan failed: ${err.message}`);
    }
  };

  return (
    <div className="p-4 space-y-4 font-sans text-slate-900 dark:text-slate-100 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-bold font-mono tracking-tight text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <Wheat className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            HARVESTS & CPF CANDIDATES
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Docklang conversation transcripts & candidate compilation readiness framework (CPF)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Discovery Trigger Button */}
          <button
            onClick={handleDiscoverCandidates}
            disabled={discovering}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-sm font-mono font-semibold transition-colors shadow-xs"
          >
            <Compass className={`w-4 h-4 ${discovering ? 'animate-spin' : ''}`} />
            {discovering ? 'Discovering...' : 'Discover Candidates (`POST /discover`)'}
          </button>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-1 rounded font-mono text-sm shadow-xs">
            <button
              onClick={() => setActiveTab('candidates')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'candidates'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Candidates ({candidates.length})
            </button>
            <button
              onClick={() => setActiveTab('transcripts')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'transcripts'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Harvest Transcripts ({harvests.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'candidates' ? (
        <div className="space-y-3 font-mono text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {candidates.map((cand) => {
              const isPromotable = cand.compilationReadiness >= 0.7;

              return (
                <div
                  key={cand.id}
                  className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-3.5 space-y-2.5 shadow-xs hover:border-slate-400 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-bold">
                      {cand.id}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">CPF Score:</span>
                      <span
                        className={`font-bold ${
                          cand.compilationReadiness >= 0.8
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : cand.compilationReadiness >= 0.6
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {(cand.compilationReadiness * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{cand.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{cand.intentDescription}</p>

                  {/* Tags */}
                  <div className="flex gap-1.5 flex-wrap">
                    {cand.tags.map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700/80"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Direct Spawn Plan Form toggle */}
                  {spawningCandId === cand.id && (
                    <div className="p-2.5 bg-blue-50 dark:bg-slate-950 rounded border border-blue-200 dark:border-blue-900 space-y-2">
                      <label className="block text-xs font-bold text-blue-900 dark:text-blue-300">
                        Custom Plan Title (Optional)
                      </label>
                      <input
                        type="text"
                        value={spawnTitle}
                        onChange={(e) => setSpawnTitle(e.target.value)}
                        placeholder={cand.title}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded p-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSpawningCandId(null)}
                          className="px-2 py-1 text-xs bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 rounded font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSpawnPlan(cand.id)}
                          className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded font-semibold flex items-center gap-1"
                        >
                          <Rocket className="w-3 h-3" />
                          Confirm Spawn Plan
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Promotion / Spawn Action */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500">
                      Status: <strong className="text-slate-800 dark:text-slate-300">{cand.status || 'new'}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSpawningCandId(cand.id);
                          setSpawnTitle(cand.title);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-sky-100 dark:bg-sky-950 hover:bg-sky-200 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 rounded text-[11px] font-bold transition-colors"
                      >
                        <Rocket className="w-3.5 h-3.5" />
                        Spawn Plan (`POST /spawn-plan`)
                      </button>

                      {cand.completed ? (
                        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Promoted
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePromoteCandidate(cand.id)}
                          disabled={!isPromotable}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                            isPromotable
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Promote to Plan
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Transcripts tab */
        <div className="space-y-3 font-mono text-sm">
          {harvests.map((h) => (
            <div
              key={h.id}
              onClick={() => openTranscript(h)}
              className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-2 shadow-xs hover:border-emerald-500 dark:hover:border-emerald-600 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{h.sourceFilename}</span>
                </div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-emerald-800 dark:text-emerald-300 border border-slate-200 dark:border-slate-700 font-semibold">
                  Model: {h.model}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 py-2 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-2 rounded border border-slate-200 dark:border-slate-800">
                <div>
                  Turns: <span className="text-slate-800 dark:text-slate-200 font-bold">{h.turns || 0}</span>
                </div>
                <div>
                  Code Blocks: <span className="text-slate-800 dark:text-slate-200 font-bold">{h.codeBlocks || 0}</span>
                </div>
                <div>
                  Density: <span className="text-slate-800 dark:text-slate-200 font-bold">{h.blocksPerTurn || 0}</span>
                </div>
                <div>
                  User Turns: <span className="text-slate-800 dark:text-slate-200 font-bold">{h.userTurns || 0}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>
                  Source Path: <span className="text-slate-700 dark:text-slate-300 font-mono">{h.sourcePath}</span>
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                  View Transcript <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingHarvest && (
        <TranscriptViewer
          harvest={viewingHarvest}
          turns={turns}
          visibleTurns={visibleTurns}
          loading={turnsLoading}
          error={turnsError}
          search={turnSearch}
          onSearch={setTurnSearch}
          roleFilter={roleFilter}
          onRoleFilter={setRoleFilter}
          userCount={userTurnCount}
          assistantCount={assistantTurnCount}
          collapsedSegs={collapsedSegs}
          onToggleSeg={toggleSeg}
          onClose={closeTranscript}
        />
      )}
    </div>
  );
};

// ── Transcript viewer overlay ─────────────────────────────────────────
// One card per BLOCK turn with User/Assistant headers; arcs (seg_index)
// render as collapsible ranges. No arc heading text — seg boundaries are
// structure, not labels (the auto-generated headings repeated across turns
// and never matched content reliably).

interface TranscriptViewerProps {
  harvest: Harvest;
  turns: TranscriptTurn[];
  visibleTurns: TranscriptTurn[];
  loading: boolean;
  error: string | null;
  search: string;
  onSearch: (v: string) => void;
  roleFilter: 'all' | 'user' | 'assistant';
  onRoleFilter: (v: 'all' | 'user' | 'assistant') => void;
  userCount: number;
  assistantCount: number;
  collapsedSegs: Set<number>;
  onToggleSeg: (seg: number) => void;
  onClose: () => void;
}

const filterBtn = (active: boolean) =>
  `px-2.5 py-1 rounded text-[11px] font-bold border transition-colors ${
    active
      ? 'bg-emerald-600 text-white border-emerald-600'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-400'
  }`;

const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  harvest,
  turns,
  visibleTurns,
  loading,
  error,
  search,
  onSearch,
  roleFilter,
  onRoleFilter,
  userCount,
  assistantCount,
  collapsedSegs,
  onToggleSeg,
  onClose,
}) => {
  // Render a contiguous run of turns as a collapsible arc section when they
  // share a seg_index; runs before the first segment render bare.
  const sections: Array<{ seg: number | null; items: TranscriptTurn[] }> = [];
  for (const t of visibleTurns) {
    const seg = t.seg_index;
    const last = sections[sections.length - 1];
    if (last && last.seg === seg) last.items.push(t);
    else sections.push({ seg, items: [t] });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-50 dark:bg-slate-950 w-full max-w-5xl h-[90vh] rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="min-w-0">
            <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              {harvest.sourceFilename}
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {turns.length} turns · {userCount} user / {assistantCount} assistant
              {search || roleFilter !== 'all' ? ` · showing ${visibleTurns.length}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors flex-shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search turn content..."
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onRoleFilter('all')} className={filterBtn(roleFilter === 'all')}>
              All ({turns.length})
            </button>
            <button onClick={() => onRoleFilter('user')} className={filterBtn(roleFilter === 'user')}>
              User ({userCount})
            </button>
            <button onClick={() => onRoleFilter('assistant')} className={filterBtn(roleFilter === 'assistant')}>
              Assistant ({assistantCount})
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500 dark:text-slate-400 text-sm font-mono">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading transcript...
            </div>
          )}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded p-3 text-xs text-red-700 dark:text-red-300 font-mono">
              {error}
            </div>
          )}
          {!loading && !error && visibleTurns.length === 0 && (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-sm font-mono">
              {turns.length === 0 ? 'No transcript turns available for this harvest.' : 'No turns match the current filters.'}
            </div>
          )}

          {!loading &&
            !error &&
            sections.map((s, si) => {
              const isCollapsed = s.seg !== null && collapsedSegs.has(s.seg);
              const sectionBody = (
                <div className="space-y-1">
                  {s.items.map((t) => (
                    <TurnCard key={t.turn_index} turn={t} />
                  ))}
                </div>
              );
              if (s.seg === null) {
                return <div key={`s${si}`}>{sectionBody}</div>;
              }
              return (
                <div key={`s${si}`} className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => onToggleSeg(s.seg!)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span className="text-[10px] font-bold font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Arc {s.seg + 1} · {s.items.length} turns
                    </span>
                  </button>
                  {!isCollapsed && <div className="p-2">{sectionBody}</div>}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

const TurnCard: React.FC<{ turn: TranscriptTurn }> = ({ turn }) => {
  const isUser = turn.role === 'user';
  const isAssistant = turn.role === 'assistant';
  const text = turnToText(turn);
  if (!text.trim()) return null;

  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        isUser
          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900'
          : isAssistant
          ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900'
          : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-[10px] font-bold font-mono uppercase tracking-wider ${
            isUser
              ? 'text-emerald-700 dark:text-emerald-400'
              : isAssistant
              ? 'text-sky-700 dark:text-sky-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {ROLE_LABEL(turn.role)} · #{turn.turn_index}
        </span>
        {turn.block_type && turn.block_type !== 'paragraph' && (
          <span className="text-[9px] px-1 py-0.5 rounded font-medium uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {turn.block_type}
          </span>
        )}
      </div>
      <pre className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words font-sans leading-relaxed">
        {text}
      </pre>
    </div>
  );
};
