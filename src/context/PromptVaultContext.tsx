import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Project, Prompt, CreateProjectInput, UpdateProjectInput, CreatePromptInput, UpdatePromptInput } from '../types/database';
import * as api from '../lib/api';
import { isSupabaseConfigured } from '../lib/supabase';

export type ActiveViewType = 'all' | 'favorites' | 'project';

interface ToastState {
  message: string;
  type: 'success' | 'info' | 'error';
}

interface PromptVaultContextType {
  // State
  projects: Project[];
  prompts: Prompt[];
  isLoading: boolean;
  isConfigured: boolean;
  activeView: ActiveViewType;
  selectedProjectId: string | null;
  searchQuery: string;
  selectedTag: string | null;
  isDarkMode: boolean;
  isMobileSidebarOpen: boolean;
  activeProject: Project | null;
  filteredPrompts: Prompt[];
  availableTags: string[];
  toast: ToastState | null;

  // Modals
  editingPrompt: Prompt | 'new' | null;
  editingProject: Project | 'new' | null;
  projectToDelete: Project | null;

  // Actions
  setActiveView: (view: ActiveViewType, projectId?: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTag: (tag: string | null) => void;
  toggleDarkMode: () => void;
  setIsMobileSidebarOpen: (open: boolean) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;

  // Modals control
  openPromptModal: (prompt?: Prompt | 'new' | null) => void;
  closePromptModal: () => void;
  openProjectModal: (project?: Project | 'new' | null) => void;
  closeProjectModal: () => void;
  setProjectToDelete: (project: Project | null) => void;

  // CRUD
  createProject: (input: CreateProjectInput) => Promise<void>;
  updateProject: (id: string, input: UpdateProjectInput) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  createPrompt: (input: CreatePromptInput) => Promise<void>;
  updatePrompt: (id: string, input: UpdatePromptInput) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  duplicatePromptToProject: (id: string, targetProjectId: string) => Promise<void>;
  toggleFavoritePrompt: (id: string) => Promise<void>;
  copyPromptToClipboard: (prompt: Prompt) => Promise<void>;
  refetchData: () => Promise<void>;
}

const PromptVaultContext = createContext<PromptVaultContextType | undefined>(undefined);

export const PromptVaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<ActiveViewType>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Modals state
  const [editingPrompt, setEditingPrompt] = useState<Prompt | 'new' | null>(null);
  const [editingProject, setEditingProject] = useState<Project | 'new' | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('promptvault_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('promptvault_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('promptvault_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 2800);
  }, []);

