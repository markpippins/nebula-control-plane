import React, { useEffect, useState } from 'react';
import {
  HelpCircle,
  Plus,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  UserCheck,
  Clock,
  Send,
  X,
} from 'lucide-react';
import { useNebula } from '../../context/NebulaContext';
import { apiRequest } from '../../services/apiClient';
import { OpenQuestion, OpenQuestionAnswer } from '../../types/nebula';

export const OpenQuestionsView: React.FC = () => {
  const { triggerRefresh, refreshCounts } = useNebula();
  const [questions, setQuestions] = useState<OpenQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedQuestion, setSelectedQuestion] = useState<OpenQuestion | null>(null);

  // New question form modal
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [qTitle, setQTitle] = useState('');
  const [qDesc, setQDesc] = useState('');
  const [qCategory, setQCategory] = useState<OpenQuestion['category']>('AMBIGUITY');
  const [qBlocking, setQBlocking] = useState(false);

  // Answer form
  const [ansText, setAnsText] = useState('');
  const [ansRole, setAnsRole] = useState('architect');
  const [ansConfidence, setAnsConfidence] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ items: OpenQuestion[] } | { questions: OpenQuestion[] } | OpenQuestion[]>('/open-questions');
      const items = Array.isArray(res)
        ? res
        : Array.isArray((res as any)?.questions)
        ? (res as any).questions
        : Array.isArray((res as any)?.items)
        ? (res as any).items
        : [];
      setQuestions(items);
      if (items.length > 0 && !selectedQuestion) {
        setSelectedQuestion(items[0]);
      }
    } catch (err) {
      console.warn('[OpenQuestionsView] Error loading questions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [triggerRefresh]);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTitle) return;

    try {
      await apiRequest('/open-questions', {
        method: 'POST',
        body: JSON.stringify({
          title: qTitle,
          description: qDesc,
          category: qCategory,
          blocking: qBlocking,
        }),
      });
      setCreateModalOpen(false);
      setQTitle('');
      setQDesc('');
      loadQuestions();
      refreshCounts();
    } catch (err: any) {
      alert(`Failed to create question: ${err.message}`);
    }
  };

  const handleAddAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion || !ansText) return;

    try {
      const newAns = await apiRequest<OpenQuestionAnswer>(
        `/open-questions/${selectedQuestion.id}/answers`,
        {
          method: 'POST',
          body: JSON.stringify({
            answer: ansText,
            role: ansRole,
            confidence: ansConfidence,
          }),
        }
      );

      // Local state update
      const updated = {
        ...selectedQuestion,
        answers: [...(selectedQuestion.answers || []), newAns],
      };
      setSelectedQuestion(updated);
      setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      setAnsText('');
    } catch (err: any) {
      alert(`Failed to submit answer: ${err.message}`);
    }
  };

  const handleResolveQuestion = async (qId: string) => {
    try {
      await apiRequest(`/open-questions/${qId}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ resolvedBy: 'architect' }),
      });
      loadQuestions();
      refreshCounts();
    } catch (err: any) {
      alert(`Resolution failed: ${err.message}`);
    }
  };

  return (
    <div className="p-4 space-y-4 font-sans text-slate-900 dark:text-slate-100 overflow-y-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 dark:border-slate-800 pb-3 shrink-0">
        <div>
          <h1 className="text-lg font-bold font-mono tracking-tight text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            OPEN QUESTIONS & ROLE DELIBERATION
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Ambiguity & conflict resolution protocol between Architect, Engineer, and Inspector roles
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-mono font-semibold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Raise Open Question
        </button>
      </div>

      {/* Main Grid: Question List + Deliberation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0 font-mono text-xs">
        {/* Left List */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-3 overflow-y-auto space-y-2 shadow-xs">
          {questions.map((q) => {
            const isSelected = selectedQuestion?.id === q.id;

            return (
              <div
                key={q.id}
                onClick={() => setSelectedQuestion(q)}
                className={`p-3 rounded border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 dark:border-amber-500/80 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-bold border border-slate-300 dark:border-slate-700">
                    {q.category}
                  </span>
                  <span
                    className={`font-bold ${
                      q.status === 'RESOLVED' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {q.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-slate-200 line-clamp-2">{q.title}</h3>

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  <span>Answers: {q.answers?.length || 0}</span>
                  {q.blocking && (
                    <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                      BLOCKING
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Deliberation Detail */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-lg p-4 flex flex-col justify-between space-y-3 overflow-y-auto shadow-xs">
          {selectedQuestion ? (
            <div className="space-y-4">
              {/* Question Header */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                    {selectedQuestion.category}
                  </span>
                  {selectedQuestion.status === 'OPEN' && (
                    <button
                      onClick={() => handleResolveQuestion(selectedQuestion.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Resolved
                    </button>
                  )}
                </div>

                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedQuestion.title}</h2>
                <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                  {selectedQuestion.description}
                </p>
              </div>

              {/* Answers & Deliberation Threads */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Role Deliberation Answers ({selectedQuestion.answers?.length || 0})
                </h3>

                <div className="space-y-2">
                  {selectedQuestion.answers?.map((ans) => (
                    <div
                      key={ans.id}
                      className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold uppercase text-sky-800 dark:text-indigo-400 px-2 py-0.5 bg-sky-100 dark:bg-indigo-950 rounded border border-sky-300 dark:border-indigo-800">
                          Role: {ans.role}
                        </span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                          Confidence: {ans.confidence}
                        </span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed">{ans.answer}</p>
                      {ans.reasoning && (
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] italic">
                          Rationale: {ans.reasoning}
                        </p>
                      )}
                    </div>
                  ))}

                  {(!selectedQuestion.answers || selectedQuestion.answers.length === 0) && (
                    <div className="text-center py-6 text-slate-400 dark:text-slate-500 italic">
                      No answers submitted yet for this open question.
                    </div>
                  )}
                </div>
              </div>

              {/* Add Answer Form */}
              {selectedQuestion.status === 'OPEN' && (
                <form
                  onSubmit={handleAddAnswer}
                  className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <select
                      value={ansRole}
                      onChange={(e) => setAnsRole(e.target.value)}
                      className="bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-1.5 text-slate-800 dark:text-slate-200 text-xs font-semibold"
                    >
                      <option value="architect" className="bg-white dark:bg-slate-900">Role: Architect</option>
                      <option value="engineer" className="bg-white dark:bg-slate-900">Role: Engineer</option>
                      <option value="reviewer" className="bg-white dark:bg-slate-900">Role: Reviewer</option>
                      <option value="inspector" className="bg-white dark:bg-slate-900">Role: Inspector</option>
                    </select>

                    <select
                      value={ansConfidence}
                      onChange={(e) => setAnsConfidence(e.target.value as any)}
                      className="bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-1.5 text-slate-800 dark:text-slate-200 text-xs font-semibold"
                    >
                      <option value="HIGH" className="bg-white dark:bg-slate-900">Confidence: HIGH</option>
                      <option value="MEDIUM" className="bg-white dark:bg-slate-900">Confidence: MEDIUM</option>
                      <option value="LOW" className="bg-white dark:bg-slate-900">Confidence: LOW</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Submit answer and deliberation consensus..."
                      value={ansText}
                      onChange={(e) => setAnsText(e.target.value)}
                      className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 text-xs outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold flex items-center gap-1.5 shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Submit
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 italic">
              Select an open question to view deliberation
            </div>
          )}
        </div>
      </div>

      {/* Raise Question Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 w-full max-w-md space-y-3 font-mono text-xs shadow-xl">
            <h2 className="text-sm font-bold text-amber-700 dark:text-amber-400">RAISE OPEN QUESTION</h2>
            <input
              type="text"
              placeholder="Question Title *"
              value={qTitle}
              onChange={(e) => setQTitle(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
            />
            <textarea
              placeholder="Description & context..."
              value={qDesc}
              onChange={(e) => setQDesc(e.target.value)}
              rows={3}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
            />
            <select
              value={qCategory}
              onChange={(e) => setQCategory(e.target.value as any)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="AMBIGUITY" className="bg-white dark:bg-slate-900">AMBIGUITY</option>
              <option value="MISSING_INFO" className="bg-white dark:bg-slate-900">MISSING_INFO</option>
              <option value="CONFLICT" className="bg-white dark:bg-slate-900">CONFLICT</option>
              <option value="SCOPE" className="bg-white dark:bg-slate-900">SCOPE</option>
              <option value="DEPENDENCY" className="bg-white dark:bg-slate-900">DEPENDENCY</option>
              <option value="DUPLICATE_CANDIDATE" className="bg-white dark:bg-slate-900">DUPLICATE_CANDIDATE</option>
              <option value="WORK_COMPLETED" className="bg-white dark:bg-slate-900">WORK_COMPLETED</option>
            </select>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="blocking"
                checked={qBlocking}
                onChange={(e) => setQBlocking(e.target.checked)}
              />
              <label htmlFor="blocking" className="text-slate-700 dark:text-slate-300 font-semibold">
                Mark as Blocking Issue
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 rounded font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuestion}
                className="px-3 py-1.5 bg-amber-600 text-white rounded font-semibold"
              >
                Raise Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
