import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Award,
  BarChart2,
  User,
  LogOut,
  Menu,
  X,
  Home,
  HeartHandshake,
  Coins,
  ChevronDown,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { getDepartmentName } from '../utils/formatters';

export const Navbar = ({ onOpenGiveKudos }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const menuRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/feed', label: 'Home', icon: Home },
    { to: '/give-kudos', label: 'Give Kudos', icon: HeartHandshake },
    { to: '/leaderboard', label: 'Leaderboard', icon: BarChart2 },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name: Peer Kudos */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link
              to="/feed"
              className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-tight text-slate-900 leading-none">
                    Peer<span className="text-indigo-600 ml-1">Kudos</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100/80">
                    Internal
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400 block mt-0.5 tracking-tight">
                  Team Feedback & Recognition
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
              {navLinks.map((item) => {
                const Icon = item.icon;
                if (item.isAction) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.onClick}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70 transition-all cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-indigo-500" />
                      <span>{item.label}</span>
                    </button>
                  );
                }

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Live Giving Allowance & Earned Points Pills */}
            <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/70">
              {/* Allowance */}
              <div
                className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-xl shadow-xs text-xs font-bold text-slate-700"
                title="Your monthly giving points to award teammates"
              >
                <Coins className="w-3.5 h-3.5 text-indigo-500" />
                <span>
                  {user?.giving_allowance ?? 100}{' '}
                  <span className="text-[10px] font-normal text-slate-400">allowance</span>
                </span>
              </div>

              {/* Earned Points */}
              <div
                className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-xl text-xs font-bold text-amber-900 border border-amber-200/50"
                title="Total kudos points earned from colleagues"
              >
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {user?.earned_points ?? 0}{' '}
                  <span className="text-[10px] font-normal text-amber-600">earned</span>
                </span>
              </div>
            </div>

            {/* "Give Kudos" Accent Button */}
            <Button
              variant="accent"
              size="sm"
              icon={Sparkles}
              onClick={onOpenGiveKudos}
              className="shadow-sm shadow-indigo-300 hover:shadow-md transition-all"
            >
              Give Kudos
            </Button>

            {/* User Avatar & Interactive Dropdown Menu */}
            <div className="relative ml-2" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 rounded-2xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                aria-haspopup="true"
                aria-expanded={isProfileOpen}
                aria-label="User account menu"
              >
                <Avatar
                  src={user?.avatar}
                  name={user?.name || 'User'}
                  size="sm"
                  indicator={true}
                />
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    isProfileOpen ? 'rotate-180 text-indigo-600' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu Container */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-slate-100 py-2 z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                  {/* User Profile Header */}
                  <div className="px-4 py-3 bg-gradient-to-b from-slate-50/70 to-white">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user?.name || 'Team Member'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {user?.email}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="inline-flex items-center text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                        {getDepartmentName(user?.department, 'General Team')}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        Rank #{user?.leaderboard_rank || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Points Balance Snapshot */}
                  <div className="px-4 py-2.5 bg-slate-50/50 flex items-center justify-between text-xs">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">Allowance</span>
                      <span className="font-extrabold text-indigo-600">{user?.giving_allowance ?? 100} pts</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">Earned</span>
                      <span className="font-extrabold text-amber-600">{user?.earned_points ?? 0} pts</span>
                    </div>
                  </div>

                  {/* Menu Links */}
                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>My Profile & Badges</span>
                    </Link>
                    <Link
                      to="/leaderboard"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Monthly Leaderboard</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onOpenGiveKudos();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors text-left"
                    >
                      <HeartHandshake className="w-3.5 h-3.5 text-slate-400" />
                      <span>Give Kudos to Peer</span>
                    </button>
                  </div>

                  {/* Logout Action */}
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50/80 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Action & Hamburger Button */}
          <div className="flex items-center gap-2 sm:hidden">
            <Button
              variant="accent"
              size="sm"
              icon={Sparkles}
              onClick={onOpenGiveKudos}
              className="py-1.5 px-3 text-xs"
            >
              Give
            </Button>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-800" />
              ) : (
                <Menu className="w-6 h-6 text-slate-800" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer / Slide-Down Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200/80 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {/* User Account Card */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <Avatar src={user?.avatar} name={user?.name || 'User'} size="md" indicator={true} />
              <div>
                <div className="text-xs font-bold text-slate-900">{user?.name}</div>
                <div className="text-[11px] text-slate-500">{user?.email}</div>
                <span className="inline-block mt-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {getDepartmentName(user?.department, 'Team Member')}
                </span>
              </div>
            </div>
          </div>

          {/* Points Snapshot for Mobile */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-center">
            <div className="p-2 bg-white rounded-xl shadow-2xs">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                <Coins className="w-3 h-3 text-indigo-500" />
                <span>Allowance</span>
              </div>
              <span className="text-sm font-black text-indigo-600 mt-0.5 block">
                {user?.giving_allowance ?? 100} pts
              </span>
            </div>
            <div className="p-2 bg-white rounded-xl shadow-2xs">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                <Award className="w-3 h-3 text-amber-500" />
                <span>Earned</span>
              </div>
              <span className="text-sm font-black text-amber-600 mt-0.5 block">
                {user?.earned_points ?? 0} pts
              </span>
            </div>
          </div>

          {/* Mobile Navigation Links: Home, Give Kudos, Leaderboard, Profile */}
          <nav className="space-y-1 pt-1" aria-label="Mobile Navigation">
            {navLinks.map((item) => {
              const Icon = item.icon;
              if (item.isAction) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenGiveKudos();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left"
                  >
                    <Icon className="w-4 h-4 text-indigo-500" />
                    <span>{item.label}</span>
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Logout Action in Mobile */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
export default Navbar;
