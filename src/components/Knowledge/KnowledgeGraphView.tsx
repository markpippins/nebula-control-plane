import React, { useEffect, useState } from 'react';
import { GitFork, Search, Sparkles, Layers, FileCode } from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';
import { apiRequest } from '../../services/apiClient';
import { KnowledgeEntity } from '../../types/nebula';

export const KnowledgeGraphView: React.FC = () => {
  const { triggerRefresh } = useNebula();
  const [entities, setEntities] = useState<KnowledgeEntity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchVector, setSearchVector] = useState<string>('0.01, -0.02, 0.05');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ items: KnowledgeEntity[] }>('/knowledge/entities');
      setEntities(res.items || []);
    } catch (err) {
      console.warn('[KnowledgeGraphView] Error loading entities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [triggerRefresh]);

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create mock 768-dim float vector
      const vector = new Array(768).fill(0).map(() => (Math.random() - 0.5) * 0.1);
      const res = await apiRequest<any>('/search/semantic', {
        method: 'POST',
        body: JSON.stringify({
          queryEmbedding: vector,
          limit: 10,
        }),
      });
      setSearchResults(res.results || []);
    } catch (err: any) {
      alert(`Semantic search failed: ${err.message}`);
    }
  };

  return (
    <div className="p-4 space-y-4 font-sans text-slate-900 dark:text-slate-100 overflow-y-auto h-full font-mono text-xs">
      <div className="border-b border-slate-300 dark:border-slate-800 pb-3">
        <h1 className="text-lg font-bold tracking-tight text-purple-700 dark:text-purple-400 flex items-center gap-2">
          <GitFork className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          KNOWLEDGE GRAPH & SEMANTIC VECTOR INDEX
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          768-dim nomic-embed-text vector similarity search & entity graph
        </p>
      </div>

      {/* Vector Search Tester */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-3 shadow-xs">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          Test 768-Dim Semantic Similarity Search
        </h2>

        <form onSubmit={handleSemanticSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter query or vector prompt..."
            value={searchVector}
            onChange={(e) => setSearchVector(e.target.value)}
            className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none focus:border-purple-500 font-semibold"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold shadow-2xs"
          >
            Run Semantic Search
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-slate-600 dark:text-slate-400 font-bold">Similarity Results:</h3>
            {searchResults.map((r, i) => (
              <div
                key={i}
                className="p-2 bg-slate-50 dark:bg-slate-950 rounded border border-purple-300 dark:border-purple-900/60 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-purple-800 dark:text-purple-300">{r.name}</div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">{r.description}</div>
                </div>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  Score: {(r.similarity * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Entity Explorer */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
          Knowledge Graph Entities ({entities.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {entities.map((ent) => (
            <div
              key={ent.id}
              className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-3 space-y-2 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-bold uppercase">
                  {ent.section}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">{ent.status}</span>
              </div>

              <h3 className="font-bold text-slate-900 dark:text-slate-200 text-sm">{ent.name}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{ent.descriptionAbbr}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
