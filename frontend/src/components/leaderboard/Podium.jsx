import React from 'react';
import { Trophy, Medal, Sparkles } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { getDepartmentName } from '../../utils/formatters';

export const Podium = ({ topUsers = [] }) => {
  if (!topUsers || topUsers.length === 0) return null;

  const first = topUsers[0];
  const second = topUsers[1];
  const third = topUsers[2];

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6 pt-8 pb-4 px-2 max-w-2xl mx-auto">
      {/* 2nd Place (Silver) */}
      {second && (
        <div className="flex-1 flex flex-col items-center animate-in slide-in-from-bottom-4 duration-300">
          <div className="relative mb-2">
            <Avatar src={second.avatar} name={second.name} size="lg" />
            <span className="absolute -top-2 -right-1 w-6 h-6 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-xs font-black text-slate-800 shadow-sm">
              2
            </span>
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-900 text-center line-clamp-1">
            {second.name}
          </div>
          <span className="text-[10px] text-slate-500 mb-2">{getDepartmentName(second.department)}</span>
          <div className="w-full bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-2xl p-3 text-center border-t-2 border-slate-300 h-28 flex flex-col justify-between shadow-inner">
            <Medal className="w-5 h-5 text-slate-400 mx-auto" />
            <div className="text-sm sm:text-base font-extrabold text-slate-800">
              {second.monthly_points} <span className="text-[10px] font-normal text-slate-500">pts</span>
            </div>
          </div>
        </div>
      )}

      {/* 1st Place (Gold) */}
      {first && (
        <div className="flex-1 flex flex-col items-center animate-in slide-in-from-bottom-6 duration-300 -mt-6">
          <div className="relative mb-2">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-amber-500 animate-bounce-subtle">
              <Trophy className="w-6 h-6 fill-amber-400 text-amber-500" />
            </div>
            <Avatar
              src={first.avatar}
              name={first.name}
              size="xl"
              className="ring-4 ring-amber-300/80 shadow-lg"
            />
            <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-md">
              1
            </span>
          </div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 text-center line-clamp-1">
            {first.name}
          </div>
          <span className="text-[11px] text-indigo-600 font-medium mb-2">{getDepartmentName(first.department)}</span>
          <div className="w-full bg-gradient-to-t from-amber-200 to-amber-100 rounded-t-2xl p-4 text-center border-t-2 border-amber-400 h-36 flex flex-col justify-between shadow-md">
            <Sparkles className="w-5 h-5 text-amber-600 mx-auto" />
            <div className="text-base sm:text-lg font-black text-amber-950">
              {first.monthly_points} <span className="text-xs font-normal text-amber-800">pts</span>
            </div>
          </div>
        </div>
      )}

      {/* 3rd Place (Bronze) */}
      {third && (
        <div className="flex-1 flex flex-col items-center animate-in slide-in-from-bottom-2 duration-300">
          <div className="relative mb-2">
            <Avatar src={third.avatar} name={third.name} size="lg" />
            <span className="absolute -top-2 -right-1 w-6 h-6 rounded-full bg-amber-600 border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-sm">
              3
            </span>
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-900 text-center line-clamp-1">
            {third.name}
          </div>
          <span className="text-[10px] text-slate-500 mb-2">{getDepartmentName(third.department)}</span>
          <div className="w-full bg-gradient-to-t from-orange-200 to-amber-50 rounded-t-2xl p-3 text-center border-t-2 border-orange-300 h-24 flex flex-col justify-between shadow-inner">
            <Medal className="w-5 h-5 text-amber-700 mx-auto" />
            <div className="text-sm sm:text-base font-extrabold text-slate-800">
              {third.monthly_points} <span className="text-[10px] font-normal text-slate-500">pts</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
