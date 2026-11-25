import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { usePromptVault } from '../context/PromptVaultContext';

export const Toast: React.FC = () => {
  const { toast } = usePromptVault();

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium border ${
          toast.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-900'
            : toast.type === 'info'
            ? 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-900'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900'
        }`}
      >
        {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500" />}
        {toast.type === 'info' && <Info className="w-4 h-4 text-sky-500" />}
        {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        <span>{toast.message}</span>
      </div>
    </div>
  );
};
