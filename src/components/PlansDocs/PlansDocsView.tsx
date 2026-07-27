import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle2, Layers, BookOpen, Play, Plus, Trash2, RefreshCw } from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';
import { apiRequest } from '../../services/apiClient';
import { ImplementationPlan } from '../../types/nebula';

interface ProjectionConfig {
  id: string;
  name: string;
  type: 'deterministic' | 'inference';
  description?: string | null;
  targetPath: string;
  model?: string | null;
  schedule?: string | null;
  createdAt?: string;
}

export const PlansDocsView: React.FC = () => {
  const { triggerRefresh, addActivityLog } = useNebula();
  const [plans, setPlans] = useState<ImplementationPlan[]>([]);
  const [projections, setProjections] = useState<ProjectionConfig[]>([]);
  const [activeTab, setActiveTab] = useState<'plans' | 'projections'>('plans');
  const [loading, setLoading] = useState<boolean>(true);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [newProjName, setNewProjName] = useState<string>('');
  const [newProjType, setNewProjType] = useState<'deterministic' | 'inference'>('deterministic');
  const [newProjPath, setNewProjPath] = useState<string>('docs/PROJECTION.md');
  const [newProjDesc, setNewProjDesc] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, projRes] = await Promise.all([
        apiRequest<{ items: ImplementationPlan[] }>('/plans').catch(() => ({ items: [] })),
        apiRequest<{ items: ProjectionConfig[] }>('/projections').catch(() => ({ items: [] })),
      ]);
      setPlans(plansRes.items || []);
      setProjections(projRes.items || []);
    } catch (err) {
      console.warn('[PlansDocsView] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [triggerRefresh]);

  const handleRenderProjection = async (id: string, name: string) => {
    try {
      await apiRequest<any>(`/projections/${id}/render`, { method: 'POST' });
      addActivityLog('PROJECTION', `Rendered projection ${name} to disk`);
      alert(`Projection "${name}" rendered to disk!`);
    } catch (err: any) {
      alert(`Error rendering projection: ${err.message}`);
    }
  };

  const handleDeleteProjection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this projection config?')) return;
    try {
      await apiRequest<any>(`/projections/${id}`, { method: 'DELETE' });
      addActivityLog('PROJECTION', `Deleted projection ${id}`);
      loadData();
    } catch (err: any) {
      alert(`Error deleting projection: ${err.message}`);
    }
  };

  const handleCreateProjection = async () => {
    if (!newProjName.trim()) return;
    try {
      await apiRequest<any>('/projections', {
        method: 'POST',
        body: JSON.stringify({
          name: newProjName,
          type: newProjType,
          targetPath: newProjPath,
          description: newProjDesc,
        }),
      });
      addActivityLog('PROJECTION', `Created projection config ${newProjName}`);
      setCreateModalOpen(false);
      setNewProjName('');
      loadData();
    } catch (err: any) {
      alert(`Error creating projection: ${err.message}`);
    }
  };

  return (
    <div className="p-4 space-y-4 font-sans text-slate-900 dark:text-slate-100 overflow-y-auto h-full font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-teal-700 dark:text-teal-400 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            IMPLEMENTATION PLANS & AUDIT PROJECTION ENGINE
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Conduit implementation plans, goal specifications, and filesystem markdown projection rules
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex bg-slate-200 dark:bg-slate-900 p-0.5 rounded border border-slate-300 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-3 py-1 rounded font-bold cursor-pointer transition-all ${
                activeTab === 'plans'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Plans ({plans.length})
            </button>
            <button
              onClick={() => setActiveTab('projections')}
              className={`px-3 py-1 rounded font-bold cursor-pointer transition-all ${
                activeTab === 'projections'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Projections ({projections.length})
            </button>
          </div>

          {activeTab === 'projections' && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Projection
            </button>
          )}
        </div>
      </div>

      {activeTab === 'plans' ? (
        <div className="space-y-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-2.5 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{p.id}: {p.title}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-teal-100 dark:bg-teal-950 text-teal-900 dark:text-teal-300 border border-teal-300 dark:border-teal-800 font-bold uppercase">
                  {p.status}
                </span>
              </div>

              <p className="text-slate-700 dark:text-slate-300 text-xs">{p.goal}</p>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-400 text-[11px]">
                {p.content}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Affected Files: {p.files_affected.join(', ') || 'None'}</span>
                <span>Created: {new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projections.map((proj) => (
            <div
              key={proj.id}
              className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-3 shadow-2xs flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{proj.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-300 border border-sky-300 dark:border-sky-800 font-bold uppercase">
                    {proj.type}
                  </span>
                </div>

                <p className="text-slate-600 dark:text-slate-400 text-xs">{proj.description || 'No description provided.'}</p>

                <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                  Target: {proj.targetPath}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => handleRenderProjection(proj.id, proj.name)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  Render to Disk
                </button>

                <button
                  onClick={() => handleDeleteProjection(proj.id)}
                  className="px-2.5 py-1.5 bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-800 rounded font-bold hover:bg-red-200 cursor-pointer text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Projection Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 font-mono text-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 w-full max-w-md space-y-4 text-slate-900 dark:text-slate-200 shadow-2xl">
            <h2 className="text-sm font-bold text-teal-700 dark:text-teal-400 border-b border-slate-200 dark:border-slate-800 pb-2">
              Create New Projection Rule
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Projection Name
                </label>
                <input
                  type="text"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="e.g. Architecture Blueprint Docs"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-teal-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Type
                </label>
                <select
                  value={newProjType}
                  onChange={(e) => setNewProjType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-1.5 outline-none font-semibold"
                >
                  <option value="deterministic">Deterministic (Query-based)</option>
                  <option value="inference">Inference (LLM generated)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Disk Path
                </label>
                <input
                  type="text"
                  value={newProjPath}
                  onChange={(e) => setNewProjPath(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-teal-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 outline-none focus:border-teal-500 font-semibold text-[11px]"
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
                onClick={handleCreateProjection}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded font-bold cursor-pointer"
              >
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
