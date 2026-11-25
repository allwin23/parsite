import React, { useState } from 'react';
import {
  ListOrdered,
  Copy,
  Check,
  Pencil,
  Trash2,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import { useTraceAssist } from '../../context/TraceAssistContext';
import type { TraceBulletinItem } from '../../types/database';

export const BulletinQueue: React.FC = () => {
  const {
    bulletinItems,
    copyBulletinItem,
    updateBulletinItem,
    deleteBulletinItem,
    saveToBulletin,
    activeSession,
  } = useTraceAssist();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  if (!activeSession) return null;

  const handleCopy = async (item: TraceBulletinItem) => {
    await copyBulletinItem(item);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleStartEdit = (item: TraceBulletinItem) => {
    setEditingId(item.id);
    setEditText(item.prompt_text);
  };

  const handleSaveEdit = async (id: string) => {
    if (editText.trim()) {
      await updateBulletinItem(id, editText.trim());
    }
    setEditingId(null);
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    await saveToBulletin(customPrompt.trim());
    setCustomPrompt('');
    setIsAddingCustom(false);
  };

  return (
    <div className="bg-slate-100/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 p-3 sm:px-6">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
            Turn Bulletin Queue
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {bulletinItems.length} queued
          </span>
          <span className="hidden sm:inline text-[11px] text-slate-400 dark:text-slate-500">
            — Pre-generated prompts for upcoming CLI turns
          </span>
        </div>

        <button
          onClick={() => setIsAddingCustom(!isAddingCustom)}
          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Turn Prompt</span>
        </button>
      </div>

      {/* Inline Quick Add Form */}
      {isAddingCustom && (
        <form onSubmit={handleAddCustom} className="mb-2.5 flex items-center gap-2 animate-in fade-in">
          <input
            type="text"
            required
            autoFocus
            placeholder="Type or paste prompt to queue for upcoming turn..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setIsAddingCustom(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Bulletin Cards Strip */}
      <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {bulletinItems.length === 0 ? (
          <div className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500 bg-white/40 dark:bg-slate-900/40 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            <span>No pre-generated turns queued yet. Click "+ Save to Bulletin" on any assistant prompt below to queue turns.</span>
          </div>
        ) : (
          bulletinItems.map((item, idx) => {
            const isCopied = copiedId === item.id;
            const isEditing = editingId === item.id;

            return (
              <div
                key={item.id}
                className={`group shrink-0 w-72 sm:w-80 p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                  item.is_used
                    ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                    : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold font-mono">
                        #{idx + 1}
                      </span>
                      {item.is_used && (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded flex items-center gap-1">
                          <Check className="w-3 h-3" /> Used
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                        title="Edit prompt text"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteBulletinItem(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                        title="Delete from bulletin"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-1.5 mb-2">
                      <textarea
                        rows={3}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-0.5 text-[11px] text-slate-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="px-2 py-0.5 text-[11px] bg-blue-600 text-white rounded font-medium"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p
                      className={`text-xs font-mono line-clamp-3 leading-relaxed mb-2 ${
                        item.is_used ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {item.prompt_text}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">1-Click Steer</span>

                  <button
                    onClick={() => handleCopy(item)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : item.is_used
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>{item.is_used ? 'Copy Again' : 'Copy'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
