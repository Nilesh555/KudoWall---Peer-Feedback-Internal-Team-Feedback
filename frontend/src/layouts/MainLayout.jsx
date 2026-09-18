import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { GiveKudosModal } from '../components/kudos/GiveKudosModal';
import { Sparkles, Heart, ExternalLink, ShieldCheck, HeartHandshake } from 'lucide-react';
import { COMPANY_VALUES } from '../utils/constants';

export const MainLayout = () => {
  const [isGiveKudosOpen, setIsGiveKudosOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Top Responsive Navigation Bar */}
      <Navbar onOpenGiveKudos={() => setIsGiveKudosOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet context={{ onOpenGiveKudos: () => setIsGiveKudosOpen(true) }} />
      </main>

      {/* Global "Give Kudos" Modal */}
      <GiveKudosModal
        isOpen={isGiveKudosOpen}
        onClose={() => setIsGiveKudosOpen(false)}
        onKudoCreated={() => {
          // Notify any listening components (feed, profile, leaderboard)
          window.dispatchEvent(new CustomEvent('kudo:created'));
        }}
      />

      {/* Modern Enterprise Platform Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white/80 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-slate-100">
            {/* Brand column */}
            <div className="md:col-span-2 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-xs">
                  <Sparkles className="w-4 h-4 fill-white" />
                </div>
                <span className="text-base font-black tracking-tight text-slate-900">
                  Peer<span className="text-indigo-600 ml-0.5">Kudos</span>
                </span>
                <span className="text-[10px] uppercase font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  Internal Platform
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                Empowering teams through transparent peer appreciation, monthly recognition allowances, and core value alignment across departments.
              </p>
              {/* Values pill list */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {COMPANY_VALUES.map((val) => (
                  <span
                    key={val.key}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200/70 px-2.5 py-1 rounded-lg"
                  >
                    <span>{val.icon}</span>
                    <span>{val.label}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Navigation
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-600">
                <li>
                  <Link to="/feed" className="hover:text-indigo-600 transition-colors">
                    Home (Kudos Wall)
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsGiveKudosOpen(true)}
                    className="hover:text-indigo-600 transition-colors cursor-pointer text-left"
                  >
                    Give Kudos
                  </button>
                </li>
                <li>
                  <Link to="/leaderboard" className="hover:text-indigo-600 transition-colors">
                    Monthly Leaderboard
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="hover:text-indigo-600 transition-colors">
                    My Profile & Badges
                  </Link>
                </li>
              </ul>
            </div>

            {/* Platform & Developer Status */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                System & API
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-600">
                <li className="flex items-center gap-2 text-emerald-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Backend: Django REST v1.0</span>
                </li>
                <li>
                  <a
                    href="http://127.0.0.1:8000/api/docs/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors"
                  >
                    <span>Swagger API Documentation</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </li>
                <li className="text-[11px] text-slate-400 font-normal">
                  Secure JWT (15m) + HTTP-only Cookie (7d)
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom attribution */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <div>
              © {new Date().getFullYear()} Peer Kudos • Internal Team Recognition Platform
            </div>
            <div className="flex items-center gap-1.5">
              <span>Crafted for high-performing engineering & product teams</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
