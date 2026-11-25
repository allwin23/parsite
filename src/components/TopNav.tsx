import React from 'react';
import {
  Sparkles,
  Layers,
  Zap,
  Moon,
  Sun,
  Settings,
} from 'lucide-react';
import { usePromptVault } from '../context/PromptVaultContext';

export type AppMode = 'library' | 'trace';

interface TopNavProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onOpenTraceSettings?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentMode,
  onModeChange,
  onOpenTraceSettings,
}) => {
  const { isDarkMode, toggleDarkMode } = usePromptVault();

  return (
    <nav className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-slate-100 text-base tracking-tight">
            PromptVault
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-medium">
            Pro
          </span>
        </div>
      </div>

      {/* Top-Level Mode Switcher */}
      <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
        <button
          onClick={() => onModeChange('library')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            currentMode === 'library'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Prompt Library</span>
        </button>

        <button
          onClick={() => onModeChange('trace')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            currentMode === 'trace'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Trace Assist</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            CLI
          </span>
        </button>
      </div>

      {/* Right Tools: Dark Mode, Settings & Status */}
      <div className="flex items-center gap-2">
        {currentMode === 'trace' && onOpenTraceSettings && (
          <button
            onClick={onOpenTraceSettings}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            title="Configure Gemini API Key & Model"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Gemini Key</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Toggle Light / Dark mode"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>
    </nav>
  );
};
