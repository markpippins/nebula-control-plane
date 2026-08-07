import React, { useEffect, useState } from 'react';
import {
  FileCheck,
  Search,
  Filter,
  UserCheck,
  Tag,
  Calendar,
  X,
  FileText,
  RefreshCw,
  Database,
  Inbox,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';
import { apiRequest } from '../../services/apiClient';
import { AgentRecord } from '../../types/nebula';

export const AgentAuditView: React.FC = () => {
  const { triggerRefresh, addActivityLog } = useNebula();
  const [records, setRecords] = useState<AgentRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AgentRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [inboxModalOpen, setInboxModalOpen] = useState<boolean>(false);
  const [inboxPointers, setInboxPointers] = useState<Record<string, string>>({});
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ items: AgentRecord[] } | AgentRecord[]>('/agent-records');
      const items = Array.isArray(res) ? res : res.items || [];
      setRecords(items);
    } catch (err) {
      console.warn('[AgentAuditView] Error loading records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [triggerRefresh]);

  const loadFullRecord = async (id: string) => {
    try {
      const full = await apiRequest<AgentRecord>(`/agent-records/${id}`);
      setSelectedRecord(full);
    } catch (err: any) {
      alert(`Error loading record detail: ${err.message}`);
    }
  };

  const handleSyncAudit = async () => {
    setSyncing(true);
    try {
      const res = await apiRequest<any>('/audit/sync', { method: 'POST' });
      addActivityLog('AUDIT', 'Audit filesystem re-synced successfully');
      alert(`Audit sync complete! Synced files.`);
      loadRecords();
    } catch (err: any) {
      alert(`Error syncing audit files: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleRegenerateAudit = async (id: string) => {
    try {
      await apiRequest<any>(`/audit/${id}/regenerate`, { method: 'POST' });
      addActivityLog('AUDIT', `Regenerated audit projection ${id}`);
      alert('Audit file projection regenerated from disk!');
      loadFullRecord(id);
    } catch (err: any) {
      alert(`Error regenerating audit file: ${err.message}`);
    }
  };

  const loadInboxPointers = async () => {
    try {
      const res = await apiRequest<Record<string, string>>('/inbox-pointers');
      setInboxPointers(res || {});
    } catch (err) {
      console.warn('[AgentAuditView] Inbox pointers error:', err);
      // Fallback defaults for demo
      setInboxPointers({
        architect: new Date().toISOString(),
        engineer: new Date().toISOString(),
        planner: new Date().toISOString(),
        reviewer: new Date().toISOString(),
      });
    }
  };

  const handleUpdateInboxPointer = async (role: string) => {
    setUpdatingRole(role);
    try {
      const nowStr = new Date().toISOString();
      await apiRequest<any>(`/inbox-pointer/${role}`, {
        method: 'PUT',
        body: JSON.stringify({ timestamp: nowStr }),
      });
      addActivityLog('INBOX', `Updated inbox pointer for role ${role}`);
      setInboxPointers((prev) => ({ ...prev, [role]: nowStr }));
    } catch (err: any) {
      alert(`Error updating inbox pointer for ${role}: ${err.message}`);
    } finally {
      setUpdatingRole(null);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (roleFilter !== 'all' && r.role !== roleFilter) return false;
    if (
      searchQuery &&
      !r.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !r.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-4 space-y-4 font-sans text-slate-900 dark:text-slate-100 overflow-y-auto h-full font-mono text-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-blue-700 dark:text-blue-400 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            AGENT AUDIT RECORDS & JOURNAL LOGS
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Durable audit trails, control plane synchronization, and AGENTS.md inbox pointers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
          <button
            onClick={handleSyncAudit}
            disabled={syncing}
            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            {syncing ? 'Syncing...' : 'Sync Audit Files'}
          </button>

          <button
            onClick={() => {
              setInboxModalOpen(true);
              loadInboxPointers();
            }}
            className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Inbox className="w-3.5 h-3.5 text-purple-500" />
            Inbox Pointers
          </button>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded p-1.5 text-slate-800 dark:text-slate-200 outline-none font-semibold"
          >
            <option value="all" className="bg-white dark:bg-slate-900">All Agent Roles</option>
            <option value="architect" className="bg-white dark:bg-slate-900">Architect</option>
            <option value="engineer" className="bg-white dark:bg-slate-900">Engineer</option>
            <option value="planner" className="bg-white dark:bg-slate-900">Planner</option>
            <option value="reviewer" className="bg-white dark:bg-slate-900">Reviewer</option>
            <option value="inspector" className="bg-white dark:bg-slate-900">Inspector</option>
          </select>

          <input
            type="text"
            placeholder="Search records or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 font-semibold"
          />
        </div>
      </div>

      {/* Record Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-sm">
        {filteredRecords.map((rec) => (
          <div
            key={rec.id}
            onClick={() => loadFullRecord(rec.id)}
            className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-3.5 space-y-2 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500/60 transition-colors shadow-2xs"
          >
            <div className="flex items-center justify-between text-[10px]">
              <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-800 font-bold uppercase">
                {rec.role}
              </span>
              <span className="text-slate-500">{new Date(rec.createdAt).toLocaleDateString()}</span>
            </div>

            <h3 className="font-bold text-slate-900 dark:text-slate-200 text-sm">{rec.title}</h3>

            <div className="flex gap-1.5 flex-wrap">
              {rec.tags.map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                >
                  #{t}
                </span>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
              <span>Type: {rec.recordType}</span>
              <span>Plan Ref: {rec.planRef || 'None'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-4 font-mono text-sm text-slate-900 dark:text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {selectedRecord.title}
              </h2>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-300">
              {selectedRecord.content || 'No content available for this record.'}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => handleRegenerateAudit(selectedRecord.id)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Regenerate Projection File
              </button>

              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inbox Pointers Modal */}
      {inboxModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 w-full max-w-lg space-y-4 font-mono text-sm text-slate-900 dark:text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                <Inbox className="w-4 h-4" />
                AGENTS.md R17 Inbox Pointers (Redis)
              </h2>
              <button
                onClick={() => setInboxModalOpen(false)}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Per-role inbox watermarks tracking last-seen conversation messages:
            </p>

            <div className="space-y-2">
              {['architect', 'engineer', 'planner', 'reviewer', 'inspector'].map((role) => (
                <div
                  key={role}
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800"
                >
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{role}</span>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Last Pointer: {inboxPointers[role] ? new Date(inboxPointers[role]).toLocaleString() : 'Not Set'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleUpdateInboxPointer(role)}
                    disabled={updatingRole === role}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-bold cursor-pointer"
                  >
                    {updatingRole === role ? 'Updating...' : 'Update Pointer'}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setInboxModalOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-semibold cursor-pointer"
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
