import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Sparkles,
  Heart,
  Coins,
  Award,
  Trophy,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Users,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { kudosService, leaderboardService } from '../services/api';
import { KudoCard } from '../components/kudos/KudoCard';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { COMPANY_VALUES } from '../utils/constants';
import { getDepartmentName } from '../utils/formatters';

export const FeedPage = () => {
  const { user } = useAuth();
  const { onOpenGiveKudos } = useOutletContext();

  // Kudos Feed State
  const [kudos, setKudos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedValue, setSelectedValue] = useState('ALL');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Leaderboard Preview State
  const [leaderboardPreview, setLeaderboardPreview] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  // Sentinel for Infinite Scrolling
  const observerTarget = useRef(null);

  /**
   * Fetch Kudos Feed from GET /api/kudos/
   */
  const fetchKudos = useCallback(async (pageNum = 1, valueFilter = 'ALL', shouldAppend = false) => {
    if (pageNum === 1) {
      setLoading(true);
      setError(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params = { page: pageNum };
      if (valueFilter !== 'ALL') {
        params.company_value = valueFilter;
      }

      const data = await kudosService.getFeed(params);
      const results = data.results || (Array.isArray(data) ? data : []);

      if (shouldAppend) {
        setKudos((prev) => [...prev, ...results]);
      } else {
        setKudos(results);
      }

      setHasMore(Boolean(data.next));
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load kudos feed', err);
      if (pageNum === 1) {
        setError('Failed to load kudos feed. Please check your connection and retry.');
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  /**
   * Fetch Monthly Leaderboard Preview (Top 5)
   */
  const fetchLeaderboardPreview = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const data = await leaderboardService.getLeaderboard();
      const list = data.leaderboard || [];
      setLeaderboardPreview(list.slice(0, 5));
    } catch (err) {
      console.error('Failed to load leaderboard preview', err);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  // Initial load and filter change
  useEffect(() => {
    fetchKudos(1, selectedValue, false);
  }, [selectedValue, fetchKudos]);

  useEffect(() => {
    fetchLeaderboardPreview();
  }, [fetchLeaderboardPreview]);

  // Listen for global kudo creation event to prepend/refresh feed
  useEffect(() => {
    const handleNewKudo = () => {
      fetchKudos(1, selectedValue, false);
      fetchLeaderboardPreview();
    };
    window.addEventListener('kudo:created', handleNewKudo);
    return () => window.removeEventListener('kudo:created', handleNewKudo);
  }, [selectedValue, fetchKudos, fetchLeaderboardPreview]);

  // Infinite Scroll Trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !loading) {
          fetchKudos(page + 1, selectedValue, true);
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, isLoadingMore, loading, page, selectedValue, fetchKudos]);

  const handleManualRetry = () => {
    fetchKudos(1, selectedValue, false);
    fetchLeaderboardPreview();
  };

  return (
    <div className="space-y-8">
      {/* 1. Welcome & User Overview Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 sm:p-8 shadow-xl shadow-indigo-950/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* User Welcome Message & Avatar */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <Avatar
                src={user?.avatar}
                name={user?.name || 'User'}
                size="xl"
                indicator={true}
                className="ring-4 ring-white/20 shadow-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider bg-white/20 text-indigo-100 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                  {getDepartmentName(user?.department, 'Peer Recognition')}
                </span>
                <span className="text-xs text-indigo-200">
                  Rank #{user?.leaderboard_rank || '-'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 leading-tight">
                Welcome back, {user?.name?.split(' ')[0] || 'Teammate'}! 👋
              </h1>
              <p className="text-xs sm:text-sm text-indigo-100/80 mt-1 max-w-xl leading-relaxed">
                Notice great work today? Recognize peers and celebrate our shared core values.
              </p>
            </div>
          </div>

          {/* User Allowance, Earned Points & Quick Give Kudos Button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Allowance Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 min-w-[130px] shadow-sm">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-200 uppercase tracking-wider">
                <Coins className="w-3.5 h-3.5 text-amber-300" />
                <span>Allowance</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
                {user?.giving_allowance ?? 100}{' '}
                <span className="text-xs font-normal text-indigo-200">pts</span>
              </div>
              <span className="text-[10px] text-indigo-200 block -mt-0.5">To award peers</span>
            </div>

            {/* Earned Points Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 min-w-[130px] shadow-sm">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-200 uppercase tracking-wider">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <span>Earned</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">
                {user?.earned_points ?? 0}{' '}
                <span className="text-xs font-normal text-indigo-200">pts</span>
              </div>
              <span className="text-[10px] text-indigo-200 block -mt-0.5">Peer appreciation</span>
            </div>

            {/* Quick "Give Kudos" Action */}
            <Button
              variant="secondary"
              size="lg"
              icon={Sparkles}
              onClick={onOpenGiveKudos}
              className="bg-white text-indigo-900 hover:bg-indigo-50 font-black shadow-lg shadow-black/10 transition-transform hover:scale-105"
            >
              Give Kudos
            </Button>
          </div>
        </div>

        {/* Ambient Decorative Shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-60 h-60 rounded-full bg-pink-500/20 blur-2xl pointer-events-none" />
      </section>

      {/* 2. Main Dashboard Layout: Social Feed (Left 2/3) + Leaderboard Preview (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* =======================================================================
            SOCIAL KUDOS FEED COLUMN (Col span 2)
            ======================================================================= */}
        <div className="lg:col-span-2 space-y-5">
          {/* Feed Filter Tabs Bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedValue('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedValue === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Values
              </button>
              {COMPANY_VALUES.map((val) => (
                <button
                  key={val.key}
                  type="button"
                  onClick={() => setSelectedValue(val.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    selectedValue === val.key
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{val.icon}</span>
                  <span>#{val.label}</span>
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchKudos(1, selectedValue, false)}
              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors ml-auto sm:ml-0"
              title="Refresh feed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>

          {/* Loading Skeletons */}
          {loading && <LoadingSkeleton count={3} type="card" />}

          {/* Error State */}
          {!loading && error && (
            <ErrorState message={error} onRetry={handleManualRetry} />
          )}

          {/* Empty State */}
          {!loading && !error && kudos.length === 0 && (
            <EmptyState
              icon={MessageSquare}
              title="No Kudos Yet"
              description={
                selectedValue === 'ALL'
                  ? 'No kudos have been shared across the team yet. Be the pioneer and recognize a colleague!'
                  : `No kudos found for #${selectedValue}. Be the first to recognize a colleague for this value!`
              }
              actionLabel="Give First Kudos"
              onAction={onOpenGiveKudos}
            />
          )}

          {/* Kudos Cards List */}
          {!loading && !error && kudos.length > 0 && (
            <div className="space-y-4">
              {kudos.map((item) => (
                <KudoCard key={item.id} kudo={item} />
              ))}

              {/* Infinite Scrolling Sentinel & Loading Indicator */}
              <div ref={observerTarget} className="py-2 text-center">
                {isLoadingMore && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 shadow-2xs">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>Loading more kudos...</span>
                  </div>
                )}
                {!hasMore && kudos.length > 3 && (
                  <p className="text-xs text-slate-400 py-3 font-medium">
                    ✨ You're all caught up with the team!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* =======================================================================
            MONTHLY LEADERBOARD PREVIEW COLUMN (Col span 1)
            ======================================================================= */}
        <aside className="space-y-5">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 leading-tight">
                    Monthly Leaderboard
                  </h2>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                    Current Month Top Peers
                  </span>
                </div>
              </div>

              <Link
                to="/leaderboard"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 hover:underline"
              >
                <span>View Full</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Leaderboard Loading */}
            {leaderboardLoading && (
              <div className="py-6 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-200" />
                      <div className="space-y-1">
                        <div className="w-20 h-3 bg-slate-200 rounded" />
                        <div className="w-12 h-2 bg-slate-100 rounded" />
                      </div>
                    </div>
                    <div className="w-10 h-4 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
            )}

            {/* Leaderboard List Preview */}
            {!leaderboardLoading && leaderboardPreview.length > 0 && (
              <div className="divide-y divide-slate-100 mt-2">
                {leaderboardPreview.map((entry) => {
                  const isTop3 = entry.rank <= 3;
                  const rankBadge =
                    entry.rank === 1
                      ? '🥇'
                      : entry.rank === 2
                      ? '🥈'
                      : entry.rank === 3
                      ? '🥉'
                      : `#${entry.rank}`;

                  return (
                    <div
                      key={entry.user_id}
                      className="py-3 flex items-center justify-between gap-3 group hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black w-6 text-center shrink-0">
                          {rankBadge}
                        </span>
                        <Avatar
                          src={entry.avatar}
                          name={entry.name}
                          size="sm"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                            {entry.name}
                          </p>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {getDepartmentName(entry.department)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/50">
                          {entry.monthly_points} pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty Leaderboard State */}
            {!leaderboardLoading && leaderboardPreview.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                No rankings recorded yet for this month.
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link
                to="/leaderboard"
                className="w-full block text-center py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
              >
                Explore Full Leaderboard & Podiums
              </Link>
            </div>
          </div>

          {/* Quick Recognition Promo Box */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-5 border border-indigo-100 text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-indigo-950">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Did a teammate go above & beyond?</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Every month you receive <span className="font-bold text-indigo-700">100 points</span> to distribute. Giving kudos builds morale and strengthens company culture!
            </p>
            <Button
              variant="accent"
              size="sm"
              className="w-full mt-1"
              icon={Sparkles}
              onClick={onOpenGiveKudos}
            >
              Recognize a Peer Now
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default FeedPage;
