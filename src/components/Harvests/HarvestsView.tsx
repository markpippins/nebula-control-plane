import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';
import { apiRequest } from '../../services/apiClient';
import { Harvest, HarvestCandidate } from '../../types/nebula';

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
            <div key={h.id} className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-2 shadow-xs">
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

              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Source Path: <span className="text-slate-700 dark:text-slate-300 font-mono">{h.sourcePath}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
