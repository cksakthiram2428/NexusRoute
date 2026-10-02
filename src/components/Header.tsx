import React, { useState, useEffect } from 'react';
import { Cpu, ShieldCheck, Zap, User, LogIn, Menu, X, Layers, Compass, BarChart3, Activity, MessageSquare, CheckCircle2, ChevronRight } from 'lucide-react';
import { RoutingPolicyConfig } from '../types/router';
import { UserSession } from './LoginPage';
import { ThemeToggle } from './ThemeToggle';

export type ActiveTab =
  | 'landing'
  | 'console'
  | 'decomposer'
  | 'benchmarks'
  | 'policy'
  | 'analytics'
  | 'chat'
  | 'login'
  | 'features'
  | '404';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  policy: RoutingPolicyConfig;
  totalSavedUsd: number;
  currentUser: UserSession | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  policy,
  totalSavedUsd,
  currentUser,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let scrollTimeout: any = null;
    let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isPastTop = currentScrollY > 15;

      setScrolled(isPastTop);
      setIsScrolling(true);

      if (currentScrollY > lastScrollY && isPastTop) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up');
      }
      lastScrollY = currentScrollY;

      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  // Auto-hide the logo with name in top left corner while scrolling or when scrolled down
  const isBrandHidden =
    !isHovered &&
    ((scrolled && isScrolling) || (scrolled && scrollDirection === 'down'));

  const navItems: { id: ActiveTab; label: string; badge?: string }[] = [
    { id: 'landing', label: 'Overview' },
    { id: 'console', label: 'Router Console' },
    { id: 'decomposer', label: 'Multi-Part Splitter' },
    { id: 'benchmarks', label: 'A/B Arena' },
    { id: 'policy', label: 'Policy Controls' },
    { id: 'analytics', label: 'Savings Analytics' },
    { id: 'chat', label: 'Copilot' },
    { id: 'features', label: '20 Features', badge: '20/20' },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between w-full gap-3 bg-[#E6EDF6]/85 dark:bg-[#0A0F1D]/90 backdrop-blur-xl border-b border-white/60 dark:border-slate-800 shadow-xs transition-colors duration-200">
      {/* Brand - Always visible and static */}
      <div className="flex items-center shrink-0">
        <button
          onClick={() => handleNavClick('landing')}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/85 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-xl border border-white/90 dark:border-slate-700/80 shadow-[0_0_0_1px_rgba(120,145,180,0.15),0_2px_8px_rgba(28,52,92,0.05)] text-left cursor-pointer group transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-[#0d1b30] dark:bg-sky-500 flex items-center justify-center text-white dark:text-slate-950 shadow-sm shrink-0">
            <svg className="w-4.5 h-4.5" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <circle cx="20" cy="20" r="18.4" stroke="currentColor" strokeWidth="1.2" />
              <path d="M13.2 4.6c3-.9 6.2-1 9.2-.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M5.6 9.2c3.8-1.9 8-2.4 11.7-1.2 2.5.8 4.3 2.1 6.6 2.3 2 .2 4.2-.4 6.4-1.5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
              <path d="M2.6 13.9c4.4-2.4 9.4-3 13.6-1.5 2.4.9 4.1 2.3 6.4 2.4 2.3.1 4.7-1 7.1-2.4 1.6-.9 3.4-1.4 5.3-1.4" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" />
              <path d="M1.6 18.7c4.8-2.7 10.1-3.2 14.4-1.6 1.8.7 3.2 1.6 4.7 2.1-1.7 1.3-3.4 2.2-5.1 2.6 2.9.5 5.9-.1 8.8-1.5 1.5-.7 2.9-1.6 4.4-2.3 1.9-.9 3.9-1.3 5.9-1.1" stroke="currentColor" strokeWidth="2.9" strokeLinecap="round" />
              <path d="M1.9 24.1c4.5-2.4 9.6-3 13.9-1.6 2.3.7 4 1.9 6.2 2 2.4.1 5-.9 7.5-2.3 1.6-.9 3.3-1.4 5-1.4" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M3.7 28.8c4.1-2 8.7-2.5 12.6-1.3 2.2.7 3.8 1.8 5.9 1.8 2.3.1 4.8-.8 7.1-2.1 1.2-.7 2.5-1.1 3.8-1.2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </div>
          <div className="shrink-0">
            <span className="text-sm font-[520] tracking-[-0.03em] text-[#020C21] dark:text-slate-100 block leading-none">
              NexusRoute
            </span>
            <span className="text-[9px] text-[#59627E] dark:text-slate-400 font-mono block mt-0.5">
              LLM Cost Optimizer
            </span>
          </div>
        </button>
      </div>

      {/* Nav Pill Capsule */}
      <nav className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/75 dark:bg-slate-900/80 border border-white/90 dark:border-slate-700/80 backdrop-blur-xl shadow-[0_0_0_1.3px_rgba(120,145,180,0.2),0_2px_10px_rgba(28,52,92,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`px-3 py-1.5 text-xs font-[570] tracking-[-0.02em] rounded-full transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#0F1B31] dark:bg-sky-500 text-white dark:text-slate-950 shadow-sm'
                  : 'text-[#202940] dark:text-slate-300 hover:text-[#020C21] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              {item.id === 'chat' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#4A78B0] dark:bg-sky-400 animate-pulse"></span>
              )}
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-white/20 dark:bg-slate-950/20 text-white dark:text-slate-950'
                      : 'bg-[#DDE4EE] dark:bg-slate-800 text-[#020C21] dark:text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right User & CTA Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 bg-white/60 dark:bg-slate-900/70 border border-white/80 dark:border-slate-700/80 rounded-full text-[#020C21] dark:text-slate-200 shadow-xs">
          <span className="text-[#59627E] dark:text-slate-400">Saved:</span>
          <span className="font-semibold tabular-nums text-[#0F182F] dark:text-emerald-400">${totalSavedUsd.toFixed(3)}</span>
        </div>

        {/* Theme Switcher Toggle Button */}
        <ThemeToggle />

        {currentUser ? (
          <button
            onClick={() => handleNavClick('login')}
            className={`flex items-center gap-2 pl-3 pr-1 py-1 rounded-full border text-xs transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-[#0F1B31] dark:bg-sky-500 text-white dark:text-slate-950 border-transparent'
                : 'bg-white/70 dark:bg-slate-900/80 border-white/90 dark:border-slate-700 text-[#020C21] dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <span className="font-medium hidden md:inline truncate max-w-[110px]">
              {currentUser.name}
            </span>
            <div className="w-7 h-7 rounded-full bg-[#384B64] dark:bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
              {currentUser.name.charAt(0)}
            </div>
          </button>
        ) : (
          <button
            onClick={() => handleNavClick('login')}
            className="flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-[#0F1B31] dark:bg-sky-500 text-white dark:text-slate-950 text-xs font-[425] shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <span>Sign In</span>
            <div className="w-6 h-6 rounded-full bg-[#384B64] dark:bg-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform text-white">
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        )}

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-full bg-white/80 dark:bg-slate-800/80 border border-white/90 dark:border-slate-700 text-[#020C21] dark:text-slate-100 cursor-pointer"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-4 right-4 bg-white/95 dark:bg-slate-900/95 border border-white/90 dark:border-slate-800 p-4 rounded-3xl shadow-xl lg:hidden flex flex-col gap-2 z-50 backdrop-blur-2xl animate-in slide-in-from-top-2">
          {/* Mobile Theme Toggle Row */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs mb-1">
            <span className="font-medium text-slate-700 dark:text-slate-200">
              Theme Mode
            </span>
            <ThemeToggle showLabels />
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center justify-between p-3 rounded-2xl text-xs font-[570] text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#0F1B31] dark:bg-sky-500 text-white dark:text-slate-950'
                    : 'text-[#202940] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#DDE4EE] dark:bg-slate-800 text-[#020C21] dark:text-slate-200">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

