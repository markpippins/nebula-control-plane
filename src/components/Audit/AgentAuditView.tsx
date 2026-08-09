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
  GitGraph,
  Share2,
  SlidersHorizontal,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';
import { apiRequest } from '../../services/apiClient';
import { AgentRecord } from '../../types/nebula';

interface AuditGraphEntity {
  id: string;
  label: string;
  type: string;
  role: string;
}

interface AuditGraphEdge {
  source: string;
  target: string;
  relType: string;
}

interface AuditGraphData {
  entities: AuditGraphEntity[];
  edges: AuditGraphEdge[];
  entityCount: number;
  edgeCount: number;
}

export const AgentAuditView: React.FC = () => {
  const { triggerRefresh, addActivityLog } = useNebula();
  const [activeTab, setActiveTab] = useState<'records' | 'graph' | 'search'>('records');

  const [records, setRecords] = useState<AgentRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AgentRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [inboxModalOpen, setInboxModalOpen] = useState<boolean>(false);
  const [inboxPointers, setInboxPointers] = useState<Record<string, string>>({});
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Graph state (`GET /api/audit/graph`)
  const [graphData, setGraphData] = useState<AuditGraphData | null>(null);
  const [loadingGraph, setLoadingGraph] = useState<boolean>(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [graphTypeFilter, setGraphTypeFilter] = useState<string>('all');

  // Parametric Search state (`POST /api/agent-records/search`)
  const [paramQuery, setParamQuery] = useState<string>('');
  const [paramType, setParamType] = useState<string>('');
  const [paramRole, setParamRole] = useState<string>('');
  const [paramLimit, setParamLimit] = useState<number>(20);
  const [paramSearchResults, setParamSearchResults] = useState<AgentRecord[]>([]);
  const [paramTotal, setParamTotal] = useState<number>(0);
  const [searchingParam, setSearchingParam] = useState<boolean>(false);

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

  const loadAuditGraph = async () => {
    setLoadingGraph(true);
    try {
      const res = await apiRequest<AuditGraphData>('/audit/graph');
      setGraphData(res);
    } catch (err) {
      console.warn('[AgentAuditView] Error loading audit graph:', err);
    } finally {
      setLoadingGraph(false);
    }
  };

  const handleExecuteParamSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchingParam(true);

    try {
      const res = await apiRequest<{ items: AgentRecord[]; total: number }>('/agent-records/search', {
        method: 'POST',
        body: JSON.stringify({
          query: paramQuery,
          type: paramType || undefined,
          role: paramRole || undefined,
          limit: paramLimit,
        }),
      });

      setParamSearchResults(res.items || []);
      setParamTotal(res.total || 0);
    } catch (err: any) {
      alert(`Parametric search failed: ${err.message}`);
    } finally {
      setSearchingParam(false);
    }
  };

  useEffect(() => {
    loadRecords();
    loadAuditGraph();
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
      const res = await apiRequest<any>('/inbox-pointers');
      const pointers = (res && typeof res === 'object' && 'pointers' in res) ? res.pointers : (res || {});
      setInboxPointers(pointers);
    } catch (err) {
      console.warn('[AgentAuditView] Inbox pointers error:', err);
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
            AGENT AUDIT RECORDS & GRAPH VISUALIZER
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Durable audit trails, lifecycle DAG graph, and multi-field record search
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-1 rounded font-bold shadow-xs">
            <button
              onClick={() => setActiveTab('records')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1 ${
                activeTab === 'records'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Journal Logs ({records.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('graph');
                loadAuditGraph();
              }}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1 ${
                activeTab === 'graph'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <GitGraph className="w-3.5 h-3.5" />
              Audit Graph DAG
            </button>
            <button
              onClick={() => {
                setActiveTab('search');
                handleExecuteParamSearch();
              }}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1 ${
                activeTab === 'search'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Parametric Search
            </button>
          </div>

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
        </div>
      </div>

      {/* TAB 1: Standard Journal Log Records */}
      {activeTab === 'records' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
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
                placeholder="Quick filter records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 font-semibold"
              />
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Showing {filteredRecords.length} of {records.length} records
            </span>
          </div>

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
        </div>
      )}

      {/* TAB 2: Audit Graph Visualizer (`GET /api/audit/graph`) */}
      {activeTab === 'graph' && (
        <div className="space-y-4 font-mono text-sm">
          <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-3 rounded-lg shadow-xs">
            <div className="flex items-center gap-2">
              <GitGraph className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100">AUDIT DAG GRAPH VISUALIZER (`/api/audit/graph`)</h2>
                <p className="text-xs text-slate-500">
                  Full lifecycle DAG audit trail mapping agent records, plans & cross-reference dependencies
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <button
                onClick={loadAuditGraph}
                disabled={loadingGraph}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingGraph ? 'animate-spin' : ''}`} />
                Refresh Graph
              </button>

              <select
                value={graphTypeFilter}
                onChange={(e) => setGraphTypeFilter(e.target.value)}
                className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="all">All Entity Types</option>
                <option value="PLAN_PROPOSAL">PLAN_PROPOSAL</option>
                <option value="ANALYSIS_NOTE">ANALYSIS_NOTE</option>
                <option value="EXECUTION_LOG">EXECUTION_LOG</option>
                <option value="COMPILATION_OUTPUT">COMPILATION_OUTPUT</option>
              </select>

              {graphData && (
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 rounded border border-blue-300 dark:border-blue-800">
                    Entities: {graphData.entityCount}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 rounded border border-purple-300 dark:border-purple-800">
                    Edges: {graphData.edgeCount}
                  </span>
                </div>
              )}
            </div>
          </div>

          {loadingGraph ? (
            <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
              Retrieving full DAG audit trail (`GET /api/audit/graph`)...
            </div>
          ) : graphData ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left 2 Cols: Visual Graph Nodes & Directed Links */}
              <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4 min-h-[420px] relative overflow-hidden shadow-inner">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-blue-400" />
                    DAG Nodes & Cross-Reference Linkages
                  </span>
                  <span className="text-[10px] text-slate-500">Click node to inspect linkages</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {graphData.entities
                    .filter((e) => graphTypeFilter === 'all' || e.type === graphTypeFilter)
                    .map((entity) => {
                      const isSelected = selectedEntityId === entity.id;
                      const outgoingEdges = graphData.edges.filter((edge) => edge.source === entity.id);
                      const incomingEdges = graphData.edges.filter((edge) => edge.target === entity.id);

                      return (
                        <div
                          key={entity.id}
                          onClick={() => setSelectedEntityId(entity.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-950/80 border-blue-500 ring-1 ring-blue-500 shadow-md shadow-blue-900/30'
                              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                              {entity.id}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-blue-900/60 text-blue-300 font-semibold border border-blue-800 uppercase">
                              {entity.role}
                            </span>
                          </div>

                          <div className="font-bold text-slate-100 text-xs line-clamp-1">{entity.label}</div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                            <span>Type: {entity.type}</span>
                            <span className="text-purple-400 font-bold">
                              {outgoingEdges.length + incomingEdges.length} Links
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Visual Edge Connection Flow Preview */}
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    DAG Directed Edge Stream ({graphData.edges.length})
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {graphData.edges.map((edge, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-slate-900/60 rounded border border-slate-800/80 text-xs flex items-center justify-between text-slate-300"
                      >
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-blue-400 font-bold">{edge.source}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-emerald-400 font-bold">{edge.target}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">
                          {edge.relType}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Col: Selected Entity Inspector */}
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-3 shadow-xs">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-500" />
                  Entity Inspector
                </h3>

                {selectedEntityId ? (
                  (() => {
                    const ent = graphData.entities.find((e) => e.id === selectedEntityId);
                    if (!ent) return null;
                    const connectedOut = graphData.edges.filter((e) => e.source === ent.id);
                    const connectedIn = graphData.edges.filter((e) => e.target === ent.id);

                    return (
                      <div className="space-y-3 text-xs">
                        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                          <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{ent.id}</div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{ent.label}</div>
                          <div className="text-slate-500">Role: {ent.role} | Type: {ent.type}</div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="font-bold text-slate-700 dark:text-slate-300 block">Outgoing Edge Linkages ({connectedOut.length}):</span>
                          {connectedOut.length > 0 ? (
                            connectedOut.map((e, i) => (
                              <div key={i} className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-900 flex justify-between">
                                <span>Target: <strong>{e.target}</strong></span>
                                <span className="font-bold text-blue-600">{e.relType}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-500 italic">No outgoing edges.</div>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <span className="font-bold text-slate-700 dark:text-slate-300 block">Incoming Edge Linkages ({connectedIn.length}):</span>
                          {connectedIn.length > 0 ? (
                            connectedIn.map((e, i) => (
                              <div key={i} className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded border border-purple-200 dark:border-purple-900 flex justify-between">
                                <span>Source: <strong>{e.source}</strong></span>
                                <span className="font-bold text-purple-600">{e.relType}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-500 italic">No incoming edges.</div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="p-8 text-center text-slate-500 italic text-xs">
                    Select any node from the DAG graph visualizer on the left to inspect its cross-reference edges.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 3: Parametric Agent Record Search (`POST /api/agent-records/search`) */}
      {activeTab === 'search' && (
        <div className="space-y-4 font-mono text-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-3 shadow-xs">
            <h2 className="font-bold text-sm uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              PARAMETRIC MULTI-FIELD SEARCH (`POST /api/agent-records/search`)
            </h2>

            <form onSubmit={handleExecuteParamSearch} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Search Query</label>
                <input
                  type="text"
                  placeholder="e.g. System, Pipeline, DAG..."
                  value={paramQuery}
                  onChange={(e) => setParamQuery(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Record Type</label>
                <select
                  value={paramType}
                  onChange={(e) => setParamType(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none font-semibold"
                >
                  <option value="">All Record Types</option>
                  <option value="PLAN_PROPOSAL">PLAN_PROPOSAL</option>
                  <option value="ANALYSIS_NOTE">ANALYSIS_NOTE</option>
                  <option value="EXECUTION_LOG">EXECUTION_LOG</option>
                  <option value="COMPILATION_OUTPUT">COMPILATION_OUTPUT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Agent Role</label>
                <select
                  value={paramRole}
                  onChange={(e) => setParamRole(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none font-semibold"
                >
                  <option value="">All Roles</option>
                  <option value="architect">Architect</option>
                  <option value="engineer">Engineer</option>
                  <option value="planner">Planner</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="inspector">Inspector</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={searchingParam}
                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Search className={`w-3.5 h-3.5 ${searchingParam ? 'animate-spin' : ''}`} />
                  {searchingParam ? 'Searching...' : 'Search (`POST`)'}
                </button>
              </div>
            </form>
          </div>

          {/* Search Results */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Parametric Search Results ({paramTotal} Total Matches)</span>
              <span>Showing up to {paramLimit} results</span>
            </div>

            {paramSearchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {paramSearchResults.map((rec) => (
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

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {rec.content}
                    </p>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Type: {rec.recordType}</span>
                      <span>Plan Ref: {rec.planRef || 'None'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-950 rounded border border-dashed border-slate-300 dark:border-slate-800 text-xs">
                No matching agent records found for these parametric query filters. Try adjusting query string or filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
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
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Regenerate Projection File
              </button>

              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-semibold cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inbox Pointers Modal */}
      {inboxModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
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
