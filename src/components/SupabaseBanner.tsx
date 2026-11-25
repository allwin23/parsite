import React, { useState } from 'react';
import { Database, AlertTriangle, ExternalLink, X, Check } from 'lucide-react';
import { usePromptVault } from '../context/PromptVaultContext';

export const SupabaseBanner: React.FC = () => {
  const { isConfigured } = usePromptVault();
  const [dismissed, setDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  if (isConfigured || dismissed) return null;

  return (
    <>
      <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs md:text-sm flex items-center justify-between transition-all">
        <div className="flex items-center gap-2 overflow-hidden">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="truncate">
            <strong>Running in Local Storage Mode:</strong> Connect Supabase to enable cloud persistence & cross-device sync.
          </span>
          <button
            onClick={() => setShowModal(true)}
            className="hidden sm:inline-flex items-center gap-1 font-semibold underline hover:text-amber-700 dark:hover:text-amber-100 cursor-pointer ml-1"
          >
            Setup Guide <ExternalLink className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowModal(true)}
            className="sm:hidden text-xs underline font-medium"
          >
            Setup
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-amber-500/20 rounded text-amber-700 dark:text-amber-300"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Connect PromptVault to Supabase
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Follow these 3 quick steps for cloud database persistence
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Create a free Supabase Project
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Sign in to <span className="font-mono text-emerald-600 dark:text-emerald-400">supabase.com</span> and create a new project.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Run the SQL Migration
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Open <span className="font-mono text-slate-700 dark:text-slate-300">SQL Editor</span> in your Supabase dashboard, copy and paste the contents of <span className="font-mono text-blue-600 dark:text-blue-400">supabase/schema.sql</span>, and click Run.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Add Environment Variables
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Copy <span className="font-mono">.env.example</span> to <span className="font-mono">.env</span> and fill in your <span className="font-mono">VITE_SUPABASE_URL</span> and <span className="font-mono">VITE_SUPABASE_ANON_KEY</span>.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
