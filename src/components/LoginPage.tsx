import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Key,
  Building,
  UserCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Cpu,
  Layers,
  Zap,
} from 'lucide-react';
import { ActiveTab } from './Header';
import { TopPanelBar, BottomNextStep } from './PanelNavigation';

export interface UserSession {
  email: string;
  name: string;
  organization: string;
  role: string;
  apiKey: string;
  tier: 'Enterprise Scale' | 'Growth' | 'Developer';
  monthlyBudgetUsd: number;
}

interface LoginPageProps {
  currentUser: UserSession | null;
  onLogin: (session: UserSession) => void;
  onLogout: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentUser,
  onLogin,
  onLogout,
  onNavigate,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('lead.engineer@acme-enterprise.io');
  const [password, setPassword] = useState('••••••••••••');
  const [org, setOrg] = useState('Acme Global Enterprises');
  const [role, setRole] = useState('Staff ML Infrastructure Architect');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        email,
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        organization: org,
        role: role,
        apiKey: `nx_live_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`,
        tier: 'Enterprise Scale',
        monthlyBudgetUsd: 15000,
      });
      setIsLoading(false);
    }, 600);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        email: 'alex.vance@cloud-vertex.ai',
        name: 'Alex Vance',
        organization: 'Vertex AI Infrastructure Lab',
        role: 'Director of AI FinOps',
        apiKey: `nx_live_gsuite_${Math.random().toString(36).substr(2, 8)}`,
        tier: 'Enterprise Scale',
        monthlyBudgetUsd: 25000,
      });
      setIsLoading(false);
    }, 500);
  };

  // If already logged in, show User Account & API Key Management view
  if (currentUser) {
    return (
      <div className="w-full space-y-6">
        {/* Top Breadcrumb & Step Navigation */}
        {onNavigate && <TopPanelBar currentTab="login" onNavigate={onNavigate} />}

        {/* Account Banner */}
        <div className="bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs backdrop-blur-xl space-y-5 transition-colors">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0F1B31] dark:bg-sky-500 text-white dark:text-slate-950 flex items-center justify-center font-bold text-lg font-display shadow-xs shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-[#020C21] dark:text-slate-100 font-display">
                    {currentUser.name}
                  </h2>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Active Session</span>
                  </span>
                </div>
                <div className="text-xs text-[#59627E] dark:text-slate-400 font-sans mt-0.5">
                  {currentUser.role} · <strong className="text-[#020C21] dark:text-slate-200">{currentUser.organization}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onNavigate('console')}
                className="px-4 py-2 rounded-full bg-[#0F1B31] dark:bg-sky-500 hover:bg-[#1A2B45] dark:hover:bg-sky-400 text-white dark:text-slate-950 text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Open Router Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onLogout}
                className="px-3.5 py-2 rounded-full bg-[#E6EDF6] dark:bg-slate-800 hover:bg-[#CBD8E8] dark:hover:bg-slate-700 text-[#020C21] dark:text-slate-200 border border-[#CBD8E8] dark:border-slate-700 text-xs font-mono transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* User API Key Box */}
          <div className="p-4 bg-[#E6EDF6]/50 dark:bg-slate-800/60 border border-[#CBD8E8] dark:border-slate-700 rounded-2xl space-y-2 transition-colors">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-mono font-semibold text-[#020C21] dark:text-slate-100 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#0F1B31] dark:text-sky-400" />
                Enterprise Proxy API Key
              </span>
              <span className="text-[11px] font-mono text-[#59627E] dark:text-slate-400">Tier: {currentUser.tier}</span>
            </div>

            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-[#CBD8E8] dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-[#020C21] dark:text-slate-100 transition-colors">
              <span className="truncate mr-2">{currentUser.apiKey}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentUser.apiKey);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="ml-auto text-[#59627E] dark:text-slate-400 hover:text-[#020C21] dark:hover:text-white cursor-pointer flex items-center gap-1 shrink-0"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="text-[11px] text-[#59627E] dark:text-slate-400 font-sans">
              Use this bearer key with your SDK to route requests through the NexusRoute gateway endpoint.
            </div>
          </div>
        </div>

        {/* 3D Visual Figure: Enterprise Account Architecture */}
        <div className="bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 rounded-3xl p-6 shadow-xs backdrop-blur-xl space-y-4 transition-colors">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#59627E] dark:text-slate-400 font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0F1B31] dark:text-sky-400" />
            <span>3D Gateway Dispatch Topology for {currentUser.organization}</span>
          </div>

          <div className="relative min-h-[160px] bg-[#E6EDF6]/30 dark:bg-slate-950/60 rounded-2xl border border-[#CBD8E8] dark:border-slate-700/60 p-4 flex flex-col sm:flex-row items-center justify-around gap-4 overflow-hidden">
            {/* 3D Visual Isometric Grid Background */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {/* Node 1: Client SDK */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-1">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border-2 border-[#0F1B31] dark:border-sky-500 shadow-md flex items-center justify-center text-[#020C21] dark:text-slate-100 font-bold">
                <Cpu className="w-6 h-6 text-[#0F1B31] dark:text-sky-400" />
              </div>
              <span className="text-xs font-bold text-[#020C21] dark:text-slate-100 font-display">Client SDK</span>
              <span className="text-[10px] font-mono text-[#59627E] dark:text-slate-400">{currentUser.organization}</span>
            </div>

            {/* Connection Arrow */}
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-700/60 mb-1">
                Zero Egress Gating
              </span>
              <div className="w-16 sm:w-20 h-0.5 bg-[#CBD8E8] dark:bg-slate-700 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-[#59627E] dark:border-slate-400 rotate-45"></div>
              </div>
            </div>

            {/* Node 2: NexusRoute Gateway */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-1">
              <div className="w-14 h-14 rounded-2xl bg-[#0F1B31] dark:bg-sky-500 text-white dark:text-slate-950 shadow-lg flex items-center justify-center font-bold">
                <Zap className="w-7 h-7 text-emerald-400 dark:text-slate-950" />
              </div>
              <span className="text-xs font-bold text-[#020C21] dark:text-slate-100 font-display">NexusRoute Router</span>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">68.4% Cost Saved</span>
            </div>

            {/* Connection Arrow */}
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-[10px] font-mono text-[#59627E] dark:text-slate-400 mb-1">Sub-Task Forking</span>
              <div className="w-16 sm:w-20 h-0.5 bg-[#CBD8E8] dark:bg-slate-700 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-[#59627E] dark:border-slate-400 rotate-45"></div>
              </div>
            </div>

            {/* Node 3: Model Fleet */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-1">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border-2 border-emerald-600 dark:border-emerald-500 shadow-md flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-[#020C21] dark:text-slate-100 font-display">Fleet Mesh</span>
              <span className="text-[10px] font-mono text-[#59627E] dark:text-slate-400">Edge · Lite · Pro</span>
            </div>
          </div>
        </div>

        {/* Bottom Continuous Step Flow Navigation */}
        {onNavigate && <BottomNextStep currentTab="login" onNavigate={onNavigate} />}
      </div>
    );
  }

  // Login / Registration Form View
  return (
    <div className="w-full max-w-lg mx-auto py-6 space-y-6">
      {/* Top Breadcrumb & Step Navigation */}
      {onNavigate && <TopPanelBar currentTab="login" onNavigate={onNavigate} />}

      <div className="bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs backdrop-blur-xl space-y-6 transition-colors">
        {/* Header */}
        <div className="space-y-1.5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#0F1B31] dark:bg-sky-500 text-white dark:text-slate-950 flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-6 h-6 text-emerald-400 dark:text-slate-950" />
          </div>
          <h2 className="text-2xl font-[520] text-[#020C21] dark:text-slate-100 font-display">
            {isSignUp ? 'Create Enterprise Account' : 'Sign in to NexusRoute'}
          </h2>
          <p className="text-xs text-[#59627E] dark:text-slate-400 font-sans">
            Access intelligent multi-tier LLM routing, cost analytics, and benchmark evaluation.
          </p>
        </div>

        {/* Google Enterprise SSO Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-[#CBD8E8] dark:border-slate-700 text-[#020C21] dark:text-slate-200 font-medium text-xs transition-all shadow-xs flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google Enterprise</span>
        </button>

        <div className="flex items-center gap-3 text-xs text-[#59627E] dark:text-slate-400">
          <div className="flex-1 h-px bg-[#CBD8E8] dark:border-slate-800"></div>
          <span className="font-mono text-[11px]">OR WORK EMAIL</span>
          <div className="flex-1 h-px bg-[#CBD8E8] dark:border-slate-800"></div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-[#020C21] dark:text-slate-200 font-mono">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#59627E] dark:text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#E6EDF6]/40 dark:bg-slate-800/60 border border-[#CBD8E8] dark:border-slate-700 text-[#020C21] dark:text-slate-100 placeholder-[#59627E] dark:placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#0F1B31] dark:focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#020C21] dark:text-slate-200 font-mono">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#59627E] dark:text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#E6EDF6]/40 dark:bg-slate-800/60 border border-[#CBD8E8] dark:border-slate-700 text-[#020C21] dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#0F1B31] dark:focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          {isSignUp && (
            <>
              <div className="space-y-1">
                <label className="font-semibold text-[#020C21] dark:text-slate-200 font-mono">Organization</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-[#59627E] dark:text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#E6EDF6]/40 dark:bg-slate-800/60 border border-[#CBD8E8] dark:border-slate-700 text-[#020C21] dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#0F1B31] dark:focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#020C21] dark:text-slate-200 font-mono">Role</label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-[#59627E] dark:text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#E6EDF6]/40 dark:bg-slate-800/60 border border-[#CBD8E8] dark:border-slate-700 text-[#020C21] dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#0F1B31] dark:focus:border-sky-500 font-mono"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-full bg-[#0F1B31] dark:bg-sky-500 hover:bg-[#1A2B45] dark:hover:bg-sky-400 text-white dark:text-slate-950 font-semibold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-[#59627E] dark:text-slate-400 hover:text-[#020C21] dark:hover:text-slate-100 underline transition-colors cursor-pointer font-sans"
          >
            {isSignUp ? 'Already have an enterprise account? Sign in' : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
};
