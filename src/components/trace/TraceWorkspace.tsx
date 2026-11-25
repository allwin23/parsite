import React from 'react';
import { TraceAssistProvider } from '../../context/TraceAssistContext';
import { DaySidebar } from './DaySidebar';
import { ChatPane } from './ChatPane';
import { NotesPanel } from './NotesPanel';
import { BatchJsonModal } from './BatchJsonModal';
import { TraceSettingsModal } from './TraceSettingsModal';
import { ProjectSystemPromptModal } from './ProjectSystemPromptModal';

const TraceWorkspaceInner: React.FC = () => {
  return (
    <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-50 dark:bg-slate-950">
      {/* Left 1: Date Folders & Sessions Navigator */}
      <DaySidebar />

      {/* Center 2: Chat & Turn Bulletin Generator */}
      <ChatPane />

      {/* Right 3: Scratchpad (Strictly Local) */}
      <NotesPanel />

      {/* Modals */}
      <BatchJsonModal />
      <TraceSettingsModal />
      <ProjectSystemPromptModal />
    </div>
  );
};

export const TraceWorkspace: React.FC = () => {
  return (
    <TraceAssistProvider>
      <TraceWorkspaceInner />
    </TraceAssistProvider>
  );
};
