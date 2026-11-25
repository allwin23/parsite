import React, { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Check,
  Send,
  Plus,
  BookmarkPlus,
  Terminal,
  Bot,
  User,
  Sparkles,
  Loader2,
  BookmarkCheck,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { useTraceAssist } from '../../context/TraceAssistContext';
import { BulletinQueue } from './BulletinQueue';
import type { TraceSessionStatus } from '../../types/database';

export interface SteeringTemplate {
  id: string;
  name: string;
  prompt: string;
}

const DEFAULT_TEMPLATES: SteeringTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Follow-up & Inspect',
    prompt:
      'CLI is still running / took a different path — generate a realistic follow-up turn to inspect & verify',
  },
  {
    id: 'tpl-2',
    name: 'Debug Error Steering',
    prompt:
      'Agent hit an error (paste below) — write a concise steering prompt to debug without giving away the answer',
  },
  {
    id: 'tpl-3',
    name: 'Edge Cases & Tests',
    prompt: 'Ask the agent to check edge cases and run tests before wrapping up',
  },
  {
    id: 'tpl-4',
    name: 'Queue 3 Turn Prompts',
    prompt: 'Generate 3 sequential follow-up turn prompts I can queue in my bulletin',
  },
];

const TEMPLATES_STORAGE_KEY = 'promptvault_steering_templates';

