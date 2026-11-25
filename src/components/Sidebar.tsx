import React, { useState } from 'react';
import {
  Folder,
  Layers,
  Star,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Moon,
  Sun,
  X,
  Sparkles,
} from 'lucide-react';
import { usePromptVault } from '../context/PromptVaultContext';
import type { Project } from '../types/database';

export const Sidebar: React.FC = () => {
  const {
    projects,
    prompts,
    activeView,
    selectedProjectId,
    setActiveView,
    openProjectModal,
    setProjectToDelete,
    isDarkMode,
    toggleDarkMode,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = usePromptVault();

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const totalPromptsCount = prompts.length;
  const favoritesCount = prompts.filter((p) => p.is_favorite).length;

  const handleProjectMenuToggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId((curr) => (curr === id ? null : id));
  };

  const handleEditProject = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setActiveMenuId(null);
    openProjectModal(project);
  };

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setProjectToDelete(project);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* App Title & Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-base tracking-tight">
                  PromptVault
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-medium">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-none">
                AI Prompt Engineering
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button: New Project */}
        <div className="p-3">
          <button
            onClick={() => openProjectModal('new')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 transition-colors border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project Folder</span>
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-6">
          {/* Global Views */}
          <div className="space-y-1">
            <button
              onClick={() => setActiveView('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeView === 'all'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-blue-500" />
                <span>All Prompts</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-400">
                {totalPromptsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveView('favorites')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeView === 'favorites'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                <span>Favorites</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-400">
                {favoritesCount}
              </span>
            </button>
          </div>

          {/* Project Folders */}
          <div>
            <div className="px-3 pb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Projects ({projects.length})
              </span>
            </div>

            <div className="space-y-1">
              {projects.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                  No projects yet. Click "+ New Project" above.
                </div>
              ) : (
                projects.map((project) => {
                  const isActive = activeView === 'project' && selectedProjectId === project.id;
                  const isMenuOpen = activeMenuId === project.id;

                  return (
                    <div
                      key={project.id}
                      className="relative group"
                      onMouseLeave={() => {
                        if (isMenuOpen) setActiveMenuId(null);
                      }}
                    >
                      <button
                        onClick={() => setActiveView('project', project.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer ${
                          isActive
                            ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: project.color || '#3b82f6' }}
                          />
                          <Folder className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                          <span className="truncate">{project.name}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-slate-500 dark:text-slate-400">
                            {project.prompt_count ?? 0}
                          </span>

                          <button
                            onClick={(e) => handleProjectMenuToggle(e, project.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-opacity"
                            title="Project options"
                          >
                            <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                        </div>
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div className="absolute right-2 top-8 z-30 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 text-xs">
                          <button
                            onClick={(e) => handleEditProject(e, project)}
                            className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit Folder
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(e, project)}
                            className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer: Theme Toggle & Info */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
          <span className="font-mono text-[11px] text-slate-400">Ctrl+K search</span>
        </div>
      </aside>
    </>
  );
};
