import React, { useRef, useEffect } from 'react';
import { Search, Plus, Menu, X, Tag } from 'lucide-react';
import { usePromptVault } from '../context/PromptVaultContext';

export const Header: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    availableTags,
    selectedTag,
    setSelectedTag,
    openPromptModal,
    setIsMobileSidebarOpen,
    activeView,
    activeProject,
    filteredPrompts,
  } = usePromptVault();

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Cmd/Ctrl + K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getHeaderTitle = () => {
    if (activeView === 'favorites') return 'Favorite Prompts';
    if (activeView === 'project' && activeProject) return activeProject.name;
    return 'All Prompts';
  };

  const getHeaderSubtitle = () => {
    if (activeView === 'favorites') return 'Starred prompts for instant access';
    if (activeView === 'project' && activeProject) {
      return activeProject.description || 'Prompts in this project folder';
    }
    return 'Browse, search, and reuse prompts across all project folders';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Top row on mobile / Left section: Mobile menu + Title + Search */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick search input with Cmd+K */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search prompts, tags, content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-16 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 rounded border border-slate-300 dark:border-slate-600">
                    ⌘K
                  </kbd>
                )}
              </div>
            </div>
          </div>

          {/* Action CTA: New Prompt Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => openPromptModal('new')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>New Prompt</span>
            </button>
          </div>
        </div>

        {/* View Title & Info Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {activeProject && (
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: activeProject.color || '#3b82f6' }}
                />
              )}
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
                {getHeaderTitle()}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                {filteredPrompts.length} {filteredPrompts.length === 1 ? 'prompt' : 'prompts'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {getHeaderSubtitle()}
            </p>
          </div>

          {/* Dynamic Tag Filter Pills */}
          {availableTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1">
                <Tag className="w-3 h-3" />
                Tags:
              </span>
              <button
                onClick={() => setSelectedTag(null)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
                  selectedTag === null
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                All
              </button>
              {availableTags.map((tag) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(isSelected ? null : tag)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>#{tag}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
