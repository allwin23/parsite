import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
} from 'lucide-react';
import { useTraceAssist } from '../../context/TraceAssistContext';

export const NotesPanel: React.FC = () => {
  const { notes, setNotes, activeSession } = useTraceAssist();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!activeSession) return null;

  const handleCopyNotes = async () => {
    if (!notes) return;
    await navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col transition-all duration-200 ${
        isCollapsed ? 'w-10' : 'w-72 sm:w-80'
      }`}
    >
      {/* Panel Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
          title={isCollapsed ? 'Expand Scratchpad' : 'Collapse Scratchpad'}
        >
          {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {!isCollapsed && (
          <>
            <div className="flex items-center gap-1.5 flex-1 min-w-0 ml-1">
              <FileText className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                Notes to Remember
              </span>
            </div>

            <button
              onClick={handleCopyNotes}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
              title="Copy notes"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </>
        )}
      </div>

      {/* Panel Body */}
      {!isCollapsed ? (
        <div className="flex-1 flex flex-col p-3 space-y-2 overflow-hidden">
          {/* Privacy Banner */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="leading-tight">
              <strong>Strictly Local:</strong> Never injected into Gemini API prompts.
            </span>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="User-only scratchpad...
- Terminal flags to re-run
- Temporary auth tokens
- Edge case notes to verify
- Copy snippets into chat when ready"
            className="flex-1 w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
          />

          <div className="text-[10px] text-slate-400 text-right font-mono">
            Autosaved to session
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-2 text-slate-400">
          <span
            className="text-[11px] font-bold uppercase tracking-widest text-slate-400 [writing-mode:vertical-rl] rotate-180"
          >
            Scratchpad
          </span>
        </div>
      )}
    </div>
  );
};
