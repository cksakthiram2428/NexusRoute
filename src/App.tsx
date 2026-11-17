/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { LiveConsole } from './components/LiveConsole';
import { MultiPartDecomposer } from './components/MultiPartDecomposer';
import { BenchmarkVisualizer } from './components/BenchmarkVisualizer';
import { PolicyConfig } from './components/PolicyConfig';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ChatCopilot } from './components/ChatCopilot';
import { LoginPage, UserSession } from './components/LoginPage';
import { FeaturesCenter } from './components/FeaturesCenter';
import { Custom404 } from './components/Custom404';
import { LegalModals } from './components/LegalModals';
import {
  ExecutionTrace,
  ModelSpec,
  RoutingPolicyConfig,
  SystemMetrics,
} from './types/router';
import { DEFAULT_ROUTING_POLICY } from './lib/classifier';
import { SUPPORTED_MODELS, formatUsd } from './lib/pricing';
import { X, Copy, Check, Clock, Layers, Coins, Cpu, ShieldCheck, Zap, Cookie, ArrowUp, Keyboard, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { showToast } from './lib/toast';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');
  const [models, setModels] = useState<ModelSpec[]>(SUPPORTED_MODELS);
  const [policy, setPolicy] = useState<RoutingPolicyConfig>(DEFAULT_ROUTING_POLICY);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<ExecutionTrace | null>(null);
  const [copiedModal, setCopiedModal] = useState(false);

  // Toast notifications, back-to-top button, keyboard shortcuts modal
  const [toasts, setToasts] = useState<{ id: number; message: string; kind: 'success' | 'info' | 'error' }[]>([]);
  const [showBackTop, setShowBackTop] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Cookie consent banner state (Feature #5)
  const [showCookieBanner, setShowCookieBanner] = useState(() => {
    try {
      return localStorage.getItem('nexusroute_cookie_consent') !== 'accepted';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const showBanner = () => setShowCookieBanner(true);
    window.addEventListener('nexusroute:show-cookie-banner', showBanner);
    return () => window.removeEventListener('nexusroute:show-cookie-banner', showBanner);
  }, []);

  const handleCookieConsent = (accepted: boolean) => {
    try {
      localStorage.setItem('nexusroute_cookie_consent', accepted ? 'accepted' : 'declined');
    } catch {}
    setShowCookieBanner(false);
    showToast(accepted ? 'Cookie preferences saved — analytics enabled' : 'Cookie preferences saved — analytics declined', 'info');
  };

  // Global toast listener (event-based, avoids prop drilling)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ message: string; kind?: 'success' | 'info' | 'error' }>).detail;
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, message: detail.message, kind: detail.kind || 'success' }]);
      setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 3200);
    };
    window.addEventListener('nexusroute:toast', handler);
    return () => window.removeEventListener('nexusroute:toast', handler);
  }, []);

  // Back-to-top visibility on scroll
  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Keyboard shortcuts: 1-8 tabs, ? help, Esc close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (e.key === 'Escape') {
        setSelectedTrace(null);
        setShowShortcuts(false);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '?') {
        setShowShortcuts(true);
        return;
      }
      const tabByDigit: Record<string, ActiveTab> = {
        '1': 'console',
        '2': 'decomposer',
        '3': 'benchmarks',
        '4': 'policy',
        '5': 'analytics',
        '6': 'chat',
        '7': 'features',
        '8': 'login',
      };
      const tab = tabByDigit[e.key];
      if (tab) setActiveTab(tab);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // User session state — panels (except Overview) require authentication
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Legal modals
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Fetch initial system data
  const fetchSystemData = async () => {
    try {
      // 1. Fetch Models
      const modelsRes = await fetch('/api/models');
      if (modelsRes.ok) {
        const data = await modelsRes.json();
        if (data.models) setModels(data.models);
      }

      // 2. Fetch Policy
      const policyRes = await fetch('/api/config/routing-policy');
      if (policyRes.ok) {
        const pData = await policyRes.json();
        setPolicy(pData);
      }

      // 3. Fetch Metrics
      const metricsRes = await fetch('/api/stats/summary');
      if (metricsRes.ok) {
        const mData = await metricsRes.json();
        setMetrics(mData);
      }
    } catch (err) {
      console.error('Initial load error:', err);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  // Restore authenticated session from localStorage on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem('nexusroute_session_token');
      if (!token) return;
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            setCurrentUser(data.user);
          } else {
            localStorage.removeItem('nexusroute_session_token');
          }
        })
        .catch(() => localStorage.removeItem('nexusroute_session_token'));
    } catch {
      localStorage.removeItem('nexusroute_session_token');
    }
  }, []);

  const handleLogin = (session: UserSession, token: string) => {
    try {
      localStorage.setItem('nexusroute_session_token', token);
    } catch {}
    setCurrentUser(session);
    setActiveTab('console');
  };

  const handleLogout = () => {
    try {
      const token = localStorage.getItem('nexusroute_session_token');
      if (token) {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
      localStorage.removeItem('nexusroute_session_token');
    } catch {}
    setCurrentUser(null);
    setActiveTab('landing');
  };

  const handleExecutionComplete = (trace: ExecutionTrace) => {
    // Refresh metrics on completion
    fetch('/api/stats/summary')
      .then((res) => res.json())
      .then((data) => setMetrics(data))
      .catch(console.error);
  };

  const handleCopyModal = () => {
    if (selectedTrace?.finalOutput) {
      navigator.clipboard.writeText(selectedTrace.finalOutput);
      setCopiedModal(true);
      setTimeout(() => setCopiedModal(false), 2000);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#E6EDF6] dark:bg-[#0A0F1D] text-[#020C21] dark:text-[#F1F5F9] flex flex-col selection:bg-[#0F1B31] dark:selection:bg-sky-500 selection:text-white font-sans antialiased transition-colors duration-200">
      {/* Accessibility: skip straight to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-full focus:bg-[#0F1B31] focus:dark:bg-sky-500 focus:text-white focus:dark:text-slate-950 focus:text-xs focus:font-semibold"
      >
        Skip to main content
      </a>

      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        policy={policy}
        totalSavedUsd={metrics?.totalCostSavedUsd || 28.452}
        currentUser={currentUser}
      />

      {/* Main Content Viewport - Full System Screen Responsive */}
      <main id="main-content" className="flex-1 w-full px-4 sm:px-6 lg:px-8 pt-20 pb-5 overflow-x-hidden">
        {activeTab === 'landing' && (
          <LandingPage
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
            onOpenTerms={() => setIsTermsOpen(true)}
          />
        )}

        {/* Panels (except Overview) are gated behind authentication */}
        {activeTab !== 'landing' && !currentUser ? (
          <div className="space-y-6">
            <LoginPage
              currentUser={null}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onNavigate={(t) => setActiveTab(t)}
            />
          </div>
        ) : null}

        {activeTab !== 'landing' && currentUser && (
          <div className="space-y-6">
            {activeTab === 'console' && (
              <LiveConsole
                models={models}
                policy={policy}
                onExecutionComplete={handleExecutionComplete}
                onNavigate={(t) => setActiveTab(t)}
              />
            )}

            {activeTab === 'decomposer' && (
              <MultiPartDecomposer
                models={models}
                policy={policy}
                onNavigate={(t) => setActiveTab(t)}
              />
            )}

            {activeTab === 'benchmarks' && (
              <BenchmarkVisualizer onNavigate={(t) => setActiveTab(t)} />
            )}

            {activeTab === 'policy' && (
              <PolicyConfig
                policy={policy}
                onUpdatePolicy={(newPolicy) => setPolicy(newPolicy)}
                onNavigate={(t) => setActiveTab(t)}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsDashboard
                metrics={metrics}
                onRefresh={fetchSystemData}
                onNavigate={(t) => setActiveTab(t)}
              />
            )}

            {activeTab === 'chat' && (
              <ChatCopilot onNavigate={(t) => setActiveTab(t)} />
            )}

            {activeTab === 'features' && (
              <FeaturesCenter
                onOpenPrivacy={() => setIsPrivacyOpen(true)}
                onOpenTerms={() => setIsTermsOpen(true)}
                onNavigate={(t) => setActiveTab(t)}
              />
            )}

            {activeTab === 'login' && (
              <LoginPage
                currentUser={currentUser}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onNavigate={(t) => setActiveTab(t)}
              />
            )}

            {activeTab === '404' && (
              <Custom404 onNavigate={(t) => setActiveTab(t)} />
            )}
          </div>
        )}
      </main>

      {/* Persistent Light/Dark-Theme Footer */}
      <footer className="border-t border-[#CBD8E8] dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md py-6 px-4 sm:px-6 lg:px-8 text-center text-xs text-[#59627E] dark:text-slate-400 font-sans flex flex-col sm:flex-row items-center justify-between gap-4 w-full mt-auto transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#0d1b30] dark:bg-sky-500 text-white dark:text-slate-950 flex items-center justify-center font-bold text-[10px]">
            <Zap className="w-3.5 h-3.5 text-white dark:text-slate-950" />
          </div>
          <span className="font-[520] text-[#020C21] dark:text-slate-100">NexusRoute</span>
          <span>·</span>
          <span>LLM Cost Optimization & Multi-Model Routing Engine</span>
        </div>

        <div className="flex items-center flex-wrap gap-4 text-xs font-[470]">
          <button
            onClick={() => setActiveTab('features')}
            className="text-[#020C21] dark:text-slate-200 hover:underline cursor-pointer font-semibold"
          >
            20/20 Features Center
          </button>
          <span>·</span>
          <button
            onClick={() => setIsPrivacyOpen(true)}
            className="text-[#59627E] dark:text-slate-400 hover:text-[#020C21] dark:hover:text-slate-200 cursor-pointer"
          >
            Privacy & Zero-Egress
          </button>
          <span>·</span>
          <button
            onClick={() => setIsTermsOpen(true)}
            className="text-[#59627E] dark:text-slate-400 hover:text-[#020C21] dark:hover:text-slate-200 cursor-pointer"
          >
            Terms of Service
          </button>
          <span>·</span>
          <button
            onClick={() => setActiveTab('404')}
            className="text-[#59627E] dark:text-slate-400 hover:text-[#020C21] dark:hover:text-slate-200 cursor-pointer"
          >
            Test 404 Route
          </button>
        </div>
      </footer>

      {/* Legal & Cookie Compliance Modals */}
      <LegalModals
        isPrivacyOpen={isPrivacyOpen}
        onClosePrivacy={() => setIsPrivacyOpen(false)}
        isTermsOpen={isTermsOpen}
        onCloseTerms={() => setIsTermsOpen(false)}
      />

      {/* Cookie Consent Banner (Feature #5) */}
      {showCookieBanner && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-4 sm:right-auto sm:w-[380px] z-50 bg-white dark:bg-slate-900 border border-[#CBD8E8] dark:border-slate-700 rounded-3xl p-5 shadow-2xl space-y-3">
          <div className="flex items-center gap-2">
            <Cookie className="w-4 h-4 text-[#0F1B31] dark:text-sky-400" />
            <h3 className="text-xs font-bold text-[#020C21] dark:text-slate-100">Cookie Consent</h3>
          </div>
          <p className="text-[11px] text-[#59627E] dark:text-slate-400 leading-relaxed">
            NexusRoute uses strictly necessary cookies for routing telemetry and policy persistence only. No third-party tracking or advertising cookies are deployed.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleCookieConsent(true)}
              className="flex-1 px-3 py-2 rounded-full bg-[#0F1B31] dark:bg-sky-500 hover:bg-[#1A2B45] dark:hover:bg-sky-400 text-white dark:text-slate-950 text-xs font-semibold cursor-pointer transition-all"
            >
              Accept All
            </button>
            <button
              onClick={() => handleCookieConsent(false)}
              className="flex-1 px-3 py-2 rounded-full bg-[#E6EDF6] dark:bg-slate-800 hover:bg-[#CBD8E8] dark:hover:bg-slate-700 text-[#020C21] dark:text-slate-200 text-xs font-semibold cursor-pointer border border-[#CBD8E8] dark:border-slate-700 transition-all"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Audit Trace Detail Modal */}
      {selectedTrace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-[#CBD8E8] dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E6EDF6] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#020C21] dark:text-sky-400" />
                <h3 className="text-sm font-[520] text-[#020C21] dark:text-slate-100">
                  Execution Audit Trace Inspector
                </h3>
              </div>
              <button
                onClick={() => setSelectedTrace(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <div className="text-[#59627E] dark:text-slate-400 font-sans font-medium">User Prompt:</div>
                <div className="p-3 bg-[#E6EDF6]/60 dark:bg-slate-800/60 rounded-xl border border-[#CBD8E8] dark:border-slate-700 text-[#020C21] dark:text-slate-100">
                  {selectedTrace.prompt}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-white dark:bg-slate-850 dark:bg-slate-800 rounded-xl border border-[#CBD8E8] dark:border-slate-700">
                  <div className="text-[#59627E] dark:text-slate-400 text-[10px] font-sans">Model Used</div>
                  <div className="text-[#020C21] dark:text-slate-100 font-bold truncate">
                    {selectedTrace.selectedModelId}
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-[#CBD8E8] dark:border-slate-700">
                  <div className="text-[#59627E] dark:text-slate-400 text-[10px] font-sans">Complexity Score</div>
                  <div className="text-[#020C21] dark:text-slate-100 font-bold">
                    {selectedTrace.routingAnalysis.overallComplexity} / 100
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-[#CBD8E8] dark:border-slate-700">
                  <div className="text-[#59627E] dark:text-slate-400 text-[10px] font-sans">Actual Latency</div>
                  <div className="text-[#020C21] dark:text-slate-100 font-bold">
                    {selectedTrace.totalLatencyMs}ms
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                  <div className="text-emerald-800 dark:text-emerald-300 text-[10px] font-sans">Net Cost Saved</div>
                  <div className="text-emerald-800 dark:text-emerald-300 font-bold">
                    {selectedTrace.costReductionPercent}% ({formatUsd(selectedTrace.totalCost)})
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[#59627E] dark:text-slate-400 font-sans font-medium">Routing Rationale & Heuristic Signals:</div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-[#CBD8E8] dark:border-slate-700 text-[#0F182F] dark:text-slate-200 leading-relaxed font-sans text-xs">
                  {selectedTrace.routingAnalysis.routingRationale}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[#59627E] dark:text-slate-400 font-sans font-medium">
                  <span>Generated Model Output:</span>
                  <button
                    onClick={handleCopyModal}
                    className="text-[#020C21] dark:text-slate-200 hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
                  >
                    {copiedModal ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedModal ? 'Copied' : 'Copy Output'}</span>
                  </button>
                </div>
                <div className="p-3 bg-[#E6EDF6]/60 dark:bg-slate-800/60 rounded-xl border border-[#CBD8E8] dark:border-slate-700 text-[#020C21] dark:text-slate-100 whitespace-pre-wrap max-h-56 overflow-y-auto font-mono text-[11px]">
                  {selectedTrace.finalOutput}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#CBD8E8] dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
              <button
                onClick={() => setSelectedTrace(null)}
                className="px-5 py-2 rounded-full bg-[#0F1B31] hover:bg-[#1A2B45] dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 text-xs font-[425] shadow-xs cursor-pointer transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back to Top floating button */}
      {showBackTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-[#0F1B31] dark:bg-sky-500 hover:bg-[#1A2B45] dark:hover:bg-sky-400 text-white dark:text-slate-950 shadow-lg flex items-center justify-center transition-all hover:-translate-y-1 cursor-pointer"
          title="Back to top (press ? for shortcuts)"
          aria-label="Back to top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* Toast notification stack */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#CBD8E8] dark:border-slate-700 shadow-xl text-xs font-semibold max-w-xs animate-in slide-in-from-top-2"
          >
            {toast.kind === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : toast.kind === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            )}
            <span className="text-[#020C21] dark:text-slate-100">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Keyboard Shortcuts help modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white dark:bg-slate-900 border border-[#CBD8E8] dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[#E6EDF6] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-[#020C21] dark:text-sky-400" />
                <h3 className="text-sm font-[520] text-[#020C21] dark:text-slate-100">Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close shortcuts"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-2 text-xs font-mono">
              {[
                ['1 – 8', 'Switch between primary tabs'],
                ['?', 'Open this shortcuts panel'],
                ['Esc', 'Close inspector & dialogs'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-[#E6EDF6]/60 dark:bg-slate-800/60 border border-[#CBD8E8] dark:border-slate-700">
                  <kbd className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-[#CBD8E8] dark:border-slate-600 font-bold text-[#020C21] dark:text-slate-100">{key}</kbd>
                  <span className="text-[#59627E] dark:text-slate-400 font-sans">{desc}</span>
                </div>
              ))}
              <p className="text-[10px] text-[#59627E] dark:text-slate-400 font-sans pt-1">
                Shortcuts pause automatically while typing in any input field.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