export const ChatPane: React.FC = () => {
  const {
    activeSession,
    activeDay,
    messages,
    isGeneratingTurn,
    sendTurnMessage,
    saveToBulletin,
    updateSessionStatus,
    setIsProjectPromptModalOpen,
  } = useTraceAssist();

  const [inputPrompt, setInputPrompt] = useState('');
  const [copiedInitial, setCopiedInitial] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [savedMsgId, setSavedMsgId] = useState<string | null>(null);

  // Template popover state
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [templates, setTemplates] = useState<SteeringTemplate[]>(() => {
    try {
      const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map((item, idx) => {
            if (typeof item === 'string') {
              return {
                id: `tpl-${Date.now()}-${idx}`,
                name: item.length > 28 ? item.slice(0, 28) + '...' : item,
                prompt: item,
              };
            }
            return item;
          });
        }
      }
      return DEFAULT_TEMPLATES;
    } catch {
      return DEFAULT_TEMPLATES;
    }
  });

  // Pop card / modal state for creating or editing template
  const [editorModal, setEditorModal] = useState<{
    isOpen: boolean;
    template: SteeringTemplate | null;
    name: string;
    prompt: string;
  }>({
    isOpen: false,
    template: null,
    name: '',
    prompt: '',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGeneratingTurn]);

  if (!activeSession) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-950">
        <Terminal className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
          No Session Selected
        </h3>
        <p className="text-xs max-w-sm mt-1">
          Select a CLI trace session from the left sidebar or click "+ Batch JSON" to launch tasks.
        </p>
      </div>
    );
  }

  const handleCopyInitialPrompt = async () => {
    await navigator.clipboard.writeText(activeSession.initial_prompt);
    setCopiedInitial(true);
    setTimeout(() => setCopiedInitial(false), 1500);
  };

  const handleCopyAssistantMessage = async (msgId: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 1500);
  };

  const handleSaveMessageToBulletin = async (msgId: string, content: string) => {
    await saveToBulletin(content);
    setSavedMsgId(msgId);
    setTimeout(() => setSavedMsgId(null), 1500);
  };

  const handleSelectTemplate = (tpl: SteeringTemplate) => {
    setInputPrompt(tpl.prompt);
    setIsTemplateMenuOpen(false);
  };

  const handleOpenAddTemplate = () => {
    setEditorModal({
      isOpen: true,
      template: null,
      name: '',
      prompt: '',
    });
  };

  const handleOpenEditTemplate = (tpl: SteeringTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditorModal({
      isOpen: true,
      template: tpl,
      name: tpl.name,
      prompt: tpl.prompt,
    });
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = templates.filter((t) => t.id !== id);
    setTemplates(next);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(next));
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorModal.name.trim() || !editorModal.prompt.trim()) return;

    let next: SteeringTemplate[];
    if (editorModal.template) {
      next = templates.map((t) =>
        t.id === editorModal.template?.id
          ? { ...t, name: editorModal.name.trim(), prompt: editorModal.prompt.trim() }
          : t
      );
    } else {
      const created: SteeringTemplate = {
        id: `tpl-${Date.now()}`,
        name: editorModal.name.trim(),
        prompt: editorModal.prompt.trim(),
      };
      next = [...templates, created];
      setInputPrompt(created.prompt);
      setIsTemplateMenuOpen(false);
    }

    setTemplates(next);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(next));
    setEditorModal({ isOpen: false, template: null, name: '', prompt: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isGeneratingTurn) return;
    const toSend = inputPrompt.trim();
    setInputPrompt('');
    await sendTurnMessage(toSend);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-950">
      {/* 1. Task Header */}
      <div className="bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shrink-0">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {activeSession.task_name}
            </h2>
            <select
              value={activeSession.status}
              onChange={(e) =>
                updateSessionStatus(activeSession.id, e.target.value as TraceSessionStatus)
              }
              className="text-[11px] font-semibold py-0.5 px-2 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="warming">warming</option>
              <option value="ready">ready</option>
              <option value="active">active</option>
              <option value="completed">completed</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsProjectPromptModalOpen(true)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium rounded-lg border transition-colors cursor-pointer shadow-2xs ${
              activeDay?.system_prompt
                ? 'border-purple-300 dark:border-purple-800 bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 font-semibold'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={`Folder System Instruction (${activeDay?.system_prompt ? 'Custom' : 'Global Default'}) — click to configure`}
          >
            <Bot className="w-3.5 h-3.5 text-blue-500" />
            <span>Prompt: {activeDay?.system_prompt ? 'Custom' : 'Default'}</span>
          </button>

          <button
            onClick={handleCopyInitialPrompt}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
            title="Copy initial task prompt"
          >
            {copiedInitial ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Prompt</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Pre-Generated Turn Bulletin Queue Strip */}
      <BulletinQueue />

      {/* 3. Turn-by-Turn Chat Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
            <Bot className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="font-semibold text-slate-600 dark:text-slate-400">
              No turn history yet
            </p>
            <p className="max-w-xs mx-auto mt-1">
              Select a quick steering template below or send a prompt to generate the next turn.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isCopied = copiedMsgId === msg.id;
            const isSaved = savedMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 shadow-2xs ${
                    isUser
                      ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 rounded-br-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-bl-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1.5">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isUser ? 'text-slate-400' : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {isUser ? 'User Turn' : 'Gemini Steering Prompt'}
                    </span>
                    <span className="text-[10px] opacity-60 font-mono">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>

                  {/* Actions for Assistant Message */}
                  {!isUser && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleSaveMessageToBulletin(msg.id, msg.content)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                          isSaved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                        }`}
                        title="Queue this prompt in the session bulletin strip"
                      >
                        {isSaved ? (
                          <>
                            <BookmarkCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Queued!</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-3.5 h-3.5" />
                            <span>+ Save to Bulletin</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleCopyAssistantMessage(msg.id, msg.content)}
                        className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        title="Copy prompt text to clipboard"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isGeneratingTurn && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-medium animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Gemini is generating next technical steering prompt...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Chat Input Composer with '+' Template Button */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative">
        {/* Steering Templates Popover */}
        {isTemplateMenuOpen && (
          <div className="absolute bottom-full left-4 mb-2 z-30 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Quick Steering Templates
              </span>
              <button
                type="button"
                onClick={() => setIsTemplateMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Template Names list */}
            <div className="py-2 space-y-1 max-h-56 overflow-y-auto">
              {templates.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  No templates found. Click below to add one!
                </p>
              ) : (
                templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className="group flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-300 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-900 cursor-pointer"
                  >
                    <span className="font-medium truncate flex-1" title={tpl.prompt}>
                      {tpl.name}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditTemplate(tpl, e)}
                        title="Edit template name & prompt"
                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                        title="Delete template"
                        className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Custom Template CTA */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleOpenAddTemplate}
                className="w-full py-1.5 px-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Custom Template</span>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          {/* '+' Button inside composer */}
          <button
            type="button"
            onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 hover:border-blue-300 transition-all shrink-0 cursor-pointer"
            title="Choose or create quick steering template"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              rows={2}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Steer agent or paste terminal output (Enter to send, Shift+Enter for new line)..."
              className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none leading-relaxed"
            />
          </div>

          {/* Send / Generate Turn Button */}
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isGeneratingTurn}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
            title="Generate Next Turn Prompt"
          >
            {isGeneratingTurn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>

      {/* Pop Card Modal for Adding / Editing Steering Template */}
      {editorModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {editorModal.template ? 'Edit Steering Template' : 'New Steering Template'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditorModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTemplate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Template Name (Displayed in Menu)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Run Tests & Verify, Error Steering..."
                  value={editorModal.name}
                  onChange={(e) =>
                    setEditorModal((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Prompt Content (Inserted into Chat Composer)
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter the exact reusable steering prompt..."
                  value={editorModal.prompt}
                  onChange={(e) =>
                    setEditorModal((prev) => ({ ...prev, prompt: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 resize-none leading-relaxed"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditorModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editorModal.template ? 'Save Changes' : 'Create Template'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
