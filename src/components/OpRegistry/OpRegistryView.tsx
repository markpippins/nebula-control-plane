import React, { useEffect, useState } from 'react';
import { Code2, GitFork, AlertOctagon, CheckCircle2, Plus, RefreshCw, X } from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';
import { apiRequest } from '../../services/apiClient';
import { OpRegistryEntry } from '../../types/nebula';

export const OpRegistryView: React.FC = () => {
  const { triggerRefresh, addActivityLog } = useNebula();
  const [entries, setEntries] = useState<OpRegistryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);

  // New entry form state
  const [intentId, setIntentId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [opSeqInput, setOpSeqInput] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<any>('/op-registry');
      const items = Array.isArray(res) ? res : res?.items || [];
      setEntries(items);
    } catch (err) {
      console.warn('[OpRegistryView] Error loading data:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [triggerRefresh]);

  const handleFork = async (id: string, intent: string) => {
    try {
      await apiRequest<any>(`/op-registry/${id}/fork`, { method: 'POST' });
      addActivityLog('OPCODE', `Forked opcode sequence ${intent}`);
      loadData();
    } catch (err: any) {
      alert(`Error forking opcode: ${err.message}`);
    }
  };

  const handleCreate = async () => {
    if (!intentId.trim()) return;
    try {
      const ops = opSeqInput.split(',').map((s) => s.trim()).filter(Boolean);
      await apiRequest<any>('/op-registry', {
        method: 'POST',
        body: JSON.stringify({
          intentId,
          description,
          opSequence: ops,
        }),
      });
      addActivityLog('OPCODE', `Created opcode sequence for ${intentId}`);
      setCreateModalOpen(false);
      setIntentId('');
      setDescription('');
      setOpSeqInput('');
      loadData();
    } catch (err: any) {
      alert(`Error creating opcode entry: ${err.message}`);
    }
  };

  return (
    <div className="p-4 space-y-4 font-sans text-slate-900 dark:text-slate-100 overflow-y-auto h-full font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-purple-700 dark:text-purple-400 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            OPCODE SEQUENCE REGISTRY
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Known operational intents mapped to executable opcode sequences
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            New Opcode Sequence
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {entries.map((item) => {
          const sequence: string[] = Array.isArray(item?.opSequence)
            ? item.opSequence
            : Array.isArray((item as any)?.op_sequence)
            ? (item as any).op_sequence
            : [];

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.intentId}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-bold">
                    v{item.version || 1}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase text-[10px]">
                    {item.status || 'active'}
                  </span>
                  <button
                    onClick={() => handleFork(item.id, item.intentId)}
                    className="px-2 py-1 bg-purple-100 dark:bg-purple-950/80 hover:bg-purple-200 dark:hover:bg-purple-900 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-800/80 rounded flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                  >
                    <GitFork className="w-3 h-3" />
                    Fork Version
                  </button>
                </div>
              </div>

              <p className="text-slate-700 dark:text-slate-300 text-xs">{item.description || 'No description provided.'}</p>

              <div className="space-y-1">
                <span className="text-slate-600 dark:text-slate-400 font-bold">Opcode Sequence ({sequence.length}):</span>
                <div className="flex gap-1.5 flex-wrap">
                  {sequence.length > 0 ? (
                    sequence.map((op, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-950 text-purple-800 dark:text-purple-300 border border-slate-300 dark:border-slate-800 font-bold"
                      >
                        {idx + 1}. {op}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">No opcodes defined</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 w-full max-w-md space-y-4 text-slate-900 dark:text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Opcode Entry
              </h2>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Intent ID
                </label>
                <input
                  type="text"
                  value={intentId}
                  onChange={(e) => setIntentId(e.target.value)}
                  placeholder="e.g. DEPLOY_CONTAINER"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-purple-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Operational sequence description..."
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 outline-none focus:border-purple-500 font-semibold text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Opcode Sequence (Comma-separated)
                </label>
                <input
                  type="text"
                  value={opSeqInput}
                  onChange={(e) => setOpSeqInput(e.target.value)}
                  placeholder="BUILD_IMAGE, PUSH_REGISTRY, ROLLOUT_DEPLOYMENT"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-purple-500 font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold cursor-pointer"
              >
                Create Sequence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
