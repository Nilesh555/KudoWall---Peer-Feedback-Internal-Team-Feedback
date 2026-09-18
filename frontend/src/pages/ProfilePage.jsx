import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins,
  Award,
  Send,
  Inbox,
  ShieldCheck,
  Calendar,
  Sparkles,
  Lock,
  ArrowRight,
  TrendingUp,
  Heart,
  RefreshCw,
} from 'lucide-react';
import { userService } from '../services/api';
import { Avatar, UserAvatar } from '../components/common/Avatar';
import { Badge, CompanyValueBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { formatDate, formatRelativeTime, getDepartmentName } from '../utils/formatters';

export const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent'

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile', err);
      setError('Unable to load user profile. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs animate-pulse flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-slate-200 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="w-48 h-5 bg-slate-200 rounded" />
            <div className="w-32 h-3.5 bg-slate-100 rounded" />
            <div className="w-24 h-3 bg-slate-100 rounded mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/70 h-24 animate-pulse" />
          ))}
        </div>
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <ErrorState message={error} onRetry={fetchProfile} />
      </div>
    );
  }

  const stats = profile?.stats || {};
  const badges = profile?.earned_badges || [];
  const recentReceived = profile?.recent_received_kudos || [];
  const recentSent = profile?.recent_sent_kudos || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Profile Header Card */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        <UserAvatar
          src={profile?.avatar}
          name={profile?.name || 'User'}
          size="xl"
          indicator={true}
          className="ring-4 ring-indigo-100 shadow-md shrink-0"
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {profile?.name}
            </h1>
            <Badge variant="primary" size="sm">
              {getDepartmentName(profile?.department) || 'General Team'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">{profile?.email}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Member since {formatDate(profile?.created_at)}
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Team Member
            </span>
          </div>
        </div>

        <div className="shrink-0 pt-2 sm:pt-0">
          <Link to="/give-kudos">
            <Button variant="accent" size="sm" icon={Sparkles}>
              Give Kudos
            </Button>
          </Link>
        </div>
      </section>

      {/* 2. Key Metrics Overview (Allowance, Earned, Sent, Received) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Giving Allowance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Allowance
            </span>
            <Coins className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600">
            {profile?.giving_allowance ?? 100}
            <span className="text-xs font-normal text-slate-400 ml-1">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Monthly allowance to award teammates
          </p>
        </div>

        {/* Earned Points */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Earned Points
            </span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500">
            {profile?.earned_points ?? 0}
            <span className="text-xs font-normal text-slate-400 ml-1">pts</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total recognition received from peers
          </p>
        </div>

        {/* Kudos Received Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Received
            </span>
            <Inbox className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {stats.kudos_received_count ?? recentReceived.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Appreciation notes from colleagues
          </p>
        </div>

        {/* Kudos Sent Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sent
            </span>
            <Send className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {stats.kudos_sent_count ?? recentSent.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Peer recognitions granted
          </p>
        </div>
      </section>

      {/* 3. Earned Badges Section */}
      {badges.length > 0 && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Achievement Badges</span>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {badges.filter((b) => b.unlocked).length} / {badges.length} Unlocked
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Earn badges by demonstrating company values and actively recognizing colleagues.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  badge.unlocked
                    ? 'border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 shadow-2xs'
                    : 'border-slate-100 bg-slate-50/60 opacity-60'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-2xs ${
                    badge.unlocked
                      ? 'bg-white border border-indigo-100 shadow-sm'
                      : 'bg-slate-200/80 grayscale'
                  }`}
                >
                  {badge.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h3 className="text-xs font-bold text-slate-900 truncate">
                      {badge.name}
                    </h3>
                    {badge.unlocked ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Earned
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-0.5">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {badge.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Tabs: Kudos Received & Kudos Sent */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Tab Selection Header */}
        <div className="flex border-b border-slate-200/80 px-6 pt-4 gap-6 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('received')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'received'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Kudos Received</span>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-semibold">
              {recentReceived.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sent')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'sent'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Kudos Sent</span>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-semibold">
              {recentSent.length}
            </span>
          </button>
        </div>

        {/* Tab Content List */}
        <div className="p-6">
          {activeTab === 'received' ? (
            recentReceived.length > 0 ? (
              <div className="space-y-4">
                {recentReceived.map((kudo) => (
                  <div
                    key={kudo.id}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/30 hover:bg-white hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-2.5">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={kudo.sender_avatar}
                          name={kudo.sender_name}
                          size="sm"
                        />
                        <div>
                          <span className="text-xs font-medium text-slate-400 block">
                            Received from
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {kudo.sender_name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          +{kudo.points} pts
                        </span>
                        <CompanyValueBadge valueKey={kudo.company_value} size="sm" showHash={true} />
                      </div>
                    </div>

                    <div className="pl-3 border-l-2 border-indigo-200 my-3 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                      <p>{kudo.message}</p>
                    </div>

                    <div className="text-[11px] text-slate-400 font-medium text-right">
                      {formatDate(kudo.created_at)} ({formatRelativeTime(kudo.created_at)})
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Inbox}
                title="No Kudos Received Yet"
                description="Once colleagues recognize your teamwork, innovation, or customer obsession, they will appear here."
                actionLabel="Explore Feed"
                onAction={() => (window.location.href = '/feed')}
              />
            )
          ) : recentSent.length > 0 ? (
            <div className="space-y-4">
              {recentSent.map((kudo) => (
                <div
                  key={kudo.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/30 hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-2.5">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={kudo.receiver_avatar}
                        name={kudo.receiver_name}
                        size="sm"
                        indicator={true}
                      />
                      <div>
                        <span className="text-xs font-medium text-slate-400 block">
                          Awarded to
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {kudo.receiver_name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        {kudo.points} pts
                      </span>
                      <CompanyValueBadge valueKey={kudo.company_value} size="sm" showHash={true} />
                    </div>
                  </div>

                  <div className="pl-3 border-l-2 border-indigo-200 my-3 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    <p>{kudo.message}</p>
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium text-right">
                    {formatDate(kudo.created_at)} ({formatRelativeTime(kudo.created_at)})
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Send}
              title="No Kudos Sent Yet"
              description="You have 100 points monthly allowance to recognize peers. Praise a teammate to build team morale!"
              actionLabel="Give Kudos Now"
              onAction={() => (window.location.href = '/give-kudos')}
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
