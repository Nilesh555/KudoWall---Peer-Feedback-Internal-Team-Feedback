import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { CompanyValueBadge } from '../common/Badge';
import { ReactionBar } from './ReactionBar';
import { formatRelativeTime } from '../../utils/formatters';

export const KudoCard = ({ kudo }) => {
  if (!kudo) return null;

  return (
    <article className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top Header: Sender -> Receiver + Points & Tag */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          {/* Peer relationship */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sender */}
            <div className="flex items-center gap-2.5">
              <Avatar
                src={kudo.sender?.avatar}
                name={kudo.sender?.name || 'Anonymous'}
                size="sm"
              />
              <div>
                <span className="font-bold text-sm text-slate-900 block leading-tight">
                  {kudo.sender?.name || 'Anonymous'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {kudo.sender?.department_name || 'Team Member'}
                </span>
              </div>
            </div>

            <div className="p-1 rounded-full bg-slate-100 text-slate-400 mx-0.5 shrink-0">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>

            {/* Receiver */}
            <div className="flex items-center gap-2.5">
              <Avatar
                src={kudo.receiver?.avatar}
                name={kudo.receiver?.name || 'Teammate'}
                size="sm"
                indicator={true}
              />
              <div>
                <span className="font-bold text-sm text-slate-900 block leading-tight">
                  {kudo.receiver?.name || 'Teammate'}
                </span>
                <span className="text-[11px] font-semibold text-indigo-600">
                  {kudo.receiver?.department_name || 'Team Member'}
                </span>
              </div>
            </div>
          </div>

          {/* Points & Company Value Tag */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-2xs">
              <Sparkles className="w-3 h-3 fill-white" />
              +{kudo.points} pts
            </span>
            <CompanyValueBadge valueKey={kudo.company_value} size="sm" showHash={true} />
          </div>
        </div>

        {/* Message Content */}
        <div className="relative pl-3.5 border-l-2 border-indigo-200 my-4 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
          <p>{kudo.message}</p>
        </div>
      </div>

      {/* Footer: Reactions Bar & Relative Date/Time */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <ReactionBar
          kudoId={kudo.id}
          initialReactions={kudo.reactions}
          initialUserReactions={kudo.user_reactions}
        />
        <time
          dateTime={kudo.created_at}
          className="text-xs text-slate-400 font-medium"
        >
          {formatRelativeTime(kudo.created_at)}
        </time>
      </div>
    </article>
  );
};

export const KudosCard = KudoCard;
export default KudoCard;
