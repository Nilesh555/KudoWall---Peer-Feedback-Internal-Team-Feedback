import React from 'react';

export const LoadingSkeleton = ({
  count = 3,
  type = 'card', // 'card' | 'row' | 'text' | 'podium'
  className = '',
}) => {
  if (type === 'row') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-100 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200" />
              <div className="space-y-1.5">
                <div className="w-28 h-3 bg-slate-200 rounded" />
                <div className="w-16 h-2 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="w-14 h-6 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div className={`space-y-2 animate-pulse ${className}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="h-3 bg-slate-200 rounded"
            style={{ width: `${Math.max(40, 100 - idx * 20)}%` }}
          />
        ))}
      </div>
    );
  }

  // Default 'card' skeleton (suitable for kudos cards and profile feeds)
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-2xs animate-pulse space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <div className="space-y-1.5">
                <div className="w-28 h-3.5 bg-slate-200 rounded" />
                <div className="w-16 h-2.5 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="w-20 h-6 bg-slate-200 rounded-full" />
          </div>
          <div className="space-y-2 py-2">
            <div className="w-full h-3 bg-slate-100 rounded" />
            <div className="w-4/5 h-3 bg-slate-100 rounded" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex gap-2">
              <div className="w-12 h-6 bg-slate-100 rounded-full" />
              <div className="w-12 h-6 bg-slate-100 rounded-full" />
            </div>
            <div className="w-16 h-3 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
