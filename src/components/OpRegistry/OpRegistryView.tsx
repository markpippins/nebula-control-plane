import React, { useEffect, useState } from 'react';
import { Code2, GitFork, AlertOctagon, CheckCircle2, Plus } from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';
import { apiRequest } from '../../services/apiClient';
import { OpRegistryEntry } from '../../types/nebula';

export const OpRegistryView: React.FC = () => {
  const { triggerRefresh } = useNebula();
  const [entries, setEntries] = useState<OpRegistryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ items: OpRegistryEntry[] }>('/op-registry');
      setEntries(res.items || []);
    } catch (err) {
      console.warn('[OpRegistryView] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [triggerRefresh]);

  return (
    <div className="p-4 space-y-4 font-sans text-slate-900 dark:text-slate-100 overflow-y-auto h-full font-mono text-xs">
      <div className="border-b border-slate-300 dark:border-slate-800 pb-3">
        <h1 className="text-lg font-bold tracking-tight text-purple-700 dark:text-purple-400 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          OPCODE SEQUENCE REGISTRY
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Known operational intents mapped to executable opcode sequences
        </p>
      </div>

      <div className="space-y-3">
        {entries.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-3 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.intentId}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-bold">
                  v{item.version}
                </span>
              </div>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase">{item.status}</span>
            </div>

            <p className="text-slate-700 dark:text-slate-300 text-xs">{item.description}</p>

            <div className="space-y-1">
              <span className="text-slate-600 dark:text-slate-400 font-bold">Opcode Sequence:</span>
              <div className="flex gap-1.5 flex-wrap">
                {item.opSequence.map((op, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-950 text-purple-800 dark:text-purple-300 border border-slate-300 dark:border-slate-800 font-bold"
                  >
                    {idx + 1}. {op}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
