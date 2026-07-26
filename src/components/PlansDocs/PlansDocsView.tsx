import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle2, Layers, BookOpen } from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';
import { apiRequest } from '../../services/apiClient';
import { ImplementationPlan } from '../../types/nebula';

export const PlansDocsView: React.FC = () => {
  const { triggerRefresh } = useNebula();
  const [plans, setPlans] = useState<ImplementationPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ items: ImplementationPlan[] }>('/plans');
      setPlans(res.items || []);
    } catch (err) {
      console.warn('[PlansDocsView] Error loading data:', err);
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
        <h1 className="text-lg font-bold tracking-tight text-teal-700 dark:text-teal-400 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          IMPLEMENTATION PLANS & AUDIT PROJECTION FILES
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Generated conduit plans, goal specifications, and filesystem projection documents
        </p>
      </div>

      <div className="space-y-3">
        {plans.map((p) => (
          <div
            key={p.id}
            className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-2.5 shadow-xs"
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
    </div>
  );
};
