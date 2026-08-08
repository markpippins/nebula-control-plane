import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Server,
} from 'lucide-react';
import { toastService, Toast } from '../../services/toastService';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = toastService.subscribe((newToasts) => {
      setToasts(newToasts);
    });
    return unsubscribe;
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToastDetails = (toast: Toast) => {
    const content = `[${toast.statusCode ? `HTTP ${toast.statusCode}` : 'ERROR'}] ${toast.title}
Endpoint: ${toast.endpoint || 'N/A'}
Message: ${toast.message}
${toast.details ? `Details:\n${toast.details}` : ''}`;

    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(toast.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-md w-full px-4 sm:px-0 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const is500 = (toast.statusCode || 0) >= 500;
          const isWarning = toast.type === 'warning';
          const isSuccess = toast.type === 'success';
          const isExpanded = !!expandedIds[toast.id];
          const isCopied = copiedId === toast.id;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto rounded-lg border shadow-xl backdrop-blur-md p-3.5 text-xs flex flex-col gap-2 transition-colors ${
                isError
                  ? 'bg-red-950/90 border-red-800/80 text-red-100 dark:bg-red-950/95 dark:border-red-700/80'
                  : isWarning
                  ? 'bg-amber-950/90 border-amber-800/80 text-amber-100'
                  : isSuccess
                  ? 'bg-emerald-950/90 border-emerald-800/80 text-emerald-100'
                  : 'bg-slate-900/90 border-slate-700/80 text-slate-100'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold">
                  {isError ? (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  ) : isWarning ? (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : isSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Info className="w-4 h-4 text-blue-400 shrink-0" />
                  )}
                  <span className="truncate">{toast.title}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Status code badge */}
                  {toast.statusCode !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        is500
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : toast.statusCode >= 400
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {toast.statusCode === 0 ? 'NET_ERR' : `HTTP ${toast.statusCode}`}
                    </span>
                  )}

                  {/* Copy button */}
                  <button
                    onClick={() => copyToastDetails(toast)}
                    title="Copy Error Details"
                    className="p-1 hover:bg-white/10 rounded text-slate-300 transition-colors"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {/* Dismiss button */}
                  <button
                    onClick={() => toastService.dismiss(toast.id)}
                    className="p-1 hover:bg-white/10 rounded text-slate-300 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Endpoint banner */}
              {toast.endpoint && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/30 text-[11px] font-mono text-slate-300 border border-white/5">
                  <Server className="w-3 h-3 text-slate-400" />
                  <span className="truncate">{toast.endpoint}</span>
                </div>
              )}

              {/* Message */}
              <div className="text-slate-200 leading-relaxed font-normal">
                {toast.message}
              </div>

              {/* Expandable Stack Trace / Details */}
              {toast.details && (
                <div className="mt-1">
                  <button
                    onClick={() => toggleExpand(toast.id)}
                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white transition-colors font-medium"
                  >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {isExpanded ? 'Hide Details' : 'Show Error Details / Stack'}
                  </button>

                  {isExpanded && (
                    <motion.pre
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-1.5 p-2 bg-black/60 rounded border border-white/10 text-[10px] font-mono text-red-200 overflow-x-auto max-h-40 whitespace-pre-wrap break-all"
                    >
                      {toast.details}
                    </motion.pre>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
