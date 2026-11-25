import React, { useState, useMemo } from 'react';
import { X, Sparkles, Check, AlertCircle, Upload, Code2 } from 'lucide-react';
import { useTraceAssist } from '../../context/TraceAssistContext';
import { getTodayDateLabel } from '../../lib/traceApi';
import type { BatchTaskItem } from '../../types/database';

export const BatchJsonModal: React.FC = () => {
  const {
    isBatchModalOpen,
    setIsBatchModalOpen,
    launchBatchTasks,
    days,
    activeDayId,
    activeDay,
    createDay,
  } = useTraceAssist();

  const [destinationMode, setDestinationMode] = useState<'existing' | 'new'>('existing');
  const [selectedDayId, setSelectedDayId] = useState<string>(activeDayId || '');
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [customSystemPrompt, setCustomSystemPrompt] = useState<string>('');

  const [jsonInput, setJsonInput] = useState<string>(() => {
    return JSON.stringify(
      {
        'fix-auth-race': 'Investigate why token refresh fails when multiple concurrent requests trigger 401.',
        'add-redis-cache': 'Implement distributed cache around session validation queries with 5min TTL.',
        'optimize-vector-indexing': 'Refactor pgvector HNSW index parameters for higher query throughput under load.',
        'docker-rootless-harden': 'Update Dockerfile to run as non-root user nodejs with clean dumb-init.',
      },
      null,
      2
    );
  });

  const loadDictSample = () => {
    setJsonInput(
      JSON.stringify(
        {
          'fix-auth-race': 'Investigate why token refresh fails when multiple concurrent requests trigger 401.',
          'add-redis-cache': 'Implement distributed cache around session validation queries with 5min TTL.',
          'optimize-vector-indexing': 'Refactor pgvector HNSW index parameters for higher query throughput under load.',
        },
        null,
        2
      )
    );
  };

  const loadArraySample = () => {
    setJsonInput(
      JSON.stringify(
        [
          {
            task_name: 'fix-auth-race',
            prompt: 'Investigate why token refresh fails when multiple concurrent requests trigger 401.',
          },
          {
            task_name: 'add-redis-cache',
            prompt: 'Implement distributed cache around session validation queries with 5min TTL.',
          },
          {
            task_name: 'optimize-vector-indexing',
            prompt: 'Refactor pgvector HNSW index parameters for higher query throughput under load.',
          },
        ],
        null,
        2
      )
    );
  };

  const { parsedTasks, error } = useMemo<{ parsedTasks: BatchTaskItem[]; error: string | null }>(() => {
    if (!jsonInput.trim()) {
      return { parsedTasks: [], error: null };
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const results: BatchTaskItem[] = [];

      // Format 1: Array of objects [{ task_name, prompt }]
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === 'object' && item !== null) {
            const taskName =
              item.task_name || item.name || item.task || item.id || `task-${results.length + 1}`;
            const prompt = item.prompt || item.initial_prompt || item.content || item.description || '';
            if (prompt) {
              results.push({
                task_name: String(taskName),
                prompt: String(prompt),
              });
            }
          }
        }
      }
      // Format 2: Key-value dictionary { "task_name": "prompt text" }
      else if (typeof parsed === 'object' && parsed !== null) {
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === 'string') {
            results.push({
              task_name: key,
              prompt: value,
            });
          } else if (typeof value === 'object' && value !== null) {
            const prompt = (value as Record<string, unknown>).prompt || (value as Record<string, unknown>).initial_prompt || '';
            if (prompt) {
              results.push({
                task_name: key,
                prompt: String(prompt),
              });
            }
          }
        }
      }

      if (results.length === 0) {
        return {
          parsedTasks: [],
          error: 'JSON parsed but no valid tasks found. Use { "task-name": "prompt text" } or [{ "task_name": "...", "prompt": "..." }].',
        };
      }

      return { parsedTasks: results, error: null };
    } catch (err) {
      return { parsedTasks: [], error: 'Invalid JSON format: ' + (err as Error).message };
    }
  }, [jsonInput]);

  if (!isBatchModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedTasks.length === 0) return;

    let targetDay = selectedDayId || activeDayId;

    if (destinationMode === 'new') {
      const folderName = newFolderName.trim() || getTodayDateLabel();
      const promptToUse = customSystemPrompt.trim() ? customSystemPrompt.trim() : null;
      const created = await createDay(folderName, promptToUse);
      targetDay = created.id;
    }

    if (!targetDay) return;

    await launchBatchTasks(parsedTasks, targetDay);
    setIsBatchModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Bulk JSON Session Launcher
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Launch 30–50 CLI trace tasks into existing or new custom folders with concurrency pool
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsBatchModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Destination Folder Selector */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Target Folder
            </label>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="destMode"
                  checked={destinationMode === 'existing'}
                  onChange={() => setDestinationMode('existing')}
                  className="text-blue-600"
                />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Existing Folder:
                </span>
              </label>

              <select
                disabled={destinationMode !== 'existing'}
                value={selectedDayId}
                onChange={(e) => setSelectedDayId(e.target.value)}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md disabled:opacity-50 text-xs"
              >
                {days.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.day_label} ({d.session_count || 0} sessions)
                  </option>
                ))}
              </select>

              <span className="text-slate-300 dark:text-slate-600">|</span>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="destMode"
                  checked={destinationMode === 'new'}
                  onChange={() => setDestinationMode('new')}
                  className="text-blue-600"
                />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  + Create New Folder:
                </span>
              </label>

              {destinationMode === 'new' && (
                <input
                  type="text"
                  required={destinationMode === 'new'}
                  placeholder="e.g. Sprint-24, 2026-11-26, Evals-Run-1"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md flex-1 min-w-[140px]"
                />
              )}
            </div>

            {destinationMode === 'new' && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    System Instruction for New Folder (Optional)
                  </span>
                  <span className="text-slate-400">Leave blank to use Global Default</span>
                </div>
                <textarea
                  rows={2}
                  placeholder="Leave empty to inherit standard CLI Trace prompt generator, or specify custom steering instructions..."
                  value={customSystemPrompt}
                  onChange={(e) => setCustomSystemPrompt(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-blue-500" />
                Paste JSON (Dict or Array)
              </label>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Sample formats:</span>
                <button
                  type="button"
                  onClick={loadDictSample}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Key-Value Dict
                </button>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <button
                  type="button"
                  onClick={loadArraySample}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Array of Tasks
                </button>
              </div>
            </div>

            <textarea
              required
              rows={12}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{
  "task-1": "Implement user auth...",
  "task-2": "Fix memory leak in websocket server..."
}'
              className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent leading-relaxed"
            />
          </div>

          {/* Validation Status Preview */}
          {error ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Detected <strong>{parsedTasks.length}</strong> tasks — Ready to launch into{' '}
                  <strong>{activeDay?.day_label}</strong>
                </span>
              </div>
              <span className="text-[11px] font-mono opacity-80">5-Worker Pool</span>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={parsedTasks.length === 0 || Boolean(error)}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Launch {parsedTasks.length} Sessions</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
