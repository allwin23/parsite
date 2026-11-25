import React, { useState } from 'react';
import {
  Calendar,
  Trash2,
  Plus,
  Search,
  Zap,
  Sparkles,
  Settings,
  FolderPlus,
  FileJson,
  Check,
  X,
  Sliders,
} from 'lucide-react';
import { useTraceAssist } from '../../context/TraceAssistContext';
import { getTodayDateLabel } from '../../lib/traceApi';
import type { TraceSessionStatus } from '../../types/database';

export const DaySidebar: React.FC = () => {
  const {
    days,
    activeDayId,
    setActiveDayId,
    activeDay,
    createDay,
    deleteDay,
    exportDayJson,
    filteredSessions,
    activeSessionId,
    setActiveSessionId,
    deleteSession,
    searchQuery,
    setSearchQuery,
    setIsBatchModalOpen,
    setIsSettingsModalOpen,
    setIsProjectPromptModalOpen,
    createSession,
    batchProgress,
  } = useTraceAssist();

  const [confirmDeleteDayId, setConfirmDeleteDayId] = useState<string | null>(null);
  const [isNewDayOpen, setIsNewDayOpen] = useState(false);
  const [newDayLabel, setNewDayLabel] = useState('');
  const [copiedJson, setCopiedJson] = useState(false);

  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);
  const [newSessionTask, setNewSessionTask] = useState('');
  const [newSessionPrompt, setNewSessionPrompt] = useState('');

  const handleCreateCustomDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDayLabel.trim()) return;
    try {
      await createDay(newDayLabel.trim());
      setNewDayLabel('');
      setIsNewDayOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyDayJson = async () => {
    const jsonStr = exportDayJson();
    await navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1500);
  };

  const handleDeleteDayClick = (e: React.MouseEvent, dayId: string) => {
    e.stopPropagation();
    if (confirmDeleteDayId === dayId) {
      deleteDay(dayId);
      setConfirmDeleteDayId(null);
    } else {
      setConfirmDeleteDayId(dayId);
    }
  };

  const handleCreateSingleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTask.trim() || !newSessionPrompt.trim()) return;
    await createSession(newSessionTask.trim(), newSessionPrompt.trim());
    setNewSessionTask('');
    setNewSessionPrompt('');
    setIsNewSessionOpen(false);
  };

  const getStatusBadge = (status: TraceSessionStatus) => {
    switch (status) {
      case 'warming':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            warming
          </span>
        );
      case 'ready':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            ready
          </span>
        );
      case 'active':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            active
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            done
          </span>
        );
    }
  };

  return (
    <div className="w-80 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden">
      {/* Top Action Bar */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Trace Sessions
              </span>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                High-Volume CLI Runs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Gemini Settings & API Key"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
              title="Launch batch of 30-50 CLI trace tasks from JSON"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Batch JSON</span>
            </button>
          </div>
        </div>

        {/* Batch Progress Bar if active */}
        {batchProgress.active && (
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg">
            <div className="flex items-center justify-between text-[11px] text-blue-700 dark:text-blue-300 font-medium mb-1">
              <span>Warming Batch ({batchProgress.completed}/{batchProgress.total})</span>
              <span>{Math.round((batchProgress.completed / batchProgress.total) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(batchProgress.completed / batchProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Date Selector Row */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Folders ({days.length})
            </label>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsProjectPromptModalOpen(true)}
                className={`text-[11px] flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  activeDay?.system_prompt
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 font-semibold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={`Configure System Instruction for folder "${activeDay?.day_label || 'Current'}" (Currently ${activeDay?.system_prompt ? 'Custom' : 'Global Default'})`}
              >
                <Sliders className="w-3 h-3" />
                <span>{activeDay?.system_prompt ? 'Prompt: Custom' : 'Prompt'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyDayJson}
                className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Copy all tasks in active folder as JSON"
              >
                {copiedJson ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied JSON!</span>
                  </>
                ) : (
                  <>
                    <FileJson className="w-3 h-3" />
                    <span>Export JSON</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsNewDayOpen(!isNewDayOpen);
                  if (!isNewDayOpen) setNewDayLabel('');
                }}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
                title="Create a new date folder or custom named folder"
              >
                <FolderPlus className="w-3 h-3" />
                <span>+ Folder</span>
              </button>
            </div>
          </div>

          {/* Inline New Folder Form */}
          {isNewDayOpen && (
            <form
              onSubmit={handleCreateCustomDay}
              className="p-2 mb-2 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg space-y-1.5 animate-in fade-in"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-300">
                <span>New Folder Name</span>
                <button
                  type="button"
                  onClick={() => setNewDayLabel(getTodayDateLabel())}
                  className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                >
                  Use Today's Date
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. 2026-11-26, Sprint-Auth, CLI-Evals"
                  value={newDayLabel}
                  onChange={(e) => setNewDayLabel(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewDayOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {days.map((day) => {
              const isActive = day.id === activeDayId;
              const isConfirming = confirmDeleteDayId === day.id;

              return (
                <div
                  key={day.id}
                  className={`group relative flex items-center shrink-0 rounded-lg border text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700/80'
                  }`}
                >
                  <button
                    onClick={() => {
                      setActiveDayId(day.id);
                      setConfirmDeleteDayId(null);
                    }}
                    className="px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{day.day_label}</span>
                    {day.system_prompt && (
                      <span
                        title="Custom System Instruction configured for this folder"
                        className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"
                      />
                    )}
                    <span className="text-[10px] px-1 py-0.2 rounded-full bg-black/10 dark:bg-black/20 font-mono">
                      {day.session_count || 0}
                    </span>
                  </button>

                  {/* Wipe Day Folder Button */}
                  <button
                    onClick={(e) => handleDeleteDayClick(e, day.id)}
                    className={`p-1.5 pr-2 transition-colors cursor-pointer ${
                      isConfirming
                        ? 'text-rose-500 dark:text-rose-400 animate-pulse font-bold'
                        : 'text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                    }`}
                    title={isConfirming ? 'Click again to permanently wipe day' : 'Delete date folder'}
                  >
                    {isConfirming ? (
                      <span className="text-[10px] text-rose-500 font-bold">Wipe?</span>
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Search & New Single Session CTA */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search 50 sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => setIsNewSessionOpen(!isNewSessionOpen)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Create single session manually"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Manual Single Session Form Popover */}
      {isNewSessionOpen && (
        <form
          onSubmit={handleCreateSingleSession}
          className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900/60 space-y-2 text-xs animate-in fade-in"
        >
          <div className="flex items-center justify-between font-semibold text-blue-900 dark:text-blue-300">
            <span>New Task Session</span>
            <button
              type="button"
              onClick={() => setIsNewSessionOpen(false)}
              className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            type="text"
            required
            placeholder="Task name (e.g. fix-oauth-callback)"
            value={newSessionTask}
            onChange={(e) => setNewSessionTask(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
          />
          <textarea
            required
            rows={2}
            placeholder="Initial CLI prompt description..."
            value={newSessionPrompt}
            onChange={(e) => setNewSessionPrompt(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-mono text-[11px]"
          />
          <button
            type="submit"
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-xs cursor-pointer"
          >
            Create & Warmup
          </button>
        </form>
      )}

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 px-4 text-xs text-slate-400 dark:text-slate-500">
            {searchQuery ? (
              'No sessions matched query'
            ) : (
              <div>
                <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  No sessions in this day folder
                </p>
                <p>Click "+ Batch JSON" to launch 30-50 CLI trace tasks.</p>
              </div>
            )}
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isSelected = session.id === activeSessionId;

            return (
              <div
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-300 dark:bg-blue-950/40 dark:border-blue-800 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span
                    className={`font-semibold text-xs truncate leading-snug ${
                      isSelected
                        ? 'text-blue-900 dark:text-blue-200'
                        : 'text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                    }`}
                  >
                    {session.task_name}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">
                  {session.initial_prompt}
                </p>

                <div className="flex items-center justify-between text-[11px]">
                  {getStatusBadge(session.status)}
                  <span className="font-mono text-slate-400 dark:text-slate-500 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    T: {session.turn_count || 0}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
