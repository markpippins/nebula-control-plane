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
} from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';
import { apiRequest } from '../../services/apiClient';
import { AgentRecord } from '../../types/nebula';

export const AgentAuditView: React.FC = () => {
  const { triggerRefresh } = useNebula();
  const [records, setRecords] = useState<AgentRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AgentRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ items: AgentRecord[] }>('/agent-records');
      setRecords(res.items || []);
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
    <div className="p-4 space-y-4 font-sans text-slate-900 dark:text-slate-100 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-bold font-mono tracking-tight text-blue-700 dark:text-blue-400 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            AGENT AUDIT RECORDS & JOURNAL LOGS
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Durable audit trails written by autonomous agent roles during compilation and verification
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
        {filteredRecords.map((rec) => (
          <div
            key={rec.id}
            onClick={() => loadFullRecord(rec.id)}
            className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-3.5 space-y-2 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500/60 transition-colors shadow-xs"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-4 font-mono text-xs text-slate-900 dark:text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {selectedRecord.title}
              </h2>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-300">
              {selectedRecord.content || 'No content available for this record.'}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-semibold"
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
