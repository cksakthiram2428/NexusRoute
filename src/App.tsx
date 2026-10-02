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
import { X, Copy, Check, Clock, Layers, Coins, Cpu, ShieldCheck, Zap } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');
  const [models, setModels] = useState<ModelSpec[]>(SUPPORTED_MODELS);
  const [policy, setPolicy] = useState<RoutingPolicyConfig>(DEFAULT_ROUTING_POLICY);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<ExecutionTrace | null>(null);
  const [copiedModal, setCopiedModal] = useState(false);

  // User session state
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    return {
      email: 'alex.vance@enterprise-infra.ai',
      name: 'Alex Vance',
      organization: 'Acme Global Infrastructure',
      role: 'Staff AI Systems Architect',
      apiKey: 'nx_live_9482_prod_alpha',
      tier: 'Enterprise Scale',
      monthlyBudgetUsd: 25000,
    };
  });

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
      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        policy={policy}
        totalSavedUsd={metrics?.totalCostSavedUsd || 28.452}
        currentUser={currentUser}
      />

      {/* Main Content Viewport - Full System Screen Responsive */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 pt-20 pb-5 overflow-x-hidden">
        {activeTab === 'landing' && (
          <LandingPage
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
            onOpenTerms={() => setIsTermsOpen(true)}
          />
        )}

        {activeTab !== 'landing' && (
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
                onSelectTrace={(t) => setSelectedTrace(t)}
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
                onLogin={(user) => {
                  setCurrentUser(user);
                  setActiveTab('console');
                }}
                onLogout={() => setCurrentUser(null)}
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
    </div>
  );
}
