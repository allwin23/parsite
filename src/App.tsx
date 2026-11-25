import React, { useState } from 'react';
import { PromptVaultProvider, usePromptVault } from './context/PromptVaultContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PromptCard } from './components/PromptCard';
import { PromptEditorModal } from './components/PromptEditorModal';
import { ProjectModal } from './components/ProjectModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { SupabaseBanner } from './components/SupabaseBanner';
import { EmptyState } from './components/EmptyState';
import { SkeletonGrid } from './components/SkeletonGrid';
import { Toast } from './components/Toast';
import { TopNav, type AppMode } from './components/TopNav';
import { TraceWorkspace } from './components/trace/TraceWorkspace';

const MODE_STORAGE_KEY = 'promptvault_app_mode';

const PromptLibraryWorkspace: React.FC = () => {
  const { isLoading, filteredPrompts } = usePromptVault();

  return (
    <div className="flex-1 flex overflow-hidden min-h-0">
      {/* Left Project Sidebar */}
      <Sidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <SkeletonGrid />
            ) : filteredPrompts.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPrompts.map((prompt) => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Library Modals */}
      <PromptEditorModal />
      <ProjectModal />
      <DeleteConfirmModal />
    </div>
  );
};

const MainLayout: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(MODE_STORAGE_KEY) as AppMode | null;
      if (stored === 'library' || stored === 'trace') return stored;
    }
    return 'library';
  });

  const handleModeChange = (mode: AppMode) => {
    setCurrentMode(mode);
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-150">
      {/* Supabase status / setup guide banner */}
      <SupabaseBanner />

      {/* Clean Top Navigation Bar with Mode Switcher */}
      <TopNav
        currentMode={currentMode}
        onModeChange={handleModeChange}
      />

      {/* Dynamic Workspace based on Mode */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {currentMode === 'library' ? (
          <PromptLibraryWorkspace />
        ) : (
          <TraceWorkspace />
        )}
      </div>

      {/* Global Notifications */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <PromptVaultProvider>
      <MainLayout />
    </PromptVaultProvider>
  );
}
