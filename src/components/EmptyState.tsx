import React from 'react';
import { Plus, Search, Sparkles } from 'lucide-react';
import { usePromptVault } from '../context/PromptVaultContext';

export const EmptyState: React.FC = () => {
  const {
    searchQuery,
    selectedTag,
    setSearchQuery,
    setSelectedTag,
    openPromptModal,
    activeView,
    activeProject,
  } = usePromptVault();

  const isFiltering = Boolean(searchQuery.trim() || selectedTag);

  if (isFiltering) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
          <Search className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          No matching prompts found
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
          No prompts matched your search query "{searchQuery}" {selectedTag ? `with tag #${selectedTag}` : ''}.
        </p>
        <button
          onClick={() => {
            setSearchQuery('');
            setSelectedTag(null);
          }}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-xs">
        <Sparkles className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
        {activeView === 'favorites'
          ? 'No favorite prompts yet'
          : activeProject
          ? `No prompts in ${activeProject.name}`
          : 'Your prompt library is empty'}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 mb-5 leading-relaxed">
        {activeView === 'favorites'
          ? 'Star prompts by clicking the star icon on any card to access them quickly from here.'
          : 'Start building your engineering prompt knowledge base. Save debugging guides, code review checklists, and architecture system prompts.'}
      </p>
      {activeView !== 'favorites' && (
        <button
          onClick={() => openPromptModal('new')}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create First Prompt</span>
        </button>
      )}
    </div>
  );
};
