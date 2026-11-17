import React from 'react';

interface SkeletonBlockProps {
  className?: string;
}

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-[#CBD8E8]/60 dark:bg-slate-700/50 ${className}`} />
);

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({ rows = 5, columns = 6 }) => (
  <div className="overflow-x-auto rounded-2xl border border-[#CBD8E8] dark:border-slate-800">
    <table className="w-full text-left text-xs">
      <thead>
        <tr className="border-b border-[#CBD8E8] dark:border-slate-800 bg-[#E6EDF6]/50 dark:bg-slate-800/50">
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="py-3 px-3.5">
              <SkeletonBlock className="h-3 w-16" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-[#E6EDF6] dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <tr key={rowIdx}>
            {Array.from({ length: columns }).map((_, colIdx) => (
              <td key={colIdx} className="py-3.5 px-3.5">
                <SkeletonBlock className={`h-3 ${colIdx === 0 ? 'w-36' : 'w-14'}`} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

interface SkeletonCardsProps {
  count?: number;
}

export const SkeletonCards: React.FC<SkeletonCardsProps> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="bg-white/85 dark:bg-slate-900/85 border border-[#CBD8E8] dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3"
      >
        <SkeletonBlock className="h-3 w-32" />
        <SkeletonBlock className="h-7 w-24" />
        <SkeletonBlock className="h-3 w-40" />
      </div>
    ))}
  </div>
);