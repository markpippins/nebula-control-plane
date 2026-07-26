import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight, Layers, HelpCircle, FileCheck, Boxes } from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';
import { apiRequest } from '../../services/apiClient';
import { SearchResultItem } from '../../types/nebula';

export const SearchModal: React.FC = () => {
  const { searchOpen, setSearchOpen, setActiveTab } = useNebula();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiRequest<{ results: SearchResultItem[] }>(
          `/search?q=${encodeURIComponent(query)}`
        );
        setResults(res.results || []);
      } catch (err) {
        console.warn('[SearchModal] Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!searchOpen) return null;

  const handleNavigate = (href: string) => {
    if (href.includes('requirements')) setActiveTab('kanban');
    else if (href.includes('systems')) setActiveTab('systems');
    else if (href.includes('questions')) setActiveTab('questions');
    else if (href.includes('audit')) setActiveTab('audit');
    else setActiveTab('dashboard');

    setSearchOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-start justify-center pt-20 px-4 z-50 font-mono text-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg w-full max-w-xl shadow-2xl overflow-hidden space-y-0">
        {/* Search Header Input */}
        <div className="p-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-300 dark:border-slate-800 flex items-center gap-2">
          <Search className="w-4 h-4 text-sky-600 dark:text-indigo-400" />
          <input
            type="text"
            placeholder="Search across all 13 nebula entity types..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-500 outline-none font-semibold"
          />
          <button
            onClick={() => setSearchOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {results.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNavigate(item.href)}
              className="p-2.5 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-800/80 cursor-pointer flex items-center justify-between group transition-colors"
            >
              <div className="space-y-0.5 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-sky-100 dark:bg-indigo-950 text-sky-900 dark:text-indigo-300 border border-sky-300 dark:border-indigo-800 uppercase font-bold">
                    {item.type}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.title}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">{item.description}</p>
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-indigo-400 shrink-0" />
            </div>
          ))}

          {query.length >= 2 && results.length === 0 && !loading && (
            <div className="py-8 text-center text-slate-500 italic">
              No matching nebula entities found for "{query}"
            </div>
          )}

          {query.length < 2 && (
            <div className="py-6 text-center text-slate-500 italic">
              Type at least 2 characters to search requirements, systems, open questions, agent logs & plans...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
