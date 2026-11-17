import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Compass,
  Cpu,
  Layers,
  Zap,
  Sliders,
  BarChart3,
  MessageSquare,
  CheckCircle2,
  Home,
  User,
  ShieldCheck,
} from 'lucide-react';
import { ActiveTab } from './Header';

export interface TabMeta {
  id: ActiveTab;
  label: string;
  shortLabel: string;
  stepNumber: number;
  description: string;
  nextSuggestionTitle: string;
  nextSuggestionDesc: string;
  icon: React.ElementType;
}

export const TAB_ORDER: TabMeta[] = [
  {
    id: 'landing',
    label: 'Overview & Architecture',
    shortLabel: 'Overview',
    stepNumber: 1,
    description: 'Core architectural dispatch pipeline and economic impact',
    nextSuggestionTitle: 'Test Single Queries in the Live Console',
    nextSuggestionDesc: 'Evaluate real-time complexity vectors and model latency with zero egress.',
    icon: Home,
  },
  {
    id: 'console',
    label: 'Live Router Console',
    shortLabel: 'Router Console',
    stepNumber: 2,
    description: '0–100 heuristic scoring, 24h latency sparklines, and live execution',
    nextSuggestionTitle: 'Split Compound Queries into Sub-Tasks',
    nextSuggestionDesc: 'Partition multi-intent prompts and dispatch concurrently across model tiers.',
    icon: Cpu,
  },
  {
    id: 'decomposer',
    label: 'Multi-Part Query Splitter',
    shortLabel: 'Multi-Part Splitter',
    stepNumber: 3,
    description: 'Parallel sub-task decomposition, concurrency graph, and synthesis engine',
    nextSuggestionTitle: 'Verify Pareto Parity in A/B Quality Arena',
    nextSuggestionDesc: 'Run head-to-head empirical evaluations on GSM8K and MMLU benchmarks.',
    icon: Layers,
  },
  {
    id: 'benchmarks',
    label: 'A/B Quality & Benchmark Arena',
    shortLabel: 'A/B Arena',
    stepNumber: 4,
    description: 'Empirical GSM8K/MMLU benchmarking and cost-accuracy Pareto frontier',
    nextSuggestionTitle: 'Calibrate Dynamic Sensitivity Thresholds',
    nextSuggestionDesc: 'Tune local edge caps and configure Ollama endpoints or PII filters.',
    icon: Zap,
  },
  {
    id: 'policy',
    label: 'Routing Policy & Threshold Controls',
    shortLabel: 'Policy Controls',
    stepNumber: 5,
    description: 'Fine-grained complexity cutoffs, local Ollama integration, and privacy filters',
    nextSuggestionTitle: 'Inspect Real-Time Savings & Audit Ledger',
    nextSuggestionDesc: 'Review cumulative cost reduction graphs, latency trends, and execution traces.',
    icon: Sliders,
  },
  {
    id: 'analytics',
    label: 'Transparency & Governance Ledger',
    shortLabel: 'Audit & Rules',
    stepNumber: 6,
    description: 'Live audit traces, per-request overrides, governance rules engine, and savings trajectories',
    nextSuggestionTitle: 'Consult the LPU Architecture Copilot',
    nextSuggestionDesc: 'Ask questions on prompt decomposition, complexity formulas, and FinOps rules.',
    icon: BarChart3,
  },
  {
    id: 'chat',
    label: 'Architecture Copilot & Assistant',
    shortLabel: 'Copilot Chat',
    stepNumber: 7,
    description: 'Interactive Groq LPU assistant for prompt engineering and routing design',
    nextSuggestionTitle: 'Review 20/20 Production Verification Checklist',
    nextSuggestionDesc: 'Audit HIPAA compliance, secret management, HTTPS, and Core Web Vitals.',
    icon: MessageSquare,
  },
  {
    id: 'features',
    label: '20/20 Production Features Center',
    shortLabel: '20 Features',
    stepNumber: 8,
    description: 'Full compliance matrix covering security, SEO, analytics, and speed tests',
    nextSuggestionTitle: 'Manage Account Credentials & API Keys',
    nextSuggestionDesc: 'Configure production API keys, organization budgets, and rate limits.',
    icon: CheckCircle2,
  },
  {
    id: 'login',
    label: 'Account & API Key Hub',
    shortLabel: 'Account Hub',
    stepNumber: 9,
    description: 'Enterprise credentials, monthly budget monitoring, and access tokens',
    nextSuggestionTitle: 'Return to Executive Architecture Overview',
    nextSuggestionDesc: 'Explore platform metrics, video caustics plate, and system topology.',
    icon: User,
  },
];

interface TopPanelBarProps {
  currentTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
}

