import React, { useState } from 'react';
import { reactionService } from '../../services/api';
import { REACTION_TYPES } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../common/Toast';
import { Loader2 } from 'lucide-react';

export const ReactionBar = ({ kudoId, initialReactions = {}, initialUserReactions = [] }) => {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [reactions, setReactions] = useState(() => ({
    '+1': initialReactions['+1'] || 0,
    '👏': initialReactions['👏'] || 0,
    '🔥': initialReactions['🔥'] || 0,
  }));
  const [userReactions, setUserReactions] = useState(initialUserReactions || []);
  const [pendingReaction, setPendingReaction] = useState(null);

  const handleToggleReaction = async (type) => {
    if (!isAuthenticated) {
      addToast({
        title: 'Sign In Required',
        message: 'Please sign in to react to colleagues on the kudos wall.',
        type: 'info',
      });
      return;
    }

    if (pendingReaction) return; // Prevent concurrent rapid-fire requests

    const hasReacted = userReactions.includes(type);
    const prevReactions = { ...reactions };
    const prevUserReactions = [...userReactions];

    // 1. Optimistic UI: Immediately update state in the frontend
    if (hasReacted) {
      setUserReactions((prev) => prev.filter((r) => r !== type));
      setReactions((prev) => ({
        ...prev,
        [type]: Math.max(0, (prev[type] || 1) - 1),
      }));
    } else {
      setUserReactions((prev) => [...prev, type]);
      setReactions((prev) => ({
        ...prev,
        [type]: (prev[type] || 0) + 1,
      }));
    }

    setPendingReaction(type);

    // 2. Send API request
    try {
      if (hasReacted) {
        // DELETE /api/kudos/{id}/reactions/
        const data = await reactionService.removeReaction(kudoId, type);
        // 3. Keep confirmed response
        if (data.reaction_counts) setReactions(data.reaction_counts);
        if (data.user_reactions) setUserReactions(data.user_reactions);
      } else {
        // POST /api/kudos/{id}/reactions/
        const data = await reactionService.addReaction(kudoId, type);
        // 3. Keep confirmed response
        if (data.reaction_counts) setReactions(data.reaction_counts);
        if (data.user_reactions) setUserReactions(data.user_reactions);
      }
    } catch (err) {
      // 4. Rollback UI on error
      setReactions(prevReactions);
      setUserReactions(prevUserReactions);
      addToast({
        title: 'Reaction Failed',
        message: err.response?.data?.detail || err.response?.data?.error || 'Could not update reaction.',
        type: 'error',
      });
    } finally {
      setPendingReaction(null);
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {REACTION_TYPES.map((type) => {
        const count = reactions[type] || 0;
        const isActive = userReactions.includes(type);
        const isPending = pendingReaction === type;

        return (
          <button
            key={type}
            type="button"
            disabled={isPending}
            onClick={() => handleToggleReaction(type)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 border cursor-pointer ${
              isActive
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs scale-105'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-600 hover:text-slate-900'
            } ${isPending ? 'opacity-70' : 'active:scale-95'} select-none`}
            title={isActive ? `Remove ${type}` : `React with ${type}`}
          >
            <span className="text-sm leading-none">{type}</span>
            {count > 0 && <span className="font-extrabold">{count}</span>}
            {isPending && <Loader2 className="w-3 h-3 animate-spin text-indigo-600 ml-0.5" />}
          </button>
        );
      })}
    </div>
  );
};

export const ReactionButtons = ReactionBar;
export default ReactionBar;
