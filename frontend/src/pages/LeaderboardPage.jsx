import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Filter, Users, Sparkles, RefreshCw } from 'lucide-react';
import { leaderboardService } from '../services/api';
import { DEPARTMENTS } from '../utils/constants';
import { Podium } from '../components/leaderboard/Podium';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';

export const LeaderboardPage = () => {
  const currentDate = new Date();
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        month: selectedMonth,
        year: selectedYear,
      };
      if (selectedDept !== 'ALL') {
        params.department = selectedDept;
      }

      const data = await leaderboardService.getLeaderboard(params);
      setLeaderboardData(data);
    } catch (err) {
      console.error('Failed to load leaderboard', err);
      setError('Failed to fetch leaderboard data. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedDept, selectedMonth, selectedYear]);

  // Extract results safely from whatever key backend returns
  const results =
    leaderboardData?.results ||
    leaderboardData?.leaderboard ||
    (Array.isArray(leaderboardData) ? leaderboardData : []);

  const topThree = results.slice(0, 3);
  const remaining = results.slice(3);

  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const yearOptions = [
    { value: 2025, label: '2025' },
    { value: 2026, label: '2026' },
    { value: 2027, label: '2027' },
  ];

  const currentMonthName =
    leaderboardData?.period?.month_name ||
    monthOptions.find((m) => m.value === selectedMonth)?.label ||
    'Current Month';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header with Title & Date / Period Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200/70 mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Monthly Recognition Podium</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Peer Kudos Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Displaying top contributors for{' '}
            <span className="font-bold text-slate-800">
              {currentMonthName} {selectedYear}
            </span>
            .
          </p>
        </div>

        {/* Month & Year Reusable Select Pickers */}
        <div className="flex items-center gap-2.5">
          <div className="w-36">
            <Select
              placeholder=""
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              options={monthOptions}
            />
          </div>
          <div className="w-24">
            <Select
              placeholder=""
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              options={yearOptions}
            />
          </div>
        </div>
      </div>

      {/* 2. Department Filter Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs pb-2 sm:pb-2.5">
        <button
          type="button"
          onClick={() => setSelectedDept('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            selectedDept === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Departments
        </button>
        {DEPARTMENTS.map((dept) => (
          <button
            key={dept}
            type="button"
            onClick={() => setSelectedDept(dept)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedDept === dept
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* 3. Main Leaderboard Body States */}
      {loading ? (
        <div className="space-y-6">
          <div className="h-56 bg-white rounded-3xl border border-slate-100 animate-pulse" />
          <LoadingSkeleton count={5} type="row" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchLeaderboard} />
      ) : results.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No Kudos Points Recorded"
          description={`No team members in ${
            selectedDept === 'ALL' ? 'the company' : selectedDept
          } have received kudos for ${currentMonthName} ${selectedYear} yet. Be the first to recognize someone!`}
          actionLabel="Award Kudos Now"
          onAction={() => (window.location.href = '/give-kudos')}
        />
      ) : (
        <div className="space-y-6">
          {/* Top 3 Visual Podium */}
          {topThree.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <div className="text-center mb-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  {currentMonthName} Top Achievers
                </span>
              </div>
              <Podium topUsers={topThree} />
            </div>
          )}

          {/* Table / List for Ranks 4+ (or complete list if < 3) */}
          {remaining.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 px-1">
                Full Rankings
              </h2>
              <LeaderboardTable entries={remaining} startingRank={4} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
