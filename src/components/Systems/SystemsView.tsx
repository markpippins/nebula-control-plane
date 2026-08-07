import React, { useEffect, useState } from 'react';
import {
  Boxes,
  FolderPlus,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  Folder,
  Layers,
  FileCode,
  ArrowDownRight,
  Info,
  CheckCircle,
} from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';
import { apiRequest } from '../../services/apiClient';
import { SystemItem, Subsystem, Feature } from '../../types/nebula';

export const SystemsView: React.FC = () => {
  const { triggerRefresh, refreshCounts } = useNebula();
  const [systems, setSystems] = useState<SystemItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedSystems, setExpandedSystems] = useState<Record<string, boolean>>({});
  const [expandedSubsystems, setExpandedSubsystems] = useState<Record<string, boolean>>({});

  // Modals
  const [addSystemModal, setAddSystemModal] = useState<boolean>(false);
  const [addSubsystemModalSysId, setAddSubsystemModalSysId] = useState<string | null>(null);
  const [addFeatureModalSubId, setAddFeatureModalSubId] = useState<string | null>(null);
  const [demoteModalSysId, setDemoteModalSysId] = useState<string | null>(null);

  // Forms
  const [sysName, setSysName] = useState('');
  const [sysDesc, setSysDesc] = useState('');
  const [subName, setSubName] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [featName, setFeatName] = useState('');
  const [featDesc, setFeatDesc] = useState('');
  const [targetSysIdForDemote, setTargetSysIdForDemote] = useState('');

  const loadSystems = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ items: SystemItem[] } | SystemItem[]>('/systems');
      const items = Array.isArray(res)
        ? res
        : Array.isArray((res as any)?.items)
        ? (res as any).items
        : [];
      setSystems(items);
      // Expand first system by default
      if (items.length > 0) {
        setExpandedSystems((prev) => ({ ...prev, [items[0].id]: true }));
      }
    } catch (err) {
      console.warn('[SystemsView] Failed to fetch systems', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystems();
  }, [triggerRefresh]);

  const toggleSystemExpand = (id: string) => {
    setExpandedSystems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSubsystemExpand = (id: string) => {
    setExpandedSubsystems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Create System
  const handleCreateSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sysName) return;

    try {
      const created = await apiRequest<SystemItem>('/systems', {
        method: 'POST',
        body: JSON.stringify({ name: sysName, description: sysDesc }),
      });
      setSystems((prev) => [...prev, created]);
      setAddSystemModal(false);
      setSysName('');
      setSysDesc('');
      refreshCounts();
    } catch (err: any) {
      alert(`Error creating system: ${err.message}`);
    }
  };

  // Create Subsystem
  const handleCreateSubsystem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName || !addSubsystemModalSysId) return;

    try {
      const created = await apiRequest<Subsystem>('/subsystems', {
        method: 'POST',
        body: JSON.stringify({ systemId: addSubsystemModalSysId, name: subName, description: subDesc }),
      });
      setAddSubsystemModalSysId(null);
      setSubName('');
      setSubDesc('');
      loadSystems();
    } catch (err: any) {
      alert(`Error creating subsystem: ${err.message}`);
    }
  };

  // Create Feature
  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featName || !addFeatureModalSubId) return;

    try {
      await apiRequest<Feature>('/features', {
        method: 'POST',
        body: JSON.stringify({ subsystemId: addFeatureModalSubId, name: featName, description: featDesc }),
      });
      setAddFeatureModalSubId(null);
      setFeatName('');
      setFeatDesc('');
      loadSystems();
    } catch (err: any) {
      alert(`Error creating feature: ${err.message}`);
    }
  };

  // Demote System into Subsystem
  const handleDemoteSystem = async () => {
    if (!demoteModalSysId || !targetSysIdForDemote) return;

    try {
      await apiRequest(`/systems/demote/${demoteModalSysId}`, {
        method: 'POST',
        body: JSON.stringify({ targetSystemId: targetSysIdForDemote }),
      });
      setDemoteModalSysId(null);
      loadSystems();
    } catch (err: any) {
      alert(`Demote failed: ${err.message}`);
    }
  };

  return (
    <div className="p-4 space-y-4 font-sans text-slate-900 dark:text-slate-100 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-bold font-mono tracking-tight text-sky-700 dark:text-indigo-400 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-sky-700 dark:text-indigo-400" />
            SYSTEMS & SUBSYSTEMS HIERARCHY
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Systems → Organizational Folders & Subsystems → Features
          </p>
        </div>

        <button
          onClick={() => setAddSystemModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 dark:bg-indigo-600 hover:bg-sky-500 dark:hover:bg-indigo-500 text-white rounded text-xs font-mono font-semibold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add System
        </button>
      </div>

      {/* Systems List */}
      <div className="space-y-3 font-mono">
        {systems.map((sys) => {
          const isExpanded = expandedSystems[sys.id];

          return (
            <div
              key={sys.id}
              className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden text-xs shadow-xs"
            >
              {/* System Header Bar */}
              <div className="p-3 bg-slate-100 dark:bg-slate-900 flex items-center justify-between hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors">
                <div
                  onClick={() => toggleSystemExpand(sys.id)}
                  className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-sky-600 dark:text-indigo-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <Boxes className="w-4 h-4 text-sky-600 dark:text-indigo-400 shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{sys.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-sky-100 dark:bg-indigo-950 text-sky-900 dark:text-indigo-300 border border-sky-300 dark:border-indigo-800 font-bold">
                    {sys.subsystems.length} Subsystems
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAddSubsystemModalSysId(sys.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 rounded text-[11px] border border-slate-300 dark:border-slate-700 font-semibold"
                  >
                    <Plus className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Subsystem
                  </button>

                  <button
                    onClick={() => setDemoteModalSysId(sys.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-800 dark:text-amber-300 rounded text-[11px] border border-slate-300 dark:border-slate-700 font-semibold"
                    title="Demote system into subsystem of another system"
                  >
                    <ArrowDownRight className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    Demote
                  </button>
                </div>
              </div>

              {/* Expanded Subsystems Tree */}
              {isExpanded && (
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
                  {sys.description && (
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] italic mb-2">{sys.description}</p>
                  )}

                  {/* Subsystems List */}
                  {sys.subsystems.map((sub) => {
                    const subExpanded = expandedSubsystems[sub.id];

                    return (
                      <div
                        key={sub.id}
                        className="ml-4 border-l-2 border-slate-300 dark:border-slate-800 pl-3 space-y-2"
                      >
                        <div className="flex items-center justify-between bg-white dark:bg-slate-900/80 p-2 rounded border border-slate-200 dark:border-slate-800 shadow-xs">
                          <div
                            onClick={() => toggleSubsystemExpand(sub.id)}
                            className="flex items-center gap-2 cursor-pointer flex-1"
                          >
                            {subExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            )}
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: sub.color || '#0284c7' }}
                            />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{sub.name}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-500">
                              ({sub.features.length} Features)
                            </span>
                          </div>

                          <button
                            onClick={() => setAddFeatureModalSubId(sub.id)}
                            className="flex items-center gap-1 px-2 py-0.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 rounded text-[10px] border border-slate-300 dark:border-slate-700 font-semibold"
                          >
                            <Plus className="w-3 h-3 text-sky-700 dark:text-indigo-400" />
                            Feature
                          </button>
                        </div>

                        {/* Features List */}
                        {subExpanded && (
                          <div className="ml-5 space-y-1.5 pt-1">
                            {sub.features.map((feat) => (
                              <div
                                key={feat.id}
                                className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-950/80 rounded border border-slate-200 dark:border-slate-800 text-[11px]"
                              >
                                <div className="flex items-center gap-2">
                                  <FileCode className="w-3.5 h-3.5 text-sky-600 dark:text-indigo-400" />
                                  <span className="text-slate-800 dark:text-slate-300 font-medium">{feat.name}</span>
                                </div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-500">{feat.id}</span>
                              </div>
                            ))}

                            {sub.features.length === 0 && (
                              <div className="text-[10px] text-slate-500 italic">No features defined</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {sys.subsystems.length === 0 && (
                    <div className="text-[11px] text-slate-500 italic">No subsystems created yet</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Add System */}
      {addSystemModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 w-full max-w-md space-y-3 font-mono text-xs shadow-xl">
            <h2 className="text-sm font-bold text-sky-700 dark:text-indigo-400">ADD NEW SYSTEM</h2>
            <input
              type="text"
              placeholder="System Name *"
              value={sysName}
              onChange={(e) => setSysName(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
            />
            <textarea
              placeholder="Description..."
              value={sysDesc}
              onChange={(e) => setSysDesc(e.target.value)}
              rows={3}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAddSystemModal(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 rounded font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSystem}
                className="px-3 py-1.5 bg-sky-600 dark:bg-indigo-600 text-white rounded font-semibold"
              >
                Create System
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Subsystem */}
      {addSubsystemModalSysId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 w-full max-w-md space-y-3 font-mono text-xs shadow-xl">
            <h2 className="text-sm font-bold text-sky-700 dark:text-indigo-400">ADD SUBSYSTEM</h2>
            <input
              type="text"
              placeholder="Subsystem Name *"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
            />
            <textarea
              placeholder="Description..."
              value={subDesc}
              onChange={(e) => setSubDesc(e.target.value)}
              rows={3}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAddSubsystemModalSysId(null)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 rounded font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubsystem}
                className="px-3 py-1.5 bg-sky-600 dark:bg-indigo-600 text-white rounded font-semibold"
              >
                Create Subsystem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Feature */}
      {addFeatureModalSubId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 w-full max-w-md space-y-3 font-mono text-xs shadow-xl">
            <h2 className="text-sm font-bold text-sky-700 dark:text-indigo-400">ADD FEATURE</h2>
            <input
              type="text"
              placeholder="Feature Name *"
              value={featName}
              onChange={(e) => setFeatName(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
            />
            <textarea
              placeholder="Description..."
              value={featDesc}
              onChange={(e) => setFeatDesc(e.target.value)}
              rows={3}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAddFeatureModalSubId(null)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 rounded font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFeature}
                className="px-3 py-1.5 bg-sky-600 dark:bg-indigo-600 text-white rounded font-semibold"
              >
                Create Feature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Demote System */}
      {demoteModalSysId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 w-full max-w-md space-y-3 font-mono text-xs shadow-xl">
            <h2 className="text-sm font-bold text-amber-700 dark:text-amber-400">DEMOTE SYSTEM INTO SUBSYSTEM</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Select the parent system to absorb this system's subsystems as features:
            </p>
            <select
              value={targetSysIdForDemote}
              onChange={(e) => setTargetSysIdForDemote(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="">Select Target System...</option>
              {systems
                .filter((s) => s.id !== demoteModalSysId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDemoteModalSysId(null)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 rounded font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDemoteSystem}
                className="px-3 py-1.5 bg-amber-600 text-white rounded font-semibold"
              >
                Execute Demote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
