import React, { useState } from 'react';
import {
  Zap,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Cpu,
  BarChart3,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sliders,
  Terminal,
  Activity,
  Bot,
  Compass,
  GitBranch,
  ShieldCheck,
  Check,
  Radio,
  FileCode,
  Calculator,
  ArrowDown,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (tab: 'landing' | 'console' | 'decomposer' | 'benchmarks' | 'policy' | 'analytics' | 'chat' | 'login' | 'features' | '404') => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const workflowSteps = [
    {
      id: 0,
      stepNumber: '01',
      title: 'Heuristic Token & Signal Profiling',
      tag: '4ms Pre-Flight',
      icon: Terminal,
      headline: 'Instant Structural & Semantic Ingestion',
      description: 'As queries arrive, NexusRoute evaluates 8 real-time heuristic invariants: symbolic math expressions, code syntax trees, deterministic tabular extractions, and PII patterns.',
      diagramLabel: 'Payload Profiler',
      metrics: {
        latency: '3.8ms',
        egressDetection: '100% HIPAA/GDPR Intercept',
        decisionWindow: 'Instantaneous',
      },
      codeSnippet: `// Heuristic Signal Vector
const signals = [
  { type: "symbolic_math", weight: 0.85, detected: true },
  { type: "pii_ssn_pattern", weight: 1.0, detected: false },
  { type: "json_structure", weight: 0.40, detected: true }
];`,
    },
    {
      id: 1,
      stepNumber: '02',
      title: '3D Complexity Vector Scoring',
      tag: '0–100 Index',
      icon: Compass,
      headline: 'Algorithmic Difficulty Classification',
      description: 'Computes a calibrated multi-dimensional complexity score (0–100). Low complexity (≤35) routes to on-premises hardware, while complex deductive tasks (>72) escalate to frontier models.',
      diagramLabel: 'Classification Engine',
      metrics: {
        accuracyParity: '98.6% vs Flagship',
        localRetentionRate: '48.2% of Enterprise Traffic',
        thresholdSensitivity: 'Dynamic Calibration',
      },
      codeSnippet: `// Complexity Vector Resolution
const complexityScore = 28; // Level: Deterministic Edge
const targetTier = "local_edge_llama_3.2_3b";
const policyAction = "ROUTE_LOCAL_ZERO_EGRESS";`,
    },
    {
      id: 2,
      stepNumber: '03',
      title: 'Parallel Query Splitting & Dispatch',
      tag: 'Multi-Part Splitter',
      icon: Layers,
      headline: 'Sub-Task Partitioning & Concurrent Execution',
      description: 'Compound multi-intent requests are automatically decomposed into distinct sub-tasks, dispatched in parallel to the cheapest capable model tier, and merged into a unified response.',
      diagramLabel: 'Parallel Execution Bus',
      metrics: {
        parallelConcurrency: 'Up to 6 Sub-Streams',
        latencyReduction: '42% faster than sequential',
        synthesisIntegrity: '100% Schema Validation',
      },
      codeSnippet: `// Multi-Part Decomposition Tree
SubTask 1: [Extract Entities] -> Local Llama 3.2 ($0.00)
SubTask 2: [Generate SQL Schema] -> Gemini Flash-Lite ($0.075)
SubTask 3: [Synthesis & Merge] -> Cohesive Unified Output`,
    },
    {
      id: 3,
      stepNumber: '04',
      title: 'Telemetry & Cost Reduction Ledger',
      tag: 'Audit & SLA',
      icon: TrendingDown,
      headline: 'Auditable Savings & Quality Assurance',
      description: 'Every token, millisecond, and dollar saved is permanently logged in your local audit ledger, verifying quality parity on GSM8K and MMLU benchmarks in real time.',
      diagramLabel: 'Savings Verification Engine',
      metrics: {
        totalCostReduction: '68.4% Realized Savings',
        slaUptime: '99.98% High Availability',
        qualityDelta: '1.4% within Flagship',
      },
      codeSnippet: `// Real-Time Audit Trace
{
  "baselineFlagshipSpend": "$0.00342",
  "actualNexusRouteSpend": "$0.00018",
  "netSavings": "68.4% ($0.00324 Saved)",
  "qualityScore": 99.1
}`,
    },
  ];

  return (
    <div className="relative w-full space-y-12">
      {/* Hero Section Plate - High-contrast in both light & dark mode */}
      <div className="relative w-full min-h-[540px] flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-hidden rounded-[32px] border border-[#CBD8E8] dark:border-slate-800 shadow-sm bg-[#E6EDF6] dark:bg-[#090F1E] transition-colors">
        {/* Ambient video background with dark mode tint overlay to preserve contrast */}
        <video
          className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90 dark:opacity-40 filter brightness-[1.006] dark:brightness-75 saturate-[0.965]"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-hidden="true"
          poster="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_105822_bf7c2d53-9957-4521-bbbf-7c1ab7a70130.png"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_105953_21ad8049-9088-4a00-bad3-aee6b5575a2b.mp4"
        />
        {/* Light & Dark backdrop overlays */}
        <div className="absolute inset-0 bg-[rgba(255,249,240,0.08)] dark:bg-gradient-to-r dark:from-[#090F1E]/95 dark:via-[#090F1E]/80 dark:to-[#090F1E]/60 pointer-events-none z-1" />

        {/* Hero Content Area */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
          {/* Left Column: Headlines & Action */}
          <div className="lg:col-span-8 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 dark:bg-slate-900/90 border border-slate-700/80 text-white text-[10px] sm:text-xs font-mono font-semibold backdrop-blur-md shadow-md max-w-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span className="truncate">ENTERPRISE LLM INFRASTRUCTURE & FINOPS</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-[360] tracking-[-0.035em] text-[#020C21] dark:text-white leading-[1.04]">
              <span className="sx block text-[#020C21] dark:text-white" style={{ '--sx': 0.9431 } as React.CSSProperties}>
                Smarter Routing.
              </span>
              <span className="sx block font-[470] text-[#020C21] dark:text-white" style={{ '--sx': 0.9792 } as React.CSSProperties}>
                68% Less Spend.
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg font-[425] text-[#4D5B77] dark:text-slate-200 max-w-2xl leading-relaxed">
              Dynamically classify task complexity, split compound multi-part prompts, and dispatch across local edge hardware ($0 egress) and cloud models with zero quality loss.
            </p>

            <div className="flex items-center gap-3 sm:gap-4 pt-2 flex-wrap">
              <button
                onClick={() => onNavigate('console')}
                className="flex items-center gap-3 pl-5 sm:pl-6 pr-2.5 py-2.5 sm:py-3 rounded-full bg-[#0F1B31] dark:bg-sky-500 hover:bg-[#1A2B45] dark:hover:bg-sky-400 text-white dark:text-slate-950 shadow-[0_10px_24px_rgba(11,26,50,0.18)] hover:-translate-y-0.5 transition-all cursor-pointer group"
              >
                <span className="text-xs font-[520] tracking-[-0.02em]">Launch Dynamic Router</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#384B64] dark:bg-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform text-white">
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </button>

              <button
                onClick={() => onNavigate('benchmarks')}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 text-[#020C21] dark:text-slate-100 border border-white/90 dark:border-slate-700 text-xs font-[520] backdrop-blur-md shadow-xs transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#4A78B0] dark:text-sky-400" />
                <span>View A/B Quality Arena</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Telemetry Glass Card */}
          <div className="lg:col-span-4">
            <aside className="w-full max-w-sm lg:ml-auto mx-auto p-5 sm:p-6 rounded-[28px] bg-white/80 dark:bg-slate-900/90 border border-white/90 dark:border-slate-700/80 backdrop-blur-2xl shadow-xl space-y-4 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-[520] tracking-[-0.02em] text-[#020C21] dark:text-slate-100">
                    Active Dispatcher
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/95 dark:bg-slate-800 flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-[#0F1B31] dark:text-sky-400" />
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/90 dark:bg-slate-950/90 rounded-2xl border border-slate-800 space-y-1.5 text-xs font-mono shadow-inner">
                <div className="flex justify-between text-slate-300">
                  <span>Local Edge (Llama 3.2):</span>
                  <span className="font-bold text-emerald-400">$0.00 / 1M</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Cloud Lite (Flash-Lite):</span>
                  <span className="font-bold text-white">$0.075 / 1M</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Cloud Flagship (Pro):</span>
                  <span className="font-bold text-amber-400">$1.25 / 1M</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs font-[470] text-[#586580] dark:text-slate-300 font-mono">
                  <span>Edge Traffic (48%)</span>
                  <span>Cloud Traffic (52%)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#DDE4EE] dark:bg-slate-800 overflow-hidden flex">
                  <div className="h-full w-[48%] bg-emerald-500"></div>
                  <div className="h-full w-[52%] bg-sky-600 dark:bg-sky-500"></div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Bottom Stats & Empirical Metrics Bar */}
        <div className="relative z-10 pt-6 mt-6 border-t border-[#CBD8E8] dark:border-slate-800 flex items-end justify-between flex-wrap gap-6">
          <div className="flex items-center gap-6 sm:gap-12 flex-wrap">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-6xl font-[200] text-[#020C21] dark:text-white font-sans">
                68.4%
              </span>
              <span className="text-xs font-[400] text-[#39455F] dark:text-slate-200 leading-tight">
                Empirical Cost<br />Reduction
              </span>
            </div>

            <div className="stat-slash hidden sm:block"></div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-6xl font-[200] text-[#020C21] dark:text-white font-sans">
                98.6%
              </span>
              <span className="text-xs font-[400] text-[#39455F] dark:text-slate-200 leading-tight">
                Quality Parity<br />GSM8K & MMLU
              </span>
            </div>

            <div className="stat-slash hidden sm:block"></div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-6xl font-[200] text-[#020C21] dark:text-white font-sans">
                100%
              </span>
              <span className="text-xs font-[400] text-[#39455F] dark:text-slate-200 leading-tight">
                Zero-Egress<br />PII Compliance
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('features')}
            className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 dark:bg-slate-950/90 border border-slate-700 text-white dark:text-slate-100 text-xs font-[520] backdrop-blur-md hover:bg-slate-900 shadow-md cursor-pointer transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>20/20 Production Requirements</span>
          </button>
        </div>
      </div>

      {/* Interactive Process Pipeline Architecture - High-Contrast Dark Mode Tags & Cards */}
      <div className="bg-white/85 dark:bg-slate-900/90 border border-[#CBD8E8] dark:border-slate-800 rounded-[32px] p-6 sm:p-10 shadow-xs backdrop-blur-xl space-y-8 transition-colors">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-[#E6EDF6] dark:border-slate-800">
          <div>
            {/* High-visibility pill tag in dark mode */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-100 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-700/80 text-sky-900 dark:text-sky-300 text-xs font-mono font-bold mb-2 shadow-xs">
              <GitBranch className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
              <span>END-TO-END EXECUTION PIPELINE</span>
            </div>
            <h2 className="text-2xl font-[520] tracking-tight text-[#020C21] dark:text-white">
              How NexusRoute Dynamically Optimizes Every Query
            </h2>
            <p className="text-xs text-[#59627E] dark:text-slate-300 mt-1">
              Select any stage below to inspect the real-time classification, dispatch, and synthesis workflow.
            </p>
          </div>

          <button
            onClick={() => onNavigate('policy')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F1B31] dark:bg-sky-500 text-white dark:text-slate-950 text-xs font-[520] hover:bg-[#1A2B45] dark:hover:bg-sky-400 transition-all cursor-pointer shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize Routing Policies</span>
          </button>
        </div>

        {/* 4 Interactive Process Step Tabs - Clear dark mode tag and label styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {workflowSteps.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 border-[#0F1B31] dark:border-sky-400 shadow-md ring-2 ring-[#0F1B31]/10 dark:ring-sky-500/30'
                    : 'bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 border-[#CBD8E8] dark:border-slate-800 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[11px] ${
                        isActive
                          ? 'bg-[#0F1B31] dark:bg-sky-500 text-white dark:text-slate-950'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {step.stepNumber}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-300 border border-sky-300 dark:border-sky-700'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {step.tag}
                    </span>
                  </div>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#0F1B31] dark:text-sky-400' : 'text-[#59627E] dark:text-slate-400'}`} />
                </div>

                <div className="font-[520] text-xs text-[#020C21] dark:text-slate-100 line-clamp-1">
                  {step.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Stage Visual Architecture Breakdown */}
        {(() => {
          const cur = workflowSteps[activeStep];
          const CurIcon = cur.icon;
          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 rounded-3xl bg-[#E6EDF6]/40 dark:bg-slate-900/60 border border-[#CBD8E8] dark:border-slate-800 transition-colors">
              {/* Left Stage Details */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-[#0F1B31] dark:bg-sky-500 text-white dark:text-slate-950 text-xs font-mono font-bold">
                    Stage {cur.stepNumber}
                  </span>
                  <span className="text-xs font-mono text-[#59627E] dark:text-slate-300">
                    {cur.diagramLabel}
                  </span>
                </div>

                <h3 className="text-xl font-[520] text-[#020C21] dark:text-white">
                  {cur.headline}
                </h3>

                <p className="text-xs sm:text-sm text-[#4D5B77] dark:text-slate-200 leading-relaxed font-sans">
                  {cur.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  {Object.entries(cur.metrics).map(([k, v], i) => (
                    <div key={i} className="p-3 bg-white dark:bg-slate-800/90 rounded-2xl border border-[#CBD8E8] dark:border-slate-700 space-y-1 shadow-xs transition-colors">
                      <div className="text-[10px] font-mono text-[#59627E] dark:text-slate-400 uppercase tracking-wider truncate">
                        {k.replace(/([A-Z])/g, ' $1')}
                      </div>
                      <div className="text-xs font-bold text-[#020C21] dark:text-slate-100 font-mono truncate">
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Stage Code / Diagram Preview */}
              <div className="lg:col-span-6">
                <div className="p-4 bg-[#020C21] dark:bg-[#070B14] rounded-2xl border border-slate-800 dark:border-slate-700/80 text-slate-100 font-mono text-xs space-y-2 shadow-lg">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      Live Pipeline Trace
                    </span>
                    <span className="text-emerald-400">Status: Active</span>
                  </div>
                  <pre className="text-[11px] text-slate-300 overflow-x-auto p-2 leading-relaxed whitespace-pre-wrap">
                    {cur.codeSnippet}
                  </pre>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
