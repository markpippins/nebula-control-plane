import React, { useEffect, useState } from 'react';
import {
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Key,
  FileCheck2,
  Activity,
  Plus,
} from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';
import { apiRequest } from '../../services/apiClient';
import { ExecutionRequest, ExecutionReceipt, ExecutionStateSummary } from '../../types/nebula';

export const ExecutionPipelineView: React.FC = () => {
  const { triggerRefresh, refreshCounts } = useNebula();
  const [requests, setRequests] = useState<ExecutionRequest[]>([]);
  const [receipts, setReceipts] = useState<ExecutionReceipt[]>([]);
  const [summary, setSummary] = useState<ExecutionStateSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // New execution modal
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [bKey, setBKey] = useState('');
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, recRes, sumRes] = await Promise.all([
        apiRequest<{ items: ExecutionRequest[] }>('/execution/requests'),
        apiRequest<{ items: ExecutionReceipt[] }>('/execution/receipts'),
        apiRequest<ExecutionStateSummary>('/execution/state'),
      ]);
      setRequests(reqRes.items || []);
      setReceipts(recRes.items || []);
      setSummary(sumRes);
    } catch (err) {
      console.warn('[ExecutionPipelineView] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [triggerRefresh]);

  const handleCreateExecution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bKey) return;

    try {
      await apiRequest('/execution/requests', {
        method: 'POST',
        body: JSON.stringify({
          businessKey: bKey,
          title: title || bKey,
          objective,
        }),
      });
      setCreateModalOpen(false);
      setBKey('');
      setTitle('');
      setObjective('');
      loadData();
      refreshCounts();
    } catch (err: any) {
      alert(`Execution creation failed: ${err.message}`);
    }
  };

  return (
    <div className="p-4 space-y-4 font-sans text-slate-900 dark:text-slate-100 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-bold font-mono tracking-tight text-blue-700 dark:text-blue-400 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            EXECUTION PIPELINE & DISTRIBUTED LEASES
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Work request queue, 300s TTL lease manager & execution attempt receipts
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-mono font-semibold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Dispatch Execution Request
        </button>
      </div>

      {/* State Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
          <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded p-3 shadow-xs">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Total Work Requests</span>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">{summary.totalRequests}</div>
          </div>
          <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded p-3 shadow-xs">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Active Lease Locks</span>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{summary.activeLeases}</div>
          </div>
          <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded p-3 shadow-xs">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Running Executions</span>
            <div className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1">
              {summary.requests?.RUNNING || 1}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded p-3 shadow-xs">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Issued Receipts</span>
            <div className="text-xl font-bold text-purple-700 dark:text-purple-400 mt-1">{receipts.length}</div>
          </div>
        </div>
      )}

      {/* Requests Table */}
      <div className="space-y-3 font-mono text-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
          Work Requests Queue
        </h2>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-950 border-b border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 text-[11px] font-bold">
                <th className="p-2.5">Business Key</th>
                <th className="p-2.5">Title / Objective</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Plan Ref</th>
                <th className="p-2.5">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-2.5 font-bold text-blue-700 dark:text-blue-300">{r.businessKey}</td>
                  <td className="p-2.5">
                    <div className="font-semibold text-slate-900 dark:text-slate-200">{r.title}</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">{r.objective}</div>
                  </td>
                  <td className="p-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'RUNNING'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                          : r.status === 'SUCCEEDED'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400">{r.sourcePlanId || 'N/A'}</td>
                  <td className="p-2.5 text-slate-500 text-[11px]">
                    {new Date(r.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipts */}
      <div className="space-y-2 font-mono text-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
          Execution Receipts Log
        </h2>

        <div className="space-y-2">
          {receipts.map((rec) => (
            <div
              key={rec.id}
              className="p-3 bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded flex items-center justify-between text-xs shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{rec.summary}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Agent Role: <span className="text-slate-800 dark:text-slate-300 font-semibold">{rec.agentRole}</span> | Attempt ID:{' '}
                    <span className="text-slate-800 dark:text-slate-300 font-semibold">{rec.attemptId}</span>
                  </div>
                </div>
              </div>

              <span className="text-[10px] text-slate-500">
                {new Date(rec.issuedAt).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Create Execution Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 w-full max-w-md space-y-3 font-mono text-xs shadow-xl">
            <h2 className="text-sm font-bold text-blue-700 dark:text-blue-400">DISPATCH EXECUTION REQUEST</h2>
            <input
              type="text"
              placeholder="Business Key * (e.g. EXEC-BUILD-001)"
              value={bKey}
              onChange={(e) => setBKey(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
            />
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
            />
            <textarea
              placeholder="Objective description..."
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={3}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 rounded font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateExecution}
                className="px-3 py-1.5 bg-blue-600 text-white rounded font-semibold"
              >
                Dispatch Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
