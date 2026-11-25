import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, RotateCcw, Bot, Sliders } from 'lucide-react';
import { useTraceAssist } from '../../context/TraceAssistContext';
import {
  SYSTEM_PROMPT_PRESETS,
  getGlobalSystemInstruction,
} from '../../lib/gemini';

export const ProjectSystemPromptModal: React.FC = () => {
  const {
    activeDay,
    updateDay,
    isProjectPromptModalOpen,
    setIsProjectPromptModalOpen,
  } = useTraceAssist();

  const [promptText, setPromptText] = useState('');
  const [saved, setSaved] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  useEffect(() => {
    if (isProjectPromptModalOpen && activeDay) {
      setPromptText(activeDay.system_prompt || '');
      setSelectedPresetId(null);
      setSaved(false);
    }
  }, [isProjectPromptModalOpen, activeDay]);

  if (!isProjectPromptModalOpen || !activeDay) return null;

  const isCustom = Boolean(promptText.trim());
  const globalDefault = getGlobalSystemInstruction();

  const handleApplyPreset = (presetId: string, instruction: string) => {
    setPromptText(instruction);
    setSelectedPresetId(presetId);
  };

  const handleResetToDefault = () => {
    setPromptText('');
    setSelectedPresetId('default');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalValue = promptText.trim() ? promptText.trim() : null;
    await updateDay(activeDay.id, { system_prompt: finalValue });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setIsProjectPromptModalOpen(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base truncate">
                Project System Instruction
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                <span>Folder:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {activeDay.day_label}
                </span>
                <span>•</span>
                <span
                  className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${
                    isCustom
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-semibold'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {isCustom ? 'Custom System Prompt' : 'Inheriting Global Default'}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsProjectPromptModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Quick Presets Strip */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Select Steering Preset
              </span>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Global Default</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SYSTEM_PROMPT_PRESETS.map((p) => {
                const isSelected = selectedPresetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p.id, p.instruction)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs mb-0.5 flex items-center justify-between">
                      <span>{p.title}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {p.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Instruction Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-blue-500" />
                System Instruction for this Project
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {promptText.trim()
                  ? `${promptText.length} characters`
                  : 'Blank = inherits global default'}
              </span>
            </div>

            <textarea
              rows={8}
              placeholder={globalDefault}
              value={promptText}
              onChange={(e) => {
                setPromptText(e.target.value);
                setSelectedPresetId(null);
              }}
              className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Leave empty to automatically inherit the global default CLI Trace prompt instruction.
            </p>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
            >
              Clear & Use Default
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsProjectPromptModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs cursor-pointer transition-colors"
              >
                {saved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Project Prompt</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
