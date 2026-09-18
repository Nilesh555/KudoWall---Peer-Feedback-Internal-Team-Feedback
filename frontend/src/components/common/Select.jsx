import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = ({
  label,
  value,
  onChange,
  options = [],
  error,
  icon: Icon,
  disabled = false,
  className = '',
  id,
  placeholder = 'Select an option...',
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}

        <select
          id={selectId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`block w-full ${Icon ? 'pl-10' : 'pl-3.5'} pr-10 py-2.5 rounded-2xl border text-sm appearance-none transition-all focus:outline-none ${
            disabled
              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              : error
              ? 'bg-rose-50/40 border-rose-300 text-rose-900 focus:ring-2 focus:ring-rose-500'
              : 'bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-slate-300'
          }`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={optVal} value={optVal}>
                {optLabel}
              </option>
            );
          })}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
};

export default Select;
