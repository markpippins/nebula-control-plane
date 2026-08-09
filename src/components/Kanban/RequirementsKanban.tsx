import React, { useEffect, useState } from 'react';
import {
  Plus,
  Kanban as KanbanIcon,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Code,
  Layers,
  Filter,
  RefreshCw,
  Zap,
  Tag,
  X,
  FileCode,
  CheckSquare,
  Square,
  Link,
  GitFork,
  ArrowUpRight,
  Shield,
  SlidersHorizontal,
} from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';
import { apiRequest } from '../../services/apiClient';
import { Requirement, RequirementStatus, SystemItem, CompilationIR, RequirementDependency } from '../../types/nebula';

const CANONICAL_STATUSES: RequirementStatus[] = [
  'Backlog',
  'ToDo',
  'InProgress',
  'Active',
  'Blocked',
  'Done',
  'Cancelled',
  'Accepted',
];

const STATUS_COLORS: Record<RequirementStatus, { bg: string; text: string; border: string }> = {
  Backlog: { bg: 'bg-slate-100 dark:bg-slate-900', text: 'text-slate-700 dark:text-slate-400', border: 'border-slate-300 dark:border-slate-800' },
  ToDo: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/60' },
  InProgress: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/60' },
  Active: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/60' },
  Blocked: { bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-900/60' },
  Done: { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-900/60' },
  Cancelled: { bg: 'bg-slate-100 dark:bg-slate-950/80', text: 'text-slate-600 dark:text-slate-500', border: 'border-slate-300 dark:border-slate-800' },
  Accepted: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900/60' },
};

export const RequirementsKanban: React.FC = () => {
  const { triggerRefresh, refreshCounts } = useNebula();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [systems, setSystems] = useState<SystemItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSystemFilter, setSelectedSystemFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Batch Select State
  const [selectedReqIds, setSelectedReqIds] = useState<string[]>([]);
  const [batchTargetStatus, setBatchTargetStatus] = useState<RequirementStatus>('InProgress');
  const [batchUpdating, setBatchUpdating] = useState<boolean>(false);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [compileModalReq, setCompileModalReq] = useState<Requirement | null>(null);
  const [compilationResult, setCompilationResult] = useState<CompilationIR | null>(null);
  const [compiling, setCompiling] = useState<boolean>(false);

  // Dependency & Hierarchy Inspector Modal
  const [inspectReq, setInspectReq] = useState<Requirement | null>(null);
  const [reqDependencies, setReqDependencies] = useState<any[]>([]);
  const [reqChildren, setReqChildren] = useState<Requirement[]>([]);
  const [loadingDependencies, setLoadingDependencies] = useState<boolean>(false);
  const [newDepTargetId, setNewDepTargetId] = useState<string>('');
  const [newDepRelType, setNewDepRelType] = useState<string>('req:blocks');
  const [newChildTitle, setNewChildTitle] = useState<string>('');

  // New Req Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSystemId, setNewSystemId] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newReqType, setNewReqType] = useState('Task');
  const [newStatus, setNewStatus] = useState<RequirementStatus>('Backlog');
  const [newParentId, setNewParentId] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqs, sysRes] = await Promise.all([
        apiRequest<Requirement[] | { items: Requirement[] }>('/requirements'),
        apiRequest<{ items: SystemItem[] } | SystemItem[]>('/systems'),
      ]);
      const safeReqs = Array.isArray(reqs)
        ? reqs
        : Array.isArray((reqs as any)?.items)
        ? (reqs as any).items
        : [];
      const safeSys = Array.isArray(sysRes)
        ? sysRes
        : Array.isArray((sysRes as any)?.items)
        ? (sysRes as any).items
        : [];
      setRequirements(safeReqs);
      setSystems(safeSys);
      if (safeSys.length > 0 && !newSystemId) {
        setNewSystemId(safeSys[0].id);
      }
    } catch (err) {
      console.warn('[Kanban] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [triggerRefresh]);

  // Load Inspection Data (Dependencies & Children)
  const loadInspectionData = async (reqObj: Requirement) => {
    setLoadingDependencies(true);
    try {
      const [depsRes, childRes] = await Promise.all([
        apiRequest<{ items: any[] }>(`/requirements/${reqObj.id}/dependencies`).catch(() => ({ items: [] })),
        apiRequest<Requirement[]>(`/requirements/${reqObj.id}/children`).catch(() => []),
      ]);
      setReqDependencies(depsRes.items || []);
      setReqChildren(Array.isArray(childRes) ? childRes : []);
    } catch (err) {
      console.warn('[Kanban] Error loading dependencies:', err);
    } finally {
      setLoadingDependencies(false);
    }
  };

  const handleOpenInspectModal = (reqObj: Requirement) => {
    setInspectReq(reqObj);
    loadInspectionData(reqObj);
  };

  // Add Dependency Link
  const handleAddDependency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectReq || !newDepTargetId) return;

    try {
      await apiRequest(`/requirements/${inspectReq.id}/dependencies`, {
        method: 'POST',
        body: JSON.stringify({
          targetId: newDepTargetId,
          relType: newDepRelType,
        }),
      });
      setNewDepTargetId('');
      loadInspectionData(inspectReq);
    } catch (err: any) {
      alert(`Failed to add dependency: ${err.message}`);
    }
  };

  // Add Child Requirement
  const handleAddChildRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectReq || !newChildTitle) return;

    try {
      const newChild = await apiRequest<Requirement>('/requirements', {
        method: 'POST',
        body: JSON.stringify({
          systemId: inspectReq.systemId,
          parentId: inspectReq.id,
          title: newChildTitle,
          status: 'Backlog',
          priority: inspectReq.priority || 'Medium',
          reqType: 'Task',
        }),
      });
      setRequirements((prev) => [newChild, ...prev]);
      setNewChildTitle('');
      loadInspectionData(inspectReq);
      refreshCounts();
    } catch (err: any) {
      alert(`Failed to add child requirement: ${err.message}`);
    }
  };

  // Batch Status Update (`PATCH /api/requirements/batch`)
  const handleBatchStatusUpdate = async () => {
    if (selectedReqIds.length === 0) return;
    setBatchUpdating(true);

    try {
      await apiRequest('/requirements/batch', {
        method: 'PATCH',
        body: JSON.stringify({
          ids: selectedReqIds,
          status: batchTargetStatus,
        }),
      });

      // Update locally
      setRequirements((prev) =>
        prev.map((r) =>
          selectedReqIds.includes(r.id) ? { ...r, status: batchTargetStatus } : r
        )
      );
      setSelectedReqIds([]);
      refreshCounts();
    } catch (err: any) {
      alert(`Batch update failed: ${err.message}`);
    } finally {
      setBatchUpdating(false);
    }
  };

  const toggleSelectCard = (reqId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedReqIds((prev) =>
      prev.includes(reqId) ? prev.filter((id) => id !== reqId) : [...prev, reqId]
    );
  };

  // Handle single card status move with Optimistic Concurrency check
  const handleMoveStatus = async (reqObj: Requirement, targetStatus: RequirementStatus) => {
    const originalStatus = reqObj.status;

    // Optimistic Update
    setRequirements((prev) =>
      prev.map((r) => (r.id === reqObj.id ? { ...r, status: targetStatus } : r))
    );

    try {
      await apiRequest<Requirement>(`/requirements/${reqObj.id}/move`, {
        method: 'POST',
        body: JSON.stringify({
          targetStatus,
          expectedCurrentStatus: originalStatus,
        }),
      });
      refreshCounts();
    } catch (err: any) {
      alert(`[Optimistic Lock Conflict] ${err.message}. Reverting card status.`);
      // Revert on conflict
      setRequirements((prev) =>
        prev.map((r) => (r.id === reqObj.id ? { ...r, status: originalStatus } : r))
      );
    }
  };

  // Handle Requirement Creation
  const handleCreateRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSystemId) return;

    try {
      const created = await apiRequest<Requirement>('/requirements', {
        method: 'POST',
        body: JSON.stringify({
          systemId: newSystemId,
          title: newTitle,
          description: newDescription,
          status: newStatus,
          priority: newPriority,
          reqType: newReqType,
          parentId: newParentId || null,
        }),
      });
      setRequirements((prev) => [created, ...prev]);
      setCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewParentId('');
      refreshCounts();
    } catch (err: any) {
      alert(`Failed to create requirement: ${err.message}`);
    }
  };

  // Handle Compile (WorkRequest Stage 1 & Stage 2 IR)
  const handleCompileRequirement = async (reqObj: Requirement) => {
    setCompileModalReq(reqObj);
    setCompiling(true);
    setCompilationResult(null);

    try {
      const res = await apiRequest<CompilationIR>(`/requirements/${reqObj.id}/compile`, {
        method: 'POST',
        body: JSON.stringify({
          stage1Only: false,
          createPlan: true,
        }),
      });
      setCompilationResult(res);
      // Update requirement locally
      setRequirements((prev) =>
        prev.map((r) => (r.id === reqObj.id ? { ...r, conduitPlanId: res.plan_number } : r))
      );
    } catch (err: any) {
      alert(`Compilation failed: ${err.message}`);
    } finally {
      setCompiling(false);
    }
  };

  // Filter requirements
  const safeRequirementsList = Array.isArray(requirements) ? requirements : [];
  const filteredReqs = safeRequirementsList.filter((r) => {
    if (selectedSystemFilter !== 'all' && r.systemId !== selectedSystemFilter) return false;
    if (
      searchQuery &&
      !r.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !r.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-4 space-y-4 font-sans text-slate-900 dark:text-slate-100 h-full flex flex-col overflow-hidden">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 pb-2 border-b border-slate-300 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold font-mono tracking-tight text-sky-700 dark:text-indigo-400 flex items-center gap-2">
            <KanbanIcon className="w-5 h-5 text-sky-700 dark:text-indigo-400" />
            REQUIREMENTS PROCESS CONTROL KANBAN
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            8 Canonical Status Lifecycle, Dependency DAG & Stage 2 WorkRequest IR Compiler
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* System filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 px-2.5 py-1 rounded text-sm font-mono">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedSystemFilter}
              onChange={(e) => setSelectedSystemFilter(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">All Systems</option>
              {systems.map((s) => (
                <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search input */}
          <input
            type="text"
            placeholder="Filter titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1 text-sm text-slate-800 dark:text-slate-200 font-mono outline-none focus:border-sky-500 dark:focus:border-indigo-500"
          />

          {/* Add requirement button */}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 dark:bg-indigo-600 hover:bg-sky-500 dark:hover:bg-indigo-500 text-white rounded text-sm font-mono font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            New Requirement
          </button>
        </div>
      </div>

      {/* Batch Status Update Floating Toolbar */}
      {selectedReqIds.length > 0 && (
        <div className="flex items-center justify-between bg-sky-50 dark:bg-indigo-950/80 border border-sky-300 dark:border-indigo-800/80 p-2.5 rounded-lg font-mono text-sm shadow-md animate-in fade-in shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sky-900 dark:text-indigo-200 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-sky-600 dark:text-indigo-400" />
              {selectedReqIds.length} Requirement{selectedReqIds.length > 1 ? 's' : ''} Selected
            </span>
            <span className="text-slate-500">|</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-300 text-xs font-semibold">Bulk Target Status:</span>
              <select
                value={batchTargetStatus}
                onChange={(e) => setBatchTargetStatus(e.target.value as RequirementStatus)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
              >
                {CANONICAL_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchStatusUpdate}
              disabled={batchUpdating}
              className="px-3 py-1 bg-sky-600 dark:bg-indigo-600 hover:bg-sky-500 dark:hover:bg-indigo-500 text-white font-bold rounded text-xs transition-colors flex items-center gap-1"
            >
              {batchUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <SlidersHorizontal className="w-3.5 h-3.5" />}
              Apply Batch Status (`PATCH /batch`)
            </button>
            <button
              onClick={() => setSelectedReqIds([])}
              className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded text-xs"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Kanban Board 8 Canonical Columns */}
      <div className="flex-1 overflow-x-auto pb-2">
        <div className="flex gap-3 h-full min-w-[1600px]">
          {CANONICAL_STATUSES.map((status) => {
            const columnReqs = filteredReqs.filter((r) => r.status === status);
            const style = STATUS_COLORS[status];

            return (
              <div
                key={status}
                className="w-64 shrink-0 flex flex-col rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-2.5 h-full shadow-xs"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800/80 font-mono text-sm">
                  <span className={`font-bold uppercase tracking-wider ${style.text}`}>
                    {status}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-950/80 text-slate-800 dark:text-slate-300 font-bold border border-slate-300 dark:border-slate-800">
                    {columnReqs.length}
                  </span>
                </div>

                {/* Card List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {columnReqs.map((req) => {
                    const isSelected = selectedReqIds.includes(req.id);
                    const childCount = safeRequirementsList.filter((r) => r.parentId === req.id).length;

                    return (
                      <div
                        key={req.id}
                        className={`bg-slate-50 dark:bg-slate-950/90 hover:bg-slate-100 dark:hover:bg-slate-950 border rounded p-2.5 text-sm space-y-2 shadow-2xs transition-all group ${
                          isSelected
                            ? 'border-sky-500 dark:border-indigo-500 ring-1 ring-sky-500 dark:ring-indigo-500 bg-sky-50/50 dark:bg-indigo-950/30'
                            : 'border-slate-200 dark:border-slate-800 hover:border-sky-500/60 dark:hover:border-slate-700'
                        }`}
                      >
                        {/* Select Checkbox + Priority + ID */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => toggleSelectCard(req.id, e)}
                              className="text-slate-400 hover:text-sky-600 dark:hover:text-indigo-400"
                              title="Toggle batch selection"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-3.5 h-3.5 text-sky-600 dark:text-indigo-400" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </button>
                            <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-300">
                              {req.id}
                            </span>
                          </div>

                          <span
                            className={`font-semibold ${
                              req.priority === 'Critical'
                                ? 'text-red-600 dark:text-red-400'
                                : req.priority === 'High'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {req.priority}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug group-hover:text-sky-700 dark:group-hover:text-indigo-300">
                          {req.title}
                        </h3>

                        {/* Description preview */}
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {req.description}
                        </p>

                        {/* Parent/Child Badge */}
                        {req.parentId || childCount > 0 ? (
                          <div className="flex items-center gap-2 text-[10px] font-mono text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/60">
                            <GitFork className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
                            {req.parentId && <span>Parent: {req.parentId}</span>}
                            {childCount > 0 && <span>Children: ({childCount})</span>}
                          </div>
                        ) : null}

                        {/* Plan / Compile Badge */}
                        {req.conduitPlanId ? (
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/80">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Compiled: {req.conduitPlanId}</span>
                          </div>
                        ) : null}

                        {/* Action Controls */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono gap-1">
                          {/* Inspect DAG & Hierarchy */}
                          <button
                            onClick={() => handleOpenInspectModal(req)}
                            className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-sky-700 dark:hover:text-indigo-300 font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                            title="Inspect Dependencies & Children Hierarchy DAG"
                          >
                            <Link className="w-3 h-3 text-slate-500" />
                            DAG
                          </button>

                          {/* Compile Button */}
                          <button
                            onClick={() => handleCompileRequirement(req)}
                            className="flex items-center gap-1 text-sky-800 dark:text-indigo-400 hover:text-sky-900 dark:hover:text-indigo-300 font-semibold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-indigo-950/60 border border-sky-300 dark:border-indigo-800/60"
                            title="Run Stage 1 & Stage 2 WorkRequest IR Compiler"
                          >
                            <Zap className="w-3 h-3 text-sky-600 dark:text-indigo-400" />
                            Compile
                          </button>

                          {/* Move status dropdown */}
                          <select
                            value={req.status}
                            onChange={(e) =>
                              handleMoveStatus(req, e.target.value as RequirementStatus)
                            }
                            className="bg-slate-200 dark:bg-slate-950 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-800 rounded px-1 py-0.5 text-[10px] outline-none cursor-pointer font-semibold"
                          >
                            {CANONICAL_STATUSES.map((st) => (
                              <option key={st} value={st} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                                Move: {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}

                  {columnReqs.length === 0 && (
                    <div className="text-center py-8 text-[11px] text-slate-500 font-mono italic">
                      Empty column
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dependencies & Hierarchy DAG Inspector Modal */}
      {inspectReq && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-4 font-mono text-sm text-slate-800 dark:text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-sky-700 dark:text-indigo-400 flex items-center gap-2">
                <GitFork className="w-4 h-4 text-sky-600 dark:text-indigo-400" />
                DEPENDENCY DAG & HIERARCHY INSPECTOR
              </h2>
              <button
                onClick={() => setInspectReq(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded border border-slate-300 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">Requirement ID: {inspectReq.id}</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-sky-100 dark:bg-indigo-950 text-sky-800 dark:text-indigo-300 border border-sky-300 dark:border-indigo-800">
                  {inspectReq.status}
                </span>
              </div>
              <div className="font-bold text-slate-900 dark:text-white text-base">{inspectReq.title}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">{inspectReq.description}</p>
            </div>

            {loadingDependencies ? (
              <div className="py-8 text-center text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading linkages (`GET /dependencies`, `GET /children`)...
              </div>
            ) : (
              <div className="space-y-4">
                {/* Section 1: Parent & Children Hierarchy */}
                <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    Parent / Child Hierarchy (`GET /children`)
                  </h3>

                  {inspectReq.parentId ? (
                    <div className="text-xs p-2 bg-purple-50 dark:bg-purple-950/40 rounded border border-purple-200 dark:border-purple-800/60 flex items-center justify-between">
                      <span>Parent Requirement ID: <strong>{inspectReq.parentId}</strong></span>
                      <span className="text-[10px] text-purple-600 font-semibold">Parent Link Active</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic">No parent requirement assigned (Root node).</div>
                  )}

                  {/* Children list */}
                  <div className="space-y-1 mt-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Child Requirements ({reqChildren.length}):</span>
                    {reqChildren.length > 0 ? (
                      <div className="space-y-1">
                        {reqChildren.map((child) => (
                          <div
                            key={child.id}
                            className="p-2 bg-slate-50 dark:bg-slate-950/80 rounded border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between"
                          >
                            <div>
                              <strong className="text-purple-600 dark:text-purple-400 mr-2">{child.id}</strong>
                              <span>{child.title}</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {child.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic">No child requirements.</div>
                    )}
                  </div>

                  {/* Add Child Form */}
                  <form onSubmit={handleAddChildRequirement} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Title for new child requirement..."
                      value={newChildTitle}
                      onChange={(e) => setNewChildTitle(e.target.value)}
                      className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1 text-xs outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Child
                    </button>
                  </form>
                </div>

                {/* Section 2: Explicit Dependency linkages */}
                <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-indigo-400 flex items-center gap-1.5">
                    <Link className="w-4 h-4" />
                    Requirement Dependency Linkages (`GET /dependencies`)
                  </h3>

                  {reqDependencies.length > 0 ? (
                    <div className="space-y-1.5">
                      {reqDependencies.map((dep: any) => (
                        <div
                          key={dep.id}
                          className="p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-indigo-950 text-sky-800 dark:text-indigo-300 font-bold text-[10px] border border-sky-300 dark:border-indigo-800">
                              {dep.relType}
                            </span>
                            <span>
                              {dep.sourceId === inspectReq.id ? `To: ${dep.targetId}` : `From: ${dep.sourceId}`}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">ID: {dep.id}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic">No explicit dependencies linked yet.</div>
                  )}

                  {/* Add Dependency Link Form */}
                  <form onSubmit={handleAddDependency} className="space-y-2 pt-2 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Link New Dependency Linkage (`POST /dependencies`):</span>
                    <div className="flex gap-2">
                      <select
                        value={newDepTargetId}
                        onChange={(e) => setNewDepTargetId(e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-xs outline-none"
                      >
                        <option value="">Select Target Requirement...</option>
                        {safeRequirementsList
                          .filter((r) => r.id !== inspectReq.id)
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.id}: {r.title.slice(0, 40)}
                            </option>
                          ))}
                      </select>

                      <select
                        value={newDepRelType}
                        onChange={(e) => setNewDepRelType(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-xs outline-none"
                      >
                        <option value="req:blocks">req:blocks</option>
                        <option value="req:depends_on">req:depends_on</option>
                        <option value="req:parent_of">req:parent_of</option>
                      </select>

                      <button
                        type="submit"
                        disabled={!newDepTargetId}
                        className="px-3 py-1 bg-sky-600 dark:bg-indigo-600 hover:bg-sky-500 text-white rounded text-xs font-semibold disabled:opacity-50"
                      >
                        Link
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setInspectReq(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Requirement Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 w-full max-w-lg space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="text-sm font-bold font-mono text-sky-700 dark:text-indigo-400 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                CREATE NEW REQUIREMENT
              </h2>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequirement} className="space-y-3 font-mono text-sm">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Target System *</label>
                <select
                  value={newSystemId}
                  onChange={(e) => setNewSystemId(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
                  required
                >
                  {systems.map((s) => (
                    <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Implement Redis Session State Caching"
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500 dark:focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Engineering specification details..."
                  rows={3}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500 dark:focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Parent Requirement ID (Optional)</label>
                <select
                  value={newParentId}
                  onChange={(e) => setNewParentId(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="">None (Top Level Root Requirement)</option>
                  {safeRequirementsList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id}: {r.title.slice(0, 40)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as RequirementStatus)}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
                  >
                    {CANONICAL_STATUSES.map((st) => (
                      <option key={st} value={st} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Type</label>
                  <select
                    value={newReqType}
                    onChange={(e) => setNewReqType(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="Epic">Epic</option>
                    <option value="Story">Story</option>
                    <option value="Task">Task</option>
                    <option value="Bug">Bug</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 dark:bg-indigo-600 hover:bg-sky-500 dark:hover:bg-indigo-500 text-white rounded font-semibold"
                >
                  Create Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compiler Inspection Modal */}
      {compileModalReq && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-4 font-mono text-sm text-slate-800 dark:text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                WORKREQUEST IR COMPILER RESULTS
              </h2>
              <button
                onClick={() => setCompileModalReq(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Requirement: </span>
              <span className="text-slate-900 dark:text-white font-bold">{compileModalReq.title}</span>
            </div>

            {compiling ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-sky-700 dark:text-indigo-400">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>Running Stage 1 Semantic Normalization & Stage 2 OP Matching...</span>
              </div>
            ) : compilationResult ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 dark:bg-slate-950 rounded border border-emerald-300 dark:border-emerald-800/80 space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-400">
                    <span>STATUS: STAGE 2 COMPILED</span>
                    <span>PLAN: {compilationResult.plan_number}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    Journal Entry ID: {compilationResult.journal_entry_id}
                  </div>
                </div>

                {/* Stage 1 details */}
                <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded border border-slate-300 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-sky-800 dark:text-indigo-300">STAGE 1: SEMANTIC NORMALIZATION</div>
                  <div>System: {compilationResult.stage1.systemName}</div>
                  <div>Synthesized Intent: {compilationResult.stage1.synthesizedIntent}</div>
                </div>

                {/* Stage 2 details */}
                <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded border border-slate-300 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-purple-800 dark:text-purple-300">STAGE 2: ENGINEERING OPCODES</div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">Opcode Sequence: </span>
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {compilationResult.stage2.op_sequence.map((op, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-bold text-[11px]"
                        >
                          {op}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>Idempotency Key: {compilationResult.stage2.idempotency_key}</div>
                  <div>
                    Affected Files: {compilationResult.stage2.files_affected.join(', ') || 'None'}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setCompileModalReq(null)}
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
