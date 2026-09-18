import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'Failed to load content. Please verify connection and retry.',
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-3xl p-8 sm:p-10 border border-rose-200 text-center space-y-4 shadow-xs ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">{message}</p>
      </div>

      {onRetry && (
        <div className="pt-2">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
