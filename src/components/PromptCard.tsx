import React, { useState } from 'react';
import { Copy, Check, Star, Tag, Flame } from 'lucide-react';
import type { Prompt } from '../types/database';
import { usePromptVault } from '../context/PromptVaultContext';

interface PromptCardProps {
  prompt: Prompt;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt }) => {
  const {
    activeView,
    openPromptModal,
    toggleFavoritePrompt,
    copyPromptToClipboard,
  } = usePromptVault();

  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await copyPromptToClipboard(prompt);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoritePrompt(prompt.id);
  };

  const showProjectBadge = activeView !== 'project';
  const project = prompt.project;

  return (
    <div
      onClick={() => openPromptModal(prompt)}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
              {prompt.title}
            </h3>
          </div>

          {/* Star Toggle */}
          <button
            onClick={handleStar}
            className={`p-1.5 -mr-1 -mt-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
              prompt.is_favorite
                ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={prompt.is_favorite ? 'Remove from favorites' : 'Mark as favorite'}
            aria-label="Toggle favorite"
          >
            <Star
              className={`w-4 h-4 ${prompt.is_favorite ? 'fill-amber-500' : 'fill-transparent'}`}
            />
          </button>
        </div>

        {/* Badges: Project + Tag */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {showProjectBadge && project && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 max-w-[160px] truncate">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: project.color || '#3b82f6' }}
              />
              <span className="truncate">{project.name}</span>
            </span>
          )}

          {prompt.task_tag && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40">
              <Tag className="w-3 h-3" />
              <span>{prompt.task_tag}</span>
            </span>
          )}
        </div>

        {/* Content Body Preview (Truncated 3-4 lines max) */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800 mb-4">
          <p className="font-mono text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-wrap break-words select-none">
            {prompt.content}
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
        {/* Usage Count */}
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 dark:text-slate-500">
          <Flame className="w-3.5 h-3.5 text-amber-500/80" />
          <span>{prompt.usage_count || 0} copies</span>
        </div>

        {/* Prominent 1-Click Copy Button */}
        <button
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
            copied
              ? 'bg-emerald-600 text-white scale-102 ring-2 ring-emerald-500/30'
              : 'bg-slate-900 hover:bg-blue-600 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-blue-500 dark:hover:text-white'
          }`}
          title="Copy prompt text to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
