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
  Lock,
  RefreshCw,
  Unlock,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';
import { apiRequest } from '../../services/apiClient';
import { ExecutionRequest, ExecutionReceipt, ExecutionStateSummary } from '../../types/nebula';

interface ExecutionLease {
  id: string;
  requestId: string;
  owner: string;
  status: 'ACTIVE' | 'RELEASED';
  expiresAt: string;
  createdAt: string;
}

export const ExecutionPipelineView: React.FC = () => {
  const { triggerRefresh, refreshCounts } = useNebula();
  const [requests, setRequests] = useState<ExecutionRequest[]>([]);
  const [receipts, setReceipts] = useState<ExecutionReceipt[]>([]);
  const [summary, setSummary] = useState<ExecutionStateSummary | null>(null);
  const [leases, setLeases] = useState<ExecutionLease[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New execution modal
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [bKey, setBKey] = useState('');
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');

  // Lease Acquire Form
  const [acquireModalOpen, setAcquireModalOpen] = useState<boolean>(false);
  const [acquireRequestId, setAcquireRequestId] = useState('');
  const [acquireOwner, setAcquireOwner] = useState('worker-01');
  const [acquireTtlSeconds, setAcquireTtlSeconds] = useState(300);

  // Log Attempt Modal
  const [attemptModalLease, setAttemptModalLease] = useState<ExecutionLease | null>(null);
  const [attemptExecutorId, setAttemptExecutorId] = useState('executor-01');
  const [attemptStatus, setAttemptStatus] = useState<'RUNNING' | 'SUCCEEDED' | 'FAILED'>('SUCCEEDED');

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, recRes, sumRes] = await Promise.all([
        apiRequest<{ items: ExecutionRequest[] }>('/execution/requests'),
        apiRequest<{ items: ExecutionReceipt[] }>('/execution/receipts'),
        apiRequest<any>('/execution/state'),
      ]);
      const fetchedRequests = reqRes.items || [];
      setRequests(fetchedRequests);
      setReceipts(recRes.items || []);

      if (fetchedRequests.length > 0 && !acquireRequestId) {
        setAcquireRequestId(fetchedRequests[0].id);
      }

      let formattedSummary: ExecutionStateSummary | null = null;
      if (sumRes) {
        if (Array.isArray(sumRes.requests)) {
          const reqMap: Record<string, number> = {};
          sumRes.requests.forEach((r: any) => {
            if (r && r.status) reqMap[r.status] = Number(r.count) || 0;
          });
          formattedSummary = {
            totalRequests: Number(sumRes.totalRequests) || Object.values(reqMap).reduce((a, b) => a + b, 0),
            activeLeases: Number(sumRes.activeLeases) || 0,
            requests: reqMap,
          };
        } else {
          formattedSummary = {
            totalRequests: Number(sumRes.totalRequests) || 0,
            activeLeases: Number(sumRes.activeLeases) || 0,
            requests: sumRes.requests || {},
          };
        }
      }
      setSummary(formattedSummary);
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

  // Acquire Lease (`POST /api/execution/leases/acquire`)
  const handleAcquireLease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acquireRequestId) return;

    try {
      const newLease = await apiRequest<ExecutionLease>('/execution/leases/acquire', {
        method: 'POST',
        body: JSON.stringify({
          requestId: acquireRequestId,
          owner: acquireOwner,
          ttlSeconds: acquireTtlSeconds,
        }),
      });
      setLeases((prev) => [newLease, ...prev]);
      setAcquireModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Lease acquisition failed: ${err.message}`);
    }
  };

  // Renew Lease (`POST /api/execution/leases/:id/renew`)
  const handleRenewLease = async (leaseId: string) => {
    try {
      const renewed = await apiRequest<ExecutionLease>(`/execution/leases/${leaseId}/renew`, {
        method: 'POST',
        body: JSON.stringify({ ttlSeconds: 300 }),
      });
      setLeases((prev) =>
        prev.map((l) => (l.id === leaseId ? { ...l, expiresAt: renewed.expiresAt || new Date(Date.now() + 300000).toISOString() } : l))
      );
    } catch (err: any) {
      alert(`Lease renewal failed: ${err.message}`);
    }
  };

  // Release Lease (`POST /api/execution/leases/:id/release`)
  const handleReleaseLease = async (leaseId: string) => {
    try {
      await apiRequest(`/execution/leases/${leaseId}/release`, {
        method: 'POST',
      });
      setLeases((prev) =>
        prev.map((l) => (l.id === leaseId ? { ...l, status: 'RELEASED' } : l))
      );
      loadData();
    } catch (err: any) {
      alert(`Lease release failed: ${err.message}`);
    }
  };

  // Submit Execution Attempt (`POST /api/execution/attempts`)
  const handleLogAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attemptModalLease) return;

    try {
      await apiRequest('/execution/attempts', {
        method: 'POST',
        body: JSON.stringify({
          requestId: attemptModalLease.requestId,
          leaseId: attemptModalLease.id,
          executorId: attemptExecutorId,
          status: attemptStatus,
        }),
      });
      setAttemptModalLease(null);
      loadData();
      alert(`Execution attempt successfully logged for lease ${attemptModalLease.id}`);
    } catch (err: any) {
      alert(`Failed to log execution attempt: ${err.message}`);
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
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Work request queue, worker TTL lease locks & execution attempt receipts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAcquireModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm font-mono font-semibold transition-colors shadow-xs"
          >
            <Lock className="w-4 h-4" />
            Acquire Worker Lease
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-mono font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Dispatch Execution Request
          </button>
        </div>
      </div>

      {/* State Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-sm">
          <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded p-3 shadow-xs">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Total Work Requests</span>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">{summary.totalRequests}</div>
          </div>
          <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded p-3 shadow-xs">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Active Lease Locks</span>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{leases.filter((l) => l.status === 'ACTIVE').length + summary.activeLeases}</div>
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

      {/* Active Worker Execution Leases Section */}
      <div className="space-y-3 font-mono text-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <Lock className="w-4 h-4" />
            Worker Execution Lease Locks (`/api/execution/leases/*`)
          </h2>
          <span className="text-xs text-slate-500">300s Default TTL Locks</span>
        </div>

        {leases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {leases.map((lease) => (
              <div
                key={lease.id}
                className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-3.5 space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    {lease.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      lease.status === 'ACTIVE'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {lease.status}
                  </span>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300">
                  Request ID: <strong className="text-blue-600 dark:text-blue-400">{lease.requestId}</strong> | Worker Owner: <strong>{lease.owner}</strong>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  Expires At: {new Date(lease.expiresAt).toLocaleTimeString()}
                </div>

                {lease.status === 'ACTIVE' && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => handleRenewLease(lease.id)}
                      className="px-2.5 py-1 bg-sky-100 dark:bg-indigo-950 hover:bg-sky-200 text-sky-800 dark:text-indigo-300 border border-sky-300 dark:border-indigo-800 rounded text-xs font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Renew (Heartbeat)
                    </button>
                    <button
                      onClick={() => handleReleaseLease(lease.id)}
                      className="px-2.5 py-1 bg-red-100 dark:bg-red-950 hover:bg-red-200 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-800 rounded text-xs font-bold flex items-center gap-1"
                    >
                      <Unlock className="w-3 h-3" />
                      Release Lock
                    </button>
                    <button
                      onClick={() => setAttemptModalLease(lease)}
                      className="px-2.5 py-1 bg-purple-100 dark:bg-purple-950 hover:bg-purple-200 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 rounded text-xs font-bold flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      Log Attempt
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-500">
            No custom active worker lease locks. Click "Acquire Worker Lease" above to claim a worker lease on an execution request.
          </div>
        )}
      </div>

      {/* Requests Table */}
      <div className="space-y-3 font-mono text-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
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
      <div className="space-y-2 font-mono text-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
          Execution Receipts Log
        </h2>

        <div className="space-y-2">
          {receipts.map((rec) => (
            <div
              key={rec.id}
              className="p-3 bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded flex items-center justify-between text-sm shadow-2xs"
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

      {/* Dispatch Execution Request Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 w-full max-w-md space-y-3 font-mono text-sm shadow-xl">
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

      {/* Acquire Worker Lease Modal */}
      {acquireModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 w-full max-w-lg space-y-4 shadow-xl font-mono text-sm">
            <h2 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              ACQUIRE WORKER LEASE (`POST /api/execution/leases/acquire`)
            </h2>

            <form onSubmit={handleAcquireLease} className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Target Execution Request *</label>
                <select
                  value={acquireRequestId}
                  onChange={(e) => setAcquireRequestId(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
                  required
                >
                  {requests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id}: {r.title} ({r.businessKey})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Worker Owner Identifier *</label>
                <input
                  type="text"
                  value={acquireOwner}
                  onChange={(e) => setAcquireOwner(e.target.value)}
                  placeholder="e.g. worker-01"
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Lease Duration TTL (Seconds)</label>
                <input
                  type="number"
                  value={acquireTtlSeconds}
                  onChange={(e) => setAcquireTtlSeconds(Number(e.target.value))}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAcquireModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded font-semibold text-slate-800 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold"
                >
                  Acquire Lease Lock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Attempt Modal */}
      {attemptModalLease && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 w-full max-w-lg space-y-4 shadow-xl font-mono text-sm">
            <h2 className="text-sm font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2">
              <Send className="w-4 h-4" />
              LOG EXECUTION ATTEMPT (`POST /api/execution/attempts`)
            </h2>

            <form onSubmit={handleLogAttempt} className="space-y-3">
              <div>
                <span className="text-slate-500 block">Lease ID: <strong>{attemptModalLease.id}</strong></span>
                <span className="text-slate-500 block">Request ID: <strong>{attemptModalLease.requestId}</strong></span>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Executor ID *</label>
                <input
                  type="text"
                  value={attemptExecutorId}
                  onChange={(e) => setAttemptExecutorId(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Attempt Outcome Status</label>
                <select
                  value={attemptStatus}
                  onChange={(e) => setAttemptStatus(e.target.value as any)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="RUNNING">RUNNING</option>
                  <option value="SUCCEEDED">SUCCEEDED</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAttemptModalLease(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded font-semibold text-slate-800 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-semibold"
                >
                  Submit Execution Attempt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
