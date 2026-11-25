import React, { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Check,
  Send,
  Plus,
  BookmarkPlus,
  ChevronDown,
  ChevronUp,
  Terminal,
  Bot,
  User,
  Sparkles,
  Loader2,
  BookmarkCheck,
} from 'lucide-react';
import { useTraceAssist } from '../../context/TraceAssistContext';
import { BulletinQueue } from './BulletinQueue';
import type { TraceSessionStatus } from '../../types/database';

const DEFAULT_TEMPLATES = [
  'CLI is still running / took a different path — generate a realistic follow-up turn to inspect & verify',
  'Agent hit an error (paste below) — write a concise steering prompt to debug without giving away the answer',
  'Ask the agent to check edge cases and run tests before wrapping up',
  'Generate 3 sequential follow-up turn prompts I can queue in my bulletin',
];

const TEMPLATES_STORAGE_KEY = 'promptvault_steering_templates';

export const ChatPane: React.FC = () => {
  const {
    activeSession,
    messages,
    isGeneratingTurn,
    sendTurnMessage,
    saveToBulletin,
    updateSessionStatus,
  } = useTraceAssist();

  const [inputPrompt, setInputPrompt] = useState('');
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [copiedInitial, setCopiedInitial] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [savedMsgId, setSavedMsgId] = useState<string | null>(null);

  // Template popover state
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [templates, setTemplates] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      return DEFAULT_TEMPLATES;
    } catch {
      return DEFAULT_TEMPLATES;
    }
  });
  const [newCustomTemplate, setNewCustomTemplate] = useState('');
  const [isAddingNewTemplate, setIsAddingNewTemplate] = useState(false);

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

  const handleSelectTemplate = (tpl: string) => {
    setInputPrompt(tpl);
    setIsTemplateMenuOpen(false);
  };

  const handleAddCustomTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomTemplate.trim()) return;
    const next = [...templates, newCustomTemplate.trim()];
    setTemplates(next);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(next));
    setInputPrompt(newCustomTemplate.trim());
    setNewCustomTemplate('');
    setIsAddingNewTemplate(false);
    setIsTemplateMenuOpen(false);
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
      {/* 1. Pinned Initial Prompt Header (Collapsible) */}
      <div className="bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 transition-all">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shrink-0">
              <Terminal className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  {activeSession.task_name}
                </h2>
                {/* Status Switcher */}
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
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyInitialPrompt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
            >
              {copiedInitial ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied Initial!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Initial Prompt</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              title={isHeaderCollapsed ? 'Expand Initial Prompt' : 'Collapse Initial Prompt'}
            >
              {isHeaderCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {!isHeaderCollapsed && (
          <div className="px-4 sm:px-6 pb-3 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                Turn 1 Context (Pinned)
              </span>
              <p className="text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
                {activeSession.initial_prompt}
              </p>
            </div>
          </div>
        )}
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
          <div className="absolute bottom-full left-4 mb-2 z-30 w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Quick Steering Templates
              </span>
              <button
                onClick={() => setIsTemplateMenuOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Close
              </button>
            </div>

            <div className="py-2 space-y-1.5 max-h-56 overflow-y-auto">
              {templates.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className="w-full text-left p-2 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-300 transition-colors leading-relaxed border border-transparent hover:border-blue-200 dark:hover:border-blue-900 cursor-pointer"
                >
                  "{tpl}"
                </button>
              ))}
            </div>

            {/* Add Custom Template */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              {!isAddingNewTemplate ? (
                <button
                  type="button"
                  onClick={() => setIsAddingNewTemplate(true)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> + Add Custom Template
                </button>
              ) : (
                <form onSubmit={handleAddCustomTemplate} className="space-y-1.5">
                  <input
                    type="text"
                    required
                    placeholder="Enter reusable steering template..."
                    value={newCustomTemplate}
                    onChange={(e) => setNewCustomTemplate(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewTemplate(false)}
                      className="px-2 py-0.5 text-xs text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-2.5 py-0.5 text-xs bg-blue-600 text-white rounded font-medium"
                    >
                      Save
                    </button>
                  </div>
                </form>
              )}
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
    </div>
  );
};
