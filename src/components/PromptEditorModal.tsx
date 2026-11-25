import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Trash2,
  CopyCheck,
  FolderSync,
  Type,
  Code,
} from 'lucide-react';
import { usePromptVault } from '../context/PromptVaultContext';
import type { Prompt } from '../types/database';

export const PromptEditorModal: React.FC = () => {
  const {
    editingPrompt,
    closePromptModal,
    projects,
    selectedProjectId,
    createPrompt,
    updatePrompt,
    deletePrompt,
    duplicatePromptToProject,
    copyPromptToClipboard,
  } = usePromptVault();

  const isEditing = editingPrompt && editingPrompt !== 'new';
  const promptData = isEditing ? (editingPrompt as Prompt) : null;

  // Form State
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [taskTag, setTaskTag] = useState('');
  const [content, setContent] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  // Editor features
  const [isMonospace, setIsMonospace] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [duplicateTargetId, setDuplicateTargetId] = useState('');
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate state on open
  useEffect(() => {
    if (promptData) {
      setTitle(promptData.title);
      setProjectId(promptData.project_id);
      setTaskTag(promptData.task_tag || '');
      setContent(promptData.content);
      setIsFavorite(promptData.is_favorite);
    } else {
      // New prompt defaults
      setTitle('');
      // Pre-select active project if one is open, else fallback to first project
      const defaultProjId =
        selectedProjectId || (projects.length > 0 ? projects[0].id : '');
      setProjectId(defaultProjId);
      setTaskTag('');
      setContent('');
      setIsFavorite(false);
    }
    setCopied(false);
    setIsDuplicateOpen(false);
    setDeleteConfirmStep(false);
  }, [editingPrompt, promptData, selectedProjectId, projects]);

  if (!editingPrompt) return null;

  // Character and word counters
  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !projectId) return;

    try {
      setIsSubmitting(true);
      if (isEditing && promptData) {
        await updatePrompt(promptData.id, {
          title: title.trim(),
          project_id: projectId,
          task_tag: taskTag.trim() || undefined,
          content: content.trim(),
          is_favorite: isFavorite,
        });
      } else {
        await createPrompt({
          title: title.trim(),
          project_id: projectId,
          task_tag: taskTag.trim() || undefined,
          content: content.trim(),
          is_favorite: isFavorite,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPrompt = async () => {
    if (!content) return;
    if (promptData) {
      await copyPromptToClipboard(promptData);
    } else {
      await navigator.clipboard.writeText(content);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDuplicate = async () => {
    if (!promptData || !duplicateTargetId) return;
    await duplicatePromptToProject(promptData.id, duplicateTargetId);
    setIsDuplicateOpen(false);
    closePromptModal();
  };

  const handleDelete = async () => {
    if (!promptData) return;
    if (!deleteConfirmStep) {
      setDeleteConfirmStep(true);
      return;
    }
    await deletePrompt(promptData.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isEditing ? 'Prompt Details & Editor' : 'Create New Prompt'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing ? 'Edit, copy, duplicate or move across projects' : 'Add a reusable prompt to your library'}
              </p>
            </div>
          </div>

          <button
            onClick={closePromptModal}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Prompt Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. React Hook Performance & Memoization Audit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          {/* Project Folder & Task Tag Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project Folder Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Project Folder *
              </label>
              <select
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-slate-100"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Task Tag */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Task Tag (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Refactor, SQL, Debugging, Security"
                value={taskTag}
                onChange={(e) => setTaskTag(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Content Area with Monospace Toggle & Counters */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Prompt Content *
              </label>

              <div className="flex items-center gap-3">
                {/* Font Toggle */}
                <button
                  type="button"
                  onClick={() => setIsMonospace(!isMonospace)}
                  className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  title="Toggle Monospace / Sans font"
                >
                  {isMonospace ? <Code className="w-3.5 h-3.5 text-blue-500" /> : <Type className="w-3.5 h-3.5" />}
                  <span>{isMonospace ? 'Monospace' : 'Sans-Serif'}</span>
                </button>

                {/* Counters */}
                <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                  {wordCount} words · {charCount} chars
                </div>
              </div>
            </div>

            <textarea
              required
              rows={10}
              placeholder="Write or paste your system prompt, engineering instructions, or few-shot examples here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`w-full p-4 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 leading-relaxed resize-y ${
                isMonospace ? 'font-mono' : 'font-sans'
              }`}
            />
          </div>

          {/* Duplicate to Project Section (Cross-project reuse) */}
          {isEditing && (
            <div className="pt-2">
              {!isDuplicateOpen ? (
                <button
                  type="button"
                  onClick={() => setIsDuplicateOpen(true)}
                  className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                >
                  <CopyCheck className="w-4 h-4" />
                  <span>Duplicate this prompt to another project folder</span>
                </button>
              ) : (
                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <FolderSync className="w-3.5 h-3.5" /> Clone into project:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDuplicateOpen(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={duplicateTargetId}
                      onChange={(e) => setDuplicateTargetId(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Select target project...</option>
                      {projects
                        .filter((p) => p.id !== promptData?.project_id)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      disabled={!duplicateTargetId}
                      onClick={handleDuplicate}
                      className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg cursor-pointer"
                    >
                      Duplicate
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            {/* Left Action: Delete (if editing) */}
            <div>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    deleteConfirmStep
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                      : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  }`}
                  title={deleteConfirmStep ? 'Click again to permanently delete' : 'Delete prompt'}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{deleteConfirmStep ? 'Confirm Delete?' : 'Delete'}</span>
                </button>
              )}
            </div>

            {/* Right Actions: Copy, Cancel, Save */}
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Prompt'}</span>
              </button>

              <button
                type="button"
                onClick={closePromptModal}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim() || !projectId}
                className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Prompt'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
