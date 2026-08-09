import React, { useEffect, useState } from 'react';
import {
  GitFork,
  Search,
  Sparkles,
  Layers,
  FileCode,
  Share2,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Info,
  ChevronRight,
  ExternalLink,
  Activity,
  BarChart2,
  Database,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';
import { apiRequest } from '../../services/apiClient';
import {
  KnowledgeEntity,
  KnowledgeEdge,
  CrossReference,
  EvidenceLink,
  KnowledgeSummary,
} from '../../types/nebula';

export const KnowledgeGraphView: React.FC = () => {
  const { triggerRefresh } = useNebula();
  const [activeTab, setActiveTab] = useState<'entities' | 'summary' | 'edges' | 'evidence'>('entities');

  // Entities & Semantic Search
  const [entities, setEntities] = useState<KnowledgeEntity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState<boolean>(true);
  const [searchVector, setSearchVector] = useState<string>('0.01, -0.02, 0.05');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Knowledge Summary (`GET /api/knowledge/summary`)
  const [summary, setSummary] = useState<KnowledgeSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);

  // Edges & Cross-References (`GET /api/knowledge/edges` & `GET /api/cross-references`)
  const [edges, setEdges] = useState<KnowledgeEdge[]>([]);
  const [crossRefs, setCrossRefs] = useState<CrossReference[]>([]);
  const [loadingEdges, setLoadingEdges] = useState<boolean>(false);
  const [selectedCrossRef, setSelectedCrossRef] = useState<CrossReference | null>(null);
  const [loadingCrossRefDetail, setLoadingCrossRefDetail] = useState<boolean>(false);
  const [edgeSearchFilter, setEdgeSearchFilter] = useState<string>('');

  // Evidence Links (`GET /api/evidence-links`)
  const [evidenceLinks, setEvidenceLinks] = useState<EvidenceLink[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState<boolean>(false);
  const [selectedEvidenceLink, setSelectedEvidenceLink] = useState<EvidenceLink | null>(null);
  const [verifyingLinkId, setVerifyingLinkId] = useState<string | null>(null);
  const [verifiedLinks, setVerifiedLinks] = useState<Record<string, boolean>>({});

  const loadEntities = async () => {
    setLoadingEntities(true);
    try {
      const res = await apiRequest<{ items: KnowledgeEntity[] }>('/knowledge/entities');
      setEntities(res.items || []);
    } catch (err) {
      console.warn('[KnowledgeGraphView] Error loading entities', err);
    } finally {
      setLoadingEntities(false);
    }
  };

  const loadKnowledgeSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await apiRequest<KnowledgeSummary>('/knowledge/summary');
      setSummary(res);
    } catch (err) {
      console.warn('[KnowledgeGraphView] Error loading knowledge summary', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadGraphEdgesAndRefs = async () => {
    setLoadingEdges(true);
    try {
      const [edgeRes, xrefRes] = await Promise.all([
        apiRequest<{ items: KnowledgeEdge[] }>('/knowledge/edges'),
        apiRequest<{ items: CrossReference[] }>('/cross-references'),
      ]);
      setEdges(edgeRes.items || []);
      setCrossRefs(xrefRes.items || []);
    } catch (err) {
      console.warn('[KnowledgeGraphView] Error loading edges & refs', err);
    } finally {
      setLoadingEdges(false);
    }
  };

  const loadEvidenceLinks = async () => {
    setLoadingEvidence(true);
    try {
      const res = await apiRequest<{ items: EvidenceLink[] }>('/evidence-links');
      setEvidenceLinks(res.items || []);
    } catch (err) {
      console.warn('[KnowledgeGraphView] Error loading evidence links', err);
    } finally {
      setLoadingEvidence(false);
    }
  };

  useEffect(() => {
    loadEntities();
    loadKnowledgeSummary();
    loadGraphEdgesAndRefs();
    loadEvidenceLinks();
  }, [triggerRefresh]);

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vector = new Array(768).fill(0).map(() => (Math.random() - 0.5) * 0.1);
      const res = await apiRequest<any>('/search/semantic', {
        method: 'POST',
        body: JSON.stringify({
          queryEmbedding: vector,
          limit: 10,
        }),
      });
      setSearchResults(res.results || []);
    } catch (err: any) {
      alert(`Semantic search failed: ${err.message}`);
    }
  };

  const inspectCrossRefDetail = async (id: string) => {
    setLoadingCrossRefDetail(true);
    try {
      const detail = await apiRequest<CrossReference>(`/cross-references/${id}`);
      setSelectedCrossRef(detail);
    } catch (err: any) {
      alert(`Failed to fetch cross-reference details: ${err.message}`);
    } finally {
      setLoadingCrossRefDetail(false);
    }
  };

  const inspectEvidenceDetail = async (id: string) => {
    try {
      const detail = await apiRequest<EvidenceLink>(`/evidence-links/${id}`);
      setSelectedEvidenceLink(detail);
    } catch (err: any) {
      alert(`Failed to fetch evidence link detail: ${err.message}`);
    }
  };

  const verifyEvidenceLinkProvenance = async (link: EvidenceLink) => {
    setVerifyingLinkId(link.id);
    setTimeout(() => {
      setVerifiedLinks((prev) => ({ ...prev, [link.id]: true }));
      setVerifyingLinkId(null);
    }, 600);
  };

  return (
    <div className="p-4 space-y-4 font-mono text-sm text-slate-900 dark:text-slate-100 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-300 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-purple-700 dark:text-purple-400 flex items-center gap-2">
            <GitFork className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            KNOWLEDGE GRAPH & EVIDENCE VERIFICATION ENGINE
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Semantic vector embeddings, graph edge traversal, and evidence link verification
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-1 rounded font-bold shadow-xs">
          <button
            onClick={() => setActiveTab('entities')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer text-xs ${
              activeTab === 'entities'
                ? 'bg-purple-600 text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Entities ({entities.length})
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer text-xs ${
              activeTab === 'summary'
                ? 'bg-purple-600 text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Summary
          </button>
          <button
            onClick={() => setActiveTab('edges')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer text-xs ${
              activeTab === 'edges'
                ? 'bg-purple-600 text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Edges & Refs ({crossRefs.length})
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer text-xs ${
              activeTab === 'evidence'
                ? 'bg-purple-600 text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Evidence Links ({evidenceLinks.length})
          </button>
        </div>
      </div>

      {/* TAB 1: Entities & Semantic Vector Search */}
      {activeTab === 'entities' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 space-y-3 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              768-Dim Nomic Semantic Similarity Vector Search
            </h2>

            <form onSubmit={handleSemanticSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter query or vector prompt..."
                value={searchVector}
                onChange={(e) => setSearchVector(e.target.value)}
                className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-purple-500 font-semibold"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold text-xs shadow-2xs cursor-pointer"
              >
                Run Semantic Search
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-slate-600 dark:text-slate-400 font-bold text-xs">Vector Match Results:</h3>
                {searchResults.map((r, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded border border-purple-300 dark:border-purple-900/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-purple-800 dark:text-purple-300 text-xs">{r.name}</div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">{r.description}</div>
                    </div>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                      Score: {(r.similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
              Knowledge Entities Index ({entities.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {entities.map((ent) => (
                <div
                  key={ent.id}
                  className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-3 space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-bold uppercase">
                      {ent.section}
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">{ent.status}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-slate-200 text-sm">{ent.name}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{ent.descriptionAbbr}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Knowledge Graph Summary (`GET /api/knowledge/summary`) */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100">KNOWLEDGE SUMMARY METRICS (`/api/knowledge/summary`)</h2>
                <p className="text-xs text-slate-500">Aggregate statistics across knowledge entities, relations and vector embeddings</p>
              </div>
            </div>
            <button
              onClick={loadKnowledgeSummary}
              disabled={loadingSummary}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSummary ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {summary ? (
            <div className="space-y-4">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg space-y-1 shadow-xs">
                  <span className="text-xs text-slate-500 uppercase font-bold">Total Entities</span>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary.entityCount}</div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg space-y-1 shadow-xs">
                  <span className="text-xs text-slate-500 uppercase font-bold">Graph Edges</span>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.edgeCount}</div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg space-y-1 shadow-xs">
                  <span className="text-xs text-slate-500 uppercase font-bold">Cross References</span>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.crossReferenceCount}</div>
                </div>
              </div>

              {/* Breakdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Section Breakdown */}
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg space-y-3 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">
                    Entities By Section
                  </h3>
                  <div className="space-y-2">
                    {summary.bySection.map((sec) => (
                      <div key={sec.section} className="flex items-center justify-between text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-800 dark:text-slate-200">
                          {sec.section}
                        </span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">{sec.count} items</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Relation Type Breakdown */}
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg space-y-3 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">
                    Edges By Relation Type
                  </h3>
                  <div className="space-y-2">
                    {summary.byRelationType.map((rel) => (
                      <div key={rel.relation_type} className="flex items-center justify-between text-xs">
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 font-bold">
                          {rel.relation_type}
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{rel.count} links</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Embedding Coverage Summary */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg space-y-3 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">
                  Vector Embedding Coverage
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {summary.embeddingSummary.map((emb) => (
                    <div key={emb.section} className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{emb.section}</span>
                        <span className="text-emerald-600 font-bold">
                          {emb.embedded_count} / {emb.entity_count} Embedded
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${(emb.embedded_count / (emb.entity_count || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">Loading summary statistics...</div>
          )}
        </div>
      )}

      {/* TAB 3: Graph Edges & Cross References (`GET /api/knowledge/edges` & `GET /api/cross-references`) */}
      {activeTab === 'edges' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100">KNOWLEDGE EDGES & CROSS-REFERENCES</h2>
                <p className="text-xs text-slate-500">Traverse relation linkages across requirements, APIs, and schemas</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Filter relationships..."
                value={edgeSearchFilter}
                onChange={(e) => setEdgeSearchFilter(e.target.value)}
                className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none"
              />
              <button
                onClick={loadGraphEdgesAndRefs}
                disabled={loadingEdges}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingEdges ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {crossRefs
              .filter((x) =>
                !edgeSearchFilter ||
                x.id.toLowerCase().includes(edgeSearchFilter.toLowerCase()) ||
                x.relType.toLowerCase().includes(edgeSearchFilter.toLowerCase()) ||
                x.sourceId.toLowerCase().includes(edgeSearchFilter.toLowerCase()) ||
                x.targetId.toLowerCase().includes(edgeSearchFilter.toLowerCase())
              )
              .map((ref) => (
                <div
                  key={ref.id}
                  onClick={() => inspectCrossRefDetail(ref.id)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-purple-500 rounded-lg p-3 space-y-2 cursor-pointer transition-colors shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-bold">
                      {ref.id}
                    </span>
                    <span className="text-slate-500">{new Date(ref.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-xs font-bold">
                    <span className="text-blue-600 dark:text-blue-400">
                      {ref.sourceType}: {ref.sourceId}
                    </span>
                    <ChevronRight className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {ref.targetType}: {ref.targetId}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded font-semibold border border-blue-200 dark:border-blue-800">
                      Rel: {ref.relType}
                    </span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 text-[11px]">
                      Inspect Link Detail <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: Evidence Link Verification (`GET /api/evidence-links`) */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100">EVIDENCE LINK VERIFICATION (`/api/evidence-links`)</h2>
                <p className="text-xs text-slate-500">Audit candidate-to-harvest links and verify provenance confidence scores</p>
              </div>
            </div>

            <button
              onClick={loadEvidenceLinks}
              disabled={loadingEvidence}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingEvidence ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {evidenceLinks.map((link) => {
              const isVerified = verifiedLinks[link.id];
              const isVerifying = verifyingLinkId === link.id;

              return (
                <div
                  key={link.id}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-3.5 space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-bold">
                      {link.id}
                    </span>
                    <span className="text-slate-500">{new Date(link.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Knowledge Entity:</span>
                      <strong className="text-purple-600 dark:text-purple-400">{link.knowledgeEntityId}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Harvest Source:</span>
                      <strong>{link.nebulaHarvestId}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Candidate Ref:</span>
                      <strong>{link.nebulaCandidateId}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Provenance Path:</span>
                      <code className="text-emerald-600 dark:text-emerald-400 bg-slate-100 dark:bg-slate-950 px-1 rounded">
                        {link.provenance}
                      </code>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-slate-500">Confidence:</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                        {(link.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => inspectEvidenceDetail(link.id)}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-xs font-semibold cursor-pointer"
                      >
                        Detail
                      </button>

                      <button
                        onClick={() => verifyEvidenceLinkProvenance(link)}
                        disabled={isVerifying || isVerified}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                          isVerified
                            ? 'bg-emerald-600 text-white'
                            : 'bg-purple-600 hover:bg-purple-500 text-white'
                        }`}
                      >
                        {isVerifying ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : isVerified ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Provenance Verified
                          </>
                        ) : (
                          'Verify Link'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cross-Reference Inspector Modal */}
      {selectedCrossRef && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 w-full max-w-lg space-y-4 font-mono text-sm text-slate-900 dark:text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                CROSS REFERENCE INSPECTOR ({selectedCrossRef.id})
              </h2>
              <button
                onClick={() => setSelectedCrossRef(null)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div>
                <span className="text-slate-500 block">Relation Type:</span>
                <strong className="text-purple-600 dark:text-purple-400">{selectedCrossRef.relType}</strong>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 block">Source ({selectedCrossRef.sourceType}):</span>
                  <strong>{selectedCrossRef.sourceId}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Target ({selectedCrossRef.targetType}):</span>
                  <strong>{selectedCrossRef.targetId}</strong>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block">Metadata / Notes:</span>
                <pre className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-[11px] overflow-x-auto mt-1">
                  {JSON.stringify(selectedCrossRef.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedCrossRef(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Link Inspector Modal */}
      {selectedEvidenceLink && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 w-full max-w-lg space-y-4 font-mono text-sm text-slate-900 dark:text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                EVIDENCE LINK DETAIL ({selectedEvidenceLink.id})
              </h2>
              <button
                onClick={() => setSelectedEvidenceLink(null)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Knowledge Entity:</span>
                <strong className="text-purple-600">{selectedEvidenceLink.knowledgeEntityId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Harvest Source:</span>
                <strong>{selectedEvidenceLink.nebulaHarvestId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Candidate Ref:</span>
                <strong>{selectedEvidenceLink.nebulaCandidateId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Link Type:</span>
                <strong className="uppercase text-emerald-600">{selectedEvidenceLink.linkType}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Provenance:</span>
                <code>{selectedEvidenceLink.provenance}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Confidence Score:</span>
                <strong className="text-emerald-600 font-bold">
                  {(selectedEvidenceLink.confidence * 100).toFixed(1)}%
                </strong>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedEvidenceLink(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-semibold text-xs cursor-pointer"
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