export const TopPanelBar: React.FC<TopPanelBarProps> = ({ currentTab, onNavigate }) => {
  const currentIndex = TAB_ORDER.findIndex((t) => t.id === currentTab);
  const currentMeta = TAB_ORDER[currentIndex] || TAB_ORDER[0];
  const prevTab = currentIndex > 0 ? TAB_ORDER[currentIndex - 1] : null;
  const nextTab = currentIndex < TAB_ORDER.length - 1 ? TAB_ORDER[currentIndex + 1] : null;

  return (
    <div className="w-full bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 rounded-2xl px-3 sm:px-5 py-2.5 shadow-xs backdrop-blur-md flex items-center justify-between flex-wrap gap-2.5 transition-colors">
      {/* Breadcrumb & Step Info */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono min-w-0">
        <button
          onClick={() => onNavigate('landing')}
          className="text-[#59627E] dark:text-slate-400 hover:text-[#020C21] dark:hover:text-slate-100 flex items-center gap-1 cursor-pointer transition-colors shrink-0"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">NexusRoute</span>
        </button>
        <span className="text-[#CBD8E8] dark:text-slate-700 shrink-0">/</span>
        <span className="font-bold text-[#020C21] dark:text-slate-100 flex items-center gap-1.5 truncate">
          <currentMeta.icon className="w-3.5 h-3.5 text-[#0F1B31] dark:text-sky-400 shrink-0" />
          <span className="hidden sm:inline truncate">{currentMeta.label}</span>
          <span className="sm:hidden truncate">{currentMeta.shortLabel}</span>
        </span>
        <span className="hidden lg:inline text-[10px] px-2 py-0.5 rounded-full bg-[#E6EDF6] dark:bg-slate-800 text-[#0F182F] dark:text-slate-300 font-semibold shrink-0">
          Step {currentMeta.stepNumber}/{TAB_ORDER.length}
        </span>
      </div>

      {/* Quick Step Navigation Controls */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {prevTab && (
          <button
            onClick={() => onNavigate(prevTab.id)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#E6EDF6] dark:bg-slate-800 hover:bg-[#D4E2F2] dark:hover:bg-slate-700 text-[#020C21] dark:text-slate-200 text-xs font-[520] transition-colors cursor-pointer border border-[#CBD8E8] dark:border-slate-700"
            title={`Previous: ${prevTab.label}`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{prevTab.shortLabel}</span>
          </button>
        )}

        {nextTab && (
          <button
            onClick={() => onNavigate(nextTab.id)}
            className="flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#0F1B31] dark:bg-sky-500 hover:bg-[#1A2B45] dark:hover:bg-sky-400 text-white dark:text-slate-950 text-xs font-[520] transition-all cursor-pointer shadow-xs"
            title={`Next: ${nextTab.label}`}
          >
            <span>{nextTab.shortLabel}</span>
            <ChevronRight className="w-3.5 h-3.5 text-white dark:text-slate-950" />
          </button>
        )}
      </div>
    </div>
  );
};

interface BottomNextStepProps {
  currentTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
}

export const BottomNextStep: React.FC<BottomNextStepProps> = ({ currentTab, onNavigate }) => {
  const currentIndex = TAB_ORDER.findIndex((t) => t.id === currentTab);
  const nextTab = currentIndex < TAB_ORDER.length - 1 ? TAB_ORDER[currentIndex + 1] : TAB_ORDER[0];
  const NextIcon = nextTab.icon;

  return (
    <div className="w-full mt-8 p-4 sm:p-6 lg:p-7 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 shadow-xs backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
      <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#0F1B31] dark:bg-sky-500 text-white dark:text-slate-950 flex items-center justify-center shadow-xs shrink-0 mt-0.5 sm:mt-0">
          <NextIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white dark:text-slate-950" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <div className="text-[10px] sm:text-[11px] font-mono text-[#59627E] dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
            <span>Next Recommended Action</span>
            <span>·</span>
            <span className="font-semibold text-[#0F182F] dark:text-slate-200">Step {nextTab.stepNumber} of {TAB_ORDER.length}</span>
          </div>
          <h4 className="text-sm sm:text-base font-[520] text-[#020C21] dark:text-slate-100 truncate">
            {nextTab.nextSuggestionTitle}
          </h4>
          <p className="text-xs text-[#4D5B77] dark:text-slate-400 line-clamp-2 sm:line-clamp-none">
            {nextTab.nextSuggestionDesc}
          </p>
        </div>
      </div>

      <button
        onClick={() => onNavigate(nextTab.id)}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#0F1B31] dark:bg-sky-500 hover:bg-[#1A2B45] dark:hover:bg-sky-400 text-white dark:text-slate-950 text-xs font-[520] shadow-sm transition-all cursor-pointer group shrink-0"
      >
        <span>Proceed to {nextTab.shortLabel}</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
};
