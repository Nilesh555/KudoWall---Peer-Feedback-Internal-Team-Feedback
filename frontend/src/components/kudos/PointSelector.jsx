import React from 'react';
import { Sparkles } from 'lucide-react';
import { POINT_OPTIONS } from '../../utils/constants';

export const PointSelector = ({
  points,
  onChange,
  availableAllowance = 100,
  options = POINT_OPTIONS,
  error,
  label = 'Points to Award',
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
          {label} <span className="text-rose-500">*</span>
        </label>
        <span className="text-xs text-slate-400">
          Remaining after:{' '}
          <strong className="text-indigo-600 font-bold">
            {Math.max(0, availableAllowance - points)} pts
          </strong>
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {options.map((val) => {
          const isSelected = points === val;
          const isAffordable = availableAllowance >= val;

          return (
            <button
              key={val}
              type="button"
              disabled={!isAffordable}
              onClick={() => onChange(val)}
              className={`py-3 px-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs scale-102'
                  : !isAffordable
                  ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed opacity-50'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white hover:bg-slate-50/50 cursor-pointer'
              }`}
              title={!isAffordable ? 'Insufficient allowance remaining' : `Award ${val} points`}
            >
              <div className="flex items-center gap-1">
                <Sparkles
                  className={`w-3.5 h-3.5 ${
                    isSelected ? 'text-indigo-600 fill-indigo-600' : 'text-slate-400'
                  }`}
                />
                <span className="text-base font-black">+{val}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">
                Points
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-rose-500 font-medium">
          {Array.isArray(error) ? error[0] : error}
        </p>
      )}
    </div>
  );
};

export default PointSelector;