  // Fetch initial data
  const refetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [fetchedProjects, fetchedPrompts] = await Promise.all([
        api.fetchProjects(),
        api.fetchPrompts(),
      ]);
      setProjects(fetchedProjects);
      setPrompts(fetchedPrompts);
    } catch (err) {
      console.error('Failed to load PromptVault data:', err);
      showToast('Error loading data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refetchData();
  }, [refetchData]);

  // Current active project
  const activeProject = useMemo(() => {
    if (activeView === 'project' && selectedProjectId) {
      return projects.find((p) => p.id === selectedProjectId) || null;
    }
    return null;
  }, [projects, activeView, selectedProjectId]);

  // Available tags dynamically computed from view
  const availableTags = useMemo(() => {
    let sourcePrompts = prompts;
    if (activeView === 'project' && selectedProjectId) {
      sourcePrompts = prompts.filter((p) => p.project_id === selectedProjectId);
    } else if (activeView === 'favorites') {
      sourcePrompts = prompts.filter((p) => p.is_favorite);
    }
    const tagsSet = new Set<string>();
    sourcePrompts.forEach((p) => {
      if (p.task_tag && p.task_tag.trim()) {
        tagsSet.add(p.task_tag.trim());
      }
    });
    return Array.from(tagsSet).sort();
  }, [prompts, activeView, selectedProjectId]);

  // Filtered prompts based on view, search query, and tag filter
  const filteredPrompts = useMemo(() => {
    return prompts.filter((prompt) => {
      // 1. View filtering
      if (activeView === 'favorites' && !prompt.is_favorite) {
        return false;
      }
      if (activeView === 'project' && selectedProjectId && prompt.project_id !== selectedProjectId) {
        return false;
      }

      // 2. Tag filtering
      if (selectedTag && prompt.task_tag !== selectedTag) {
        return false;
      }

      // 3. Search query filtering (Cmd+K real time)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = prompt.title.toLowerCase().includes(query);
        const contentMatch = prompt.content.toLowerCase().includes(query);
        const tagMatch = prompt.task_tag?.toLowerCase().includes(query) ?? false;
        const projectMatch = prompt.project?.name.toLowerCase().includes(query) ?? false;
        if (!titleMatch && !contentMatch && !tagMatch && !projectMatch) {
          return false;
        }
      }

      return true;
    });
  }, [prompts, activeView, selectedProjectId, selectedTag, searchQuery]);

  // Set active view helper
  const handleSetActiveView = useCallback((view: ActiveViewType, projectId: string | null = null) => {
    setActiveView(view);
    setSelectedProjectId(projectId);
    setSelectedTag(null);
    setIsMobileSidebarOpen(false);
  }, []);

  // CRUD for Projects
  const handleCreateProject = useCallback(async (input: CreateProjectInput) => {
    try {
      const created = await api.createProject(input);
      setProjects((prev) => [...prev, created]);
      showToast(`Project "${created.name}" created`, 'success');
      handleSetActiveView('project', created.id);
      setEditingProject(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to create project', 'error');
    }
  }, [handleSetActiveView, showToast]);

  const handleUpdateProject = useCallback(async (id: string, input: UpdateProjectInput) => {
    try {
      const updated = await api.updateProject(id, input);
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      setPrompts((prev) =>
        prev.map((pr) =>
          pr.project_id === id ? { ...pr, project: { ...pr.project!, ...updated } } : pr
        )
      );
      showToast('Project updated', 'success');
      setEditingProject(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to update project', 'error');
    }
  }, [showToast]);

  const handleDeleteProject = useCallback(async (id: string) => {
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setPrompts((prev) => prev.filter((pr) => pr.project_id !== id));
      if (selectedProjectId === id) {
        handleSetActiveView('all');
      }
      setProjectToDelete(null);
      showToast('Project deleted', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete project', 'error');
    }
  }, [selectedProjectId, handleSetActiveView, showToast]);

  // CRUD for Prompts
  const handleCreatePrompt = useCallback(async (input: CreatePromptInput) => {
    try {
      const created = await api.createPrompt(input);
      setPrompts((prev) => [created, ...prev]);
      // Update project count
      setProjects((prev) =>
        prev.map((proj) =>
          proj.id === input.project_id
            ? { ...proj, prompt_count: (proj.prompt_count || 0) + 1 }
            : proj
        )
      );
      showToast('Prompt created successfully', 'success');
      setEditingPrompt(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to create prompt', 'error');
    }
  }, [showToast]);

  const handleUpdatePrompt = useCallback(async (id: string, input: UpdatePromptInput) => {
    try {
      const original = prompts.find((p) => p.id === id);
      const updated = await api.updatePrompt(id, input);
      setPrompts((prev) => prev.map((p) => (p.id === id ? updated : p)));

      // If moved to another project, update counts
      if (original && input.project_id && original.project_id !== input.project_id) {
        setProjects((prev) =>
          prev.map((proj) => {
            if (proj.id === original.project_id) {
              return { ...proj, prompt_count: Math.max(0, (proj.prompt_count || 1) - 1) };
            }
            if (proj.id === input.project_id) {
              return { ...proj, prompt_count: (proj.prompt_count || 0) + 1 };
            }
            return proj;
          })
        );
      }

      showToast('Changes saved', 'success');
      setEditingPrompt(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to update prompt', 'error');
    }
  }, [prompts, showToast]);

  const handleDeletePrompt = useCallback(async (id: string) => {
    try {
      const target = prompts.find((p) => p.id === id);
      await api.deletePrompt(id);
      setPrompts((prev) => prev.filter((p) => p.id !== id));
      if (target) {
        setProjects((prev) =>
          prev.map((proj) =>
            proj.id === target.project_id
              ? { ...proj, prompt_count: Math.max(0, (proj.prompt_count || 1) - 1) }
              : proj
          )
        );
      }
      showToast('Prompt deleted', 'info');
      setEditingPrompt(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to delete prompt', 'error');
    }
  }, [prompts, showToast]);

  const handleDuplicatePromptToProject = useCallback(async (id: string, targetProjectId: string) => {
    try {
      const duplicated = await api.duplicatePrompt(id, targetProjectId);
      setPrompts((prev) => [duplicated, ...prev]);
      setProjects((prev) =>
        prev.map((proj) =>
          proj.id === targetProjectId
            ? { ...proj, prompt_count: (proj.prompt_count || 0) + 1 }
            : proj
        )
      );
      showToast('Prompt duplicated to project', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to duplicate prompt', 'error');
    }
  }, [showToast]);

  const handleToggleFavoritePrompt = useCallback(async (id: string) => {
    const target = prompts.find((p) => p.id === id);
    if (!target) return;
    const nextFavorite = !target.is_favorite;

    // Optimistic UI update
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_favorite: nextFavorite } : p))
    );

    try {
      await api.toggleFavorite(id, nextFavorite);
    } catch (err) {
      console.error(err);
      // Revert if failed
      setPrompts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_favorite: !nextFavorite } : p))
      );
      showToast('Failed to update favorite', 'error');
    }
  }, [prompts, showToast]);

  const handleCopyPromptToClipboard = useCallback(async (prompt: Prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      showToast('Copied to clipboard!', 'success');

      // Optimistic increment
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === prompt.id ? { ...p, usage_count: (p.usage_count || 0) + 1 } : p
        )
      );

      // Async increment in database
      api.incrementUsageCount(prompt.id).catch((err) => {
        console.warn('Failed to increment usage in DB:', err);
      });
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
      showToast('Failed to copy to clipboard', 'error');
    }
  }, [showToast]);

  return (
    <PromptVaultContext.Provider
      value={{
        projects,
        prompts,
        isLoading,
        isConfigured: isSupabaseConfigured,
        activeView,
        selectedProjectId,
        searchQuery,
        selectedTag,
        isDarkMode,
        isMobileSidebarOpen,
        activeProject,
        filteredPrompts,
        availableTags,
        toast,
        editingPrompt,
        editingProject,
        projectToDelete,
        setActiveView: handleSetActiveView,
        setSearchQuery,
        setSelectedTag,
        toggleDarkMode,
        setIsMobileSidebarOpen,
        showToast,
        openPromptModal: (prompt = 'new') => setEditingPrompt(prompt),
        closePromptModal: () => setEditingPrompt(null),
        openProjectModal: (project = 'new') => setEditingProject(project),
        closeProjectModal: () => setEditingProject(null),
        setProjectToDelete,
        createProject: handleCreateProject,
        updateProject: handleUpdateProject,
        deleteProject: handleDeleteProject,
        createPrompt: handleCreatePrompt,
        updatePrompt: handleUpdatePrompt,
        deletePrompt: handleDeletePrompt,
        duplicatePromptToProject: handleDuplicatePromptToProject,
        toggleFavoritePrompt: handleToggleFavoritePrompt,
        copyPromptToClipboard: handleCopyPromptToClipboard,
        refetchData,
      }}
    >
      {children}
    </PromptVaultContext.Provider>
  );
};

export const usePromptVault = () => {
  const context = useContext(PromptVaultContext);
  if (!context) {
    throw new Error('usePromptVault must be used within a PromptVaultProvider');
  }
  return context;
};
