import React, { useState } from 'react';
import {
  ListOrdered,
  Copy,
  Check,
  Pencil,
  Trash2,
  Plus,
  X,
  Maximize2,
  Terminal,
} from 'lucide-react';
import { useTraceAssist } from '../../context/TraceAssistContext';
import type { TraceBulletinItem } from '../../types/database';

interface PromptModalState {
  title: string;
  badge: string;
  prompt: string;
  isInitial?: boolean;
  item?: TraceBulletinItem;
}

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
  const [modalCopied, setModalCopied] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [activeModal, setActiveModal] = useState<PromptModalState | null>(null);

  if (!activeSession) return null;

  const handleCopyBulletin = async (item: TraceBulletinItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    await copyBulletinItem(item);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCopyInitialPrompt = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    await navigator.clipboard.writeText(activeSession.initial_prompt);
    setCopiedId('initial');
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleModalCopy = async () => {
    if (!activeModal) return;
    if (activeModal.isInitial) {
      await navigator.clipboard.writeText(activeModal.prompt);
    } else if (activeModal.item) {
      await copyBulletinItem(activeModal.item);
    } else {
      await navigator.clipboard.writeText(activeModal.prompt);
    }
    setModalCopied(true);
    setTimeout(() => setModalCopied(false), 1500);
  };

  const handleStartEdit = (item: TraceBulletinItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditText(item.prompt_text);
  };

  const handleSaveEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editText.trim()) {
      await updateBulletinItem(id, editText.trim());
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteBulletinItem(id);
    if (activeModal?.item?.id === id) {
      setActiveModal(null);
    }
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    await saveToBulletin(customPrompt.trim());
    setCustomPrompt('');
    setIsAddingCustom(false);
  };

  const totalQueued = bulletinItems.length + 1; // Turn 1 initial prompt + subsequent turns

  return (
    <>
      <div className="bg-slate-100/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 p-3 sm:px-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
              Turn Bulletin Queue
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {totalQueued} in queue
            </span>
            <span className="hidden sm:inline text-[11px] text-slate-400 dark:text-slate-500">
              — Click any card to inspect full prompt
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
          {/* Card #1: Turn 1 Initial Prompt */}
          <div
            onClick={() =>
              setActiveModal({
                title: `Turn 1: Initial Task Prompt`,
                badge: activeSession.task_name,
                prompt: activeSession.initial_prompt,
                isInitial: true,
              })
            }
            className="group shrink-0 w-72 sm:w-80 p-2.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold font-mono">
                    #1
                  </span>
                  <span className="text-[10px] font-mono text-blue-700 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-900/60 px-1.5 py-0.2 rounded font-semibold">
                    Turn 1 · Initial Prompt
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModal({
                      title: `Turn 1: Initial Task Prompt`,
                      badge: activeSession.task_name,
                      prompt: activeSession.initial_prompt,
                      isInitial: true,
                    });
                  }}
                  className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Open full prompt card"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs font-mono line-clamp-3 leading-relaxed mb-2 text-slate-800 dark:text-slate-200">
                {activeSession.initial_prompt}
              </p>
            </div>

            <div className="pt-2 border-t border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">Turn 1 (Task)</span>

              <button
                type="button"
                onClick={handleCopyInitialPrompt}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  copiedId === 'initial'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copiedId === 'initial' ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Cards #2+: Pre-generated turn prompts */}
          {bulletinItems.map((item, idx) => {
            const isCopied = copiedId === item.id;
            const isEditing = editingId === item.id;
            const turnNumber = idx + 2;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (!isEditing) {
                    setActiveModal({
                      title: `Turn ${turnNumber} Prompt`,
                      badge: item.is_used ? 'Used' : 'Ready to Steer',
                      prompt: item.prompt_text,
                      item,
                    });
                  }
                }}
                className={`group shrink-0 w-72 sm:w-80 p-2.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                  item.is_used
                    ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                    : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold font-mono">
                        #{turnNumber}
                      </span>
                      {item.is_used ? (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded flex items-center gap-1">
                          <Check className="w-3 h-3" /> Used
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                          Turn {turnNumber}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveModal({
                            title: `Turn ${turnNumber} Prompt`,
                            badge: item.is_used ? 'Used' : 'Ready to Steer',
                            prompt: item.prompt_text,
                            item,
                          });
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded"
                        title="View full prompt"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleStartEdit(item, e)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                        title="Edit prompt text"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                        title="Delete from bulletin"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div
                      className="space-y-1.5 mb-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <textarea
                        rows={3}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2 py-0.5 text-[11px] text-slate-500 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleSaveEdit(item.id, e)}
                          className="px-2 py-0.5 text-[11px] bg-blue-600 text-white rounded font-medium cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p
                      className={`text-xs font-mono line-clamp-3 leading-relaxed mb-2 ${
                        item.is_used
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {item.prompt_text}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">1-Click Steer</span>

                  <button
                    type="button"
                    onClick={(e) => handleCopyBulletin(item, e)}
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
          })}
        </div>
      </div>

      {/* Pop Card Modal to View Full Prompt */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0">
                  <Terminal className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                    {activeModal.title}
                  </h3>
                  <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                    {activeModal.badge}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Content: Complete Prompt Text */}
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-mono">
                  <span>Full Prompt Text:</span>
                  <span>
                    {activeModal.prompt.length} chars · {activeModal.prompt.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <pre className="font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed select-all">
                  {activeModal.prompt}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400 font-mono">
                Click prompt to select all, or use button
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleModalCopy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs cursor-pointer transition-colors"
                >
                  {modalCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full Prompt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
