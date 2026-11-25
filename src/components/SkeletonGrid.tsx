import React from 'react';

export const SkeletonGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between h-56"
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
              <div className="w-5 h-5 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 bg-slate-100 dark:bg-slate-800/80 rounded w-20" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800/80 rounded w-16" />
            </div>

            <div className="space-y-2">
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-5/6" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-4/6" />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-16" />
            <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg w-20" />
          </div>
        </div>
      ))}
    </div>
  );
};
