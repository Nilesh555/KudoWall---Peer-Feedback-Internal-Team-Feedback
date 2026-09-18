import React from 'react';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { getDepartmentName } from '../../utils/formatters';

export const LeaderboardTable = ({ entries = [], startingRank = 4 }) => {
  if (!entries || entries.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4 w-16 text-center">Rank</th>
              <th className="py-3 px-4">Team Member</th>
              <th className="py-3 px-4 hidden sm:table-cell">Department</th>
              <th className="py-3 px-4 text-right">Points Earned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {entries.map((user, idx) => {
              const rank = user.rank || startingRank + idx;
              return (
                <tr
                  key={user.user_id || idx}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                    <span className="inline-block w-7 h-7 leading-7 rounded-full bg-slate-100 text-xs text-slate-700">
                      #{rank}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar} name={user.name} size="sm" />
                      <div>
                        <div className="font-bold text-slate-900 leading-tight">
                          {user.name}
                        </div>
                        <div className="text-xs text-slate-400 sm:hidden">
                          {getDepartmentName(user.department)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 hidden sm:table-cell">
                    <Badge variant="primary" size="sm">
                      {getDepartmentName(user.department) || 'General'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-extrabold text-slate-900 text-base">
                      {user.monthly_points}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">pts</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
