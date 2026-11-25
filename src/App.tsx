import React from 'react';
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

const MainLayout: React.FC = () => {
  const { isLoading, filteredPrompts } = usePromptVault();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Supabase status / setup banner */}
      <SupabaseBanner />

      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area (offset by sidebar width on lg screens) */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
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
      </div>

      {/* Global Modals & Notifications */}
      <PromptEditorModal />
      <ProjectModal />
      <DeleteConfirmModal />
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
