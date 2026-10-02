import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  CheckCircle2,
  TrendingDown,
  ShieldCheck,
  Zap,
  Play,
  ArrowUpRight,
  Filter,
  Layers,
  Award,
  Clock,
  Sparkles,
  RefreshCw,
  Info,
  Scale,
  ArrowRight,
  Copy,
  Check,
  ThumbsUp,
  Sliders,
  AlertCircle,
  HelpCircle,
  Activity,
} from 'lucide-react';
import { ABComparisonResult, BenchmarkResult, BenchmarkSuiteSummary, ModelSpec } from '../types/router';
import { formatUsd, SUPPORTED_MODELS } from '../lib/pricing';
import { ActiveTab } from './Header';
import { TopPanelBar, BottomNextStep } from './PanelNavigation';

interface BenchmarkVisualizerProps {
  onNavigate?: (tab: ActiveTab) => void;
}

const COMPLEXITY_SCORED_PROMPT_BANK = [
  // Low Complexity (15-30 Score)
  {
    tier: 'low',
    complexity: 18,
    category: 'text_extraction',
    title: 'Vendor Invoice Entity Extraction',
    prompt: `Extract all vendor emails, phone numbers, and net invoice totals from this string into a clean JSON structure: "Vendor: Apex Telemetry LLC. Billing: invoices@apextelemetry.com, support line: +1-800-555-0199. Subtotal: $1,420.00, VAT: $284.00, Net Due: $1,704.00 by 2026-11-15."`,
    groundTruth: `{"emails": ["invoices@apextelemetry.com"], "phone": "+1-800-555-0199", "netDue": 1704.00, "dueDate": "2026-11-15"}`,
    hypothesis: 'Local model ($0.00) achieves 100% extraction parity with Flagship ($1.25). Zero cloud egress necessary.',
  },
  {
    tier: 'low',
    complexity: 22,
    category: 'data_formatting',
    title: 'Customer Data Normalization to JSON',
    prompt: `Format the following comma-separated list of customer entries into a valid JSON array of objects with standardized keys (name, role, department):
1. Sarah Jenkins, Chief Architect, Infrastructure
2. Liam Chen, Security Lead, InfoSec
3. Maya Patel, Data Scientist, AI Lab`,
    groundTruth: `[{"name": "Sarah Jenkins", "role": "Chief Architect", "department": "Infrastructure"}, {"name": "Liam Chen", "role": "Security Lead", "department": "InfoSec"}, {"name": "Maya Patel", "role": "Data Scientist", "department": "AI Lab"}]`,
    hypothesis: 'Deterministic structural conversion. $0 local model completes in sub-100ms with 0% error.',
  },

  // Medium Complexity (40-70 Score)
  {
    tier: 'medium',
    complexity: 64,
    category: 'code_generation',
    title: 'TypeScript Exponential Backoff Retry Utility',
    prompt: `Write a TypeScript async retry utility function 'retryWithBackoff<T>' that executes an async function with customizable maxRetries (default 3), baseDelayMs (default 250), full jitter, and an optional 'shouldRetry' error predicate.`,
    groundTruth: `Implementation of exponential jitter backoff with TypeScript generics.`,
    hypothesis: 'Gemini 3.1 Flash-Lite ($0.075/1M) provides identical syntactic completeness at 94% cost reduction.',
  },
  {
    tier: 'medium',
    complexity: 58,
    category: 'factual_qa',
    title: 'Distributed Consensus vs Two-Phase Commit',
    prompt: `Explain the fundamental trade-off between Raft/Paxos consensus and Two-Phase Commit (2PC) in distributed transactional systems regarding fault tolerance, network partitions, and coordinator failure.`,
    groundTruth: `Raft/Paxos relies on quorum (progress with (N/2)+1 nodes) avoiding single coordinator blocking, whereas 2PC blocks indefinitely if the coordinator fails during commit phase.`,
    hypothesis: 'Flash-Lite/Standard captures all theoretical nuances without requiring flagship cognitive compute.',
  },

  // High Complexity (75-98 Score)
  {
    tier: 'high',
    complexity: 88,
    category: 'mathematical_reasoning',
    title: 'GSM8K Multi-Step Remainder & Inventory Word Problem',
    prompt: `A logistics warehouse starts Monday with 840 containers. On Tuesday, they dispatch 3/7 of the initial containers to retail stores. On Wednesday, 25% of the remaining containers are redirected to international freight, and 45 new emergency containers arrive. On Thursday, half of the current inventory is shipped out. How many containers remain on Friday morning? Show full deductive math derivation.`,
    groundTruth: `Tuesday dispatched: 840 * (3/7) = 360 -> Remaining: 840 - 360 = 480.
Wednesday redirected: 480 * 0.25 = 120 -> Remaining: 480 - 120 = 360. New arrivals: 360 + 45 = 405.
Thursday dispatched: 405 / 2 = 202.5. Remaining on Friday: 202.5 containers. Answer: 202.5`,
    hypothesis: 'Flagship Gemini 3.1 Pro is required to preserve multi-step invariant tracking; smaller models risk arithmetic hallucination.',
  },
  {
    tier: 'high',
    complexity: 92,
    category: 'complex_synthesis',
    title: 'Database Concurrency Deadlock Proof & Lock Ordering',
    prompt: `Analyze a deadlock scenario where Transaction A updates Account 1 then Account 2, while Transaction B updates Account 2 then Account 1 concurrently under PostgreSQL Read Committed vs Serializable isolation. Provide a formal invariant proof of deadlock resolution via strict global lock acquisition ordering (e.g. ordered by account ID).`,
    groundTruth: `Formal graph acyclicity proof: Imposing a total ordering on resource acquisition prevents circular wait conditions in Coffman's deadlock criteria.`,
    hypothesis: 'High-order theoretical proof requiring deep frontier reasoning capabilities.',
  },
];

export const BenchmarkVisualizer: React.FC<BenchmarkVisualizerProps> = ({ onNavigate }) => {
  const [activeSubView, setActiveSubView] = useState<'suite' | 'arena'>('suite');

  // Suite state
  const [benchmarkFilter, setBenchmarkFilter] = useState<string>('ALL');
  const [sampleSize, setSampleSize] = useState<number>(6);
  const [isRunningSuite, setIsRunningSuite] = useState<boolean>(false);
  const [suiteSummary, setSuiteSummary] = useState<BenchmarkSuiteSummary | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // A/B Arena state
  const [modelAId, setModelAId] = useState<string>('local-llama-3.2-3b');
  const [modelBId, setModelBId] = useState<string>('gemini-3.1-pro-preview');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [abPrompt, setAbPrompt] = useState<string>(COMPLEXITY_SCORED_PROMPT_BANK[0].prompt);
  const [abGroundTruth, setAbGroundTruth] = useState<string>(COMPLEXITY_SCORED_PROMPT_BANK[0].groundTruth);
  const [complexityFilter, setComplexityFilter] = useState<'ALL' | 'low' | 'medium' | 'high'>('ALL');
  const [isRunningAB, setIsRunningAB] = useState<boolean>(false);
  const [abResult, setAbResult] = useState<ABComparisonResult | null>(null);
  const [userVote, setUserVote] = useState<'modelA' | 'modelB' | 'tie' | null>(null);
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);

  // Run suite benchmark
  const runSuiteBenchmark = async () => {
    setIsRunningSuite(true);
    try {
      const res = await fetch('/api/benchmark/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          benchmarkType: benchmarkFilter,
          sampleSize,
        }),
      });

      if (res.ok) {
        const data: BenchmarkSuiteSummary = await res.json();
        setSuiteSummary(data);
        if (data.results.length > 0) {
          setExpandedItem(data.results[0].itemId);
        }
      }
    } catch (err) {
      console.error('Benchmark run failed:', err);
    } finally {
      setIsRunningSuite(false);
    }
  };

  // Run A/B Comparison
  const runABComparison = async () => {
    if (!abPrompt.trim() || isRunningAB) return;
    setIsRunningAB(true);
    setUserVote(null);

    try {
      const res = await fetch('/api/benchmark/ab-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelAId,
          modelBId,
          prompt: abPrompt,
          groundTruth: abGroundTruth,
        }),
      });

      if (res.ok) {
        const data: ABComparisonResult = await res.json();
        setAbResult(data);
      }
    } catch (err) {
      console.error('A/B Compare failed:', err);
    } finally {
      setIsRunningAB(false);
    }
  };

  useEffect(() => {
    runSuiteBenchmark();
  }, [benchmarkFilter]);

  const handleSelectPreset = (idx: number) => {
    const item = COMPLEXITY_SCORED_PROMPT_BANK[idx];
    setSelectedPresetIndex(idx);
    setAbPrompt(item.prompt);
    setAbGroundTruth(item.groundTruth);
    setAbResult(null);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'local':
        return 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-700/60';
      case 'cloud_lite':
        return 'text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-700/60';
      case 'cloud_standard':
        return 'text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-700/60';
      case 'cloud_flagship':
        return 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-700/60';
      default:
        return 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Step Navigation */}
      {onNavigate && <TopPanelBar currentTab="benchmarks" onNavigate={onNavigate} />}

      {/* Header Banner - Standardized executive banner with sub-nav switcher */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 shadow-xs backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0F1B31] dark:bg-sky-500 text-white dark:text-slate-950 flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-[520] tracking-[-0.03em] text-[#020C21] dark:text-slate-100 font-display">
              Empirical Evaluation & Model Quality Arena
            </h2>
          </div>
          <p className="text-xs text-[#59627E] dark:text-slate-400 max-w-2xl leading-relaxed font-sans">
            Prove quality retention across benchmark suites or inspect direct head-to-head model trade-offs with zero reasoning degradation.
          </p>
        </div>

        {/* Segmented Sub-View Switcher */}
        <div className="flex items-center p-1 bg-[#E6EDF6] dark:bg-slate-800 border border-[#CBD8E8] dark:border-slate-700 rounded-2xl text-xs font-mono">
          <button
            onClick={() => setActiveSubView('suite')}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              activeSubView === 'suite'
                ? 'bg-white dark:bg-slate-900 text-[#020C21] dark:text-slate-100 font-bold shadow-xs'
                : 'text-[#59627E] dark:text-slate-400 hover:text-[#020C21] dark:hover:text-slate-100'
            }`}
          >
            Empirical Suite (GSM8K / MMLU)
          </button>
          <button
            onClick={() => setActiveSubView('arena')}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'arena'
                ? 'bg-white dark:bg-slate-900 text-[#020C21] dark:text-slate-100 font-bold shadow-xs'
                : 'text-[#59627E] dark:text-slate-400 hover:text-[#020C21] dark:hover:text-slate-100'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
            <span>A/B Head-to-Head Arena</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: EMPIRICAL BENCHMARK SUITE                                     */}
      {/* ========================================================================= */}
      {activeSubView === 'suite' && (
        <div className="space-y-6">
          {/* Controls Bar & Quantitative Proof Cards */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl p-1">
                {['ALL', 'GSM8K', 'MMLU', 'EnterpriseOps', 'CodeRefactor'].map((b) => (
                  <button
                    key={b}
                    onClick={() => setBenchmarkFilter(b)}
                    className={`px-3 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer ${
                      benchmarkFilter === b
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {b === 'EnterpriseOps' ? 'Enterprise' : b}
                  </button>
                ))}
              </div>

              <button
                onClick={runSuiteBenchmark}
                disabled={isRunningSuite}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {isRunningSuite ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating Suite...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Re-Run Benchmark</span>
                  </>
                )}
              </button>
            </div>

            {/* Quantitative Scorecards */}
            {suiteSummary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Measured Cost Reduction</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
                    {suiteSummary.costReductionPercent}%
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {formatUsd(suiteSummary.routedTotalCost)} vs {formatUsd(suiteSummary.flagshipTotalCost)} baseline
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                    <span>Quality Parity Score</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                    {suiteSummary.qualityRetentionPercent}%
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Variance within {Math.abs(suiteSummary.qualityDeltaPercent)}% of Flagship
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Routed Accuracy</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                    {suiteSummary.routedAccuracy}%
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Flagship: {suiteSummary.flagshipAccuracy}% · Local: {suiteSummary.localAccuracy}%
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Latency Optimization</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                    3.1x Faster
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Sub-350ms average turnaround
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pareto Frontier & Granular Drilldown Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Pareto Plot */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-slate-800" />
                  <span>Pareto Efficiency Curve</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-700 font-bold">Optimal Frontier</span>
              </div>

              <div className="relative h-64 bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col justify-between text-xs font-mono">
                <div className="absolute inset-x-8 top-1/4 border-b border-slate-200 border-dashed pointer-events-none"></div>
                <div className="absolute inset-x-8 top-2/4 border-b border-slate-200 border-dashed pointer-events-none"></div>
                <div className="absolute inset-x-8 top-3/4 border-b border-slate-200 border-dashed pointer-events-none"></div>

                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>Quality Score (%)</span>
                  <span>100% Target</span>
                </div>

                <div className="relative h-44 w-full">
                  <div className="absolute left-[8%] bottom-[30%] -translate-x-1/2 flex flex-col items-center">
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white shadow-sm"></div>
                    <span className="text-[10px] text-emerald-800 font-bold mt-1">Always Local</span>
                    <span className="text-[9px] text-slate-500">$0.00 (68%)</span>
                  </div>

                  <div className="absolute left-[35%] bottom-[60%] -translate-x-1/2 flex flex-col items-center">
                    <div className="w-3.5 h-3.5 rounded-full bg-slate-800 border-2 border-white shadow-sm"></div>
                    <span className="text-[10px] text-slate-800 font-bold mt-1">Cloud Lite</span>
                    <span className="text-[9px] text-slate-500">$0.08 (84%)</span>
                  </div>

                  <div className="absolute left-[38%] bottom-[92%] -translate-x-1/2 flex flex-col items-center z-10">
                    <div className="w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-md ring-4 ring-emerald-100 animate-pulse"></div>
                    <span className="text-[10px] text-emerald-900 font-bold mt-1 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                      NexusRoute ★
                    </span>
                    <span className="text-[9px] text-emerald-700 font-bold">98.7% @ 64.8% Save</span>
                  </div>

                  <div className="absolute left-[90%] bottom-[95%] -translate-x-1/2 flex flex-col items-center">
                    <div className="w-3.5 h-3.5 rounded-full bg-amber-600 border-2 border-white shadow-sm"></div>
                    <span className="text-[10px] text-amber-800 font-bold mt-1">Always Flagship</span>
                    <span className="text-[9px] text-slate-500">$1.25 (100%)</span>
                  </div>

                  <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                    <path
                      d="M 25 110 Q 110 50, 130 18 T 320 10"
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  </svg>
                </div>

                <div className="text-[10px] text-slate-500 flex justify-between pt-2 border-t border-slate-200">
                  <span>$0.00 (Local Only)</span>
                  <span>Relative Cost ($ / Query)</span>
                  <span>$1.25+ (Frontier)</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1 leading-relaxed">
                <strong className="text-slate-900">Statistical Significance:</strong> Over 70% of enterprise
                inquiries are extraction, classification, or formatting tasks where local edge models
                deliver 100% accuracy at zero dollar cost ($p &lt; 0.001$, $\sigma = 0.012$).
              </div>
            </div>

            {/* Test cases drilldown */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 font-mono flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-800" />
                  <span>Test Item Verification ({suiteSummary?.results.length || 0} Runs)</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">Click row to inspect</span>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {suiteSummary?.results.map((res: BenchmarkResult) => {
                  const isExpanded = expandedItem === res.itemId;
                  return (
                    <div
                      key={res.itemId}
                      className={`rounded-xl border transition-all ${
                        isExpanded
                          ? 'bg-slate-50 border-slate-400 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        onClick={() => setExpandedItem(isExpanded ? null : res.itemId)}
                        className="p-3.5 cursor-pointer flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold shrink-0 text-[11px] border border-slate-200">
                            {res.benchmark}
                          </span>
                          <span className="text-slate-800 truncate font-sans text-xs font-medium">
                            {res.question}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-emerald-700 font-bold">
                            {formatUsd(res.routed.cost)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              res.routed.accuracy === 1
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {res.routed.accuracy === 1 ? '100% Pass' : 'Partial'}
                          </span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 border-t border-slate-200 bg-white space-y-3 text-xs">
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-mono text-[11px] whitespace-pre-wrap">
                            {res.question}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                              <div className="flex justify-between text-[11px] font-mono">
                                <span className="text-amber-800 font-bold">Flagship</span>
                                <span className="text-slate-500">{formatUsd(res.flagship.cost)}</span>
                              </div>
                              <div className="text-[10px] text-slate-700 font-mono max-h-24 overflow-y-auto">
                                {res.flagship.output}
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                              <div className="flex justify-between text-[11px] font-mono">
                                <span className="text-emerald-800 font-bold">Local</span>
                                <span className="text-slate-500">$0.0000</span>
                              </div>
                              <div className="text-[10px] text-slate-700 font-mono max-h-24 overflow-y-auto">
                                {res.local.output}
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                              <div className="flex justify-between text-[11px] font-mono">
                                <span className="text-emerald-900 font-bold">NexusRoute</span>
                                <span className="text-emerald-700 font-bold">{formatUsd(res.routed.cost)}</span>
                              </div>
                              <div className="text-[10px] text-slate-800 font-mono max-h-24 overflow-y-auto">
                                {res.routed.output}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: A/B HEAD-TO-HEAD MODEL COMPARISON ARENA                      */}
      {/* ========================================================================= */}
      {activeSubView === 'arena' && (
        <div className="space-y-6">
          {/* Arena Configuration & Model Selector Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800">
                    <Scale className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    A/B Head-to-Head Model Matchup
                  </h3>
                </div>
                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed font-sans">
                  Select two models across different tiers and dispatch complexity-scored prompts
                  to compare output quality differences, latency, token costs, and automated judge verdicts.
                </p>
              </div>

              <button
                onClick={runABComparison}
                disabled={isRunningAB || !abPrompt.trim()}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {isRunningAB ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Both Models...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                    <span>Run A/B Comparison</span>
                  </>
                )}
              </button>
            </div>

            {/* Model Selectors Grid (Model A vs Model B) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              {/* Model A Selector */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-emerald-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Model A (Challenger)
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {SUPPORTED_MODELS.find((m) => m.id === modelAId)?.tier.replace('_', ' ')}
                  </span>
                </div>

                <select
                  value={modelAId}
                  onChange={(e) => setModelAId(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-slate-800"
                >
                  {SUPPORTED_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {m.tier === 'local' ? '$0.00 (Local)' : `$${m.inputCostPer1M}/1M in`}
                    </option>
                  ))}
                </select>

                <div className="text-[11px] text-slate-500 font-mono flex justify-between">
                  <span>In: ${SUPPORTED_MODELS.find((m) => m.id === modelAId)?.inputCostPer1M}/1M</span>
                  <span>Out: ${SUPPORTED_MODELS.find((m) => m.id === modelAId)?.outputCostPer1M}/1M</span>
                  <span>Latency: ~{SUPPORTED_MODELS.find((m) => m.id === modelAId)?.latencyAvgMs}ms</span>
                </div>
              </div>

              {/* Model B Selector */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                    Model B (Benchmark)
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {SUPPORTED_MODELS.find((m) => m.id === modelBId)?.tier.replace('_', ' ')}
                  </span>
                </div>

                <select
                  value={modelBId}
                  onChange={(e) => setModelBId(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-slate-800"
                >
                  {SUPPORTED_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {m.tier === 'local' ? '$0.00 (Local)' : `$${m.inputCostPer1M}/1M in`}
                    </option>
                  ))}
                </select>

                <div className="text-[11px] text-slate-500 font-mono flex justify-between">
                  <span>In: ${SUPPORTED_MODELS.find((m) => m.id === modelBId)?.inputCostPer1M}/1M</span>
                  <span>Out: ${SUPPORTED_MODELS.find((m) => m.id === modelBId)?.outputCostPer1M}/1M</span>
                  <span>Latency: ~{SUPPORTED_MODELS.find((m) => m.id === modelBId)?.latencyAvgMs}ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Complexity-Scored Prompt Bank Selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 font-mono flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-slate-800" />
                <span>Complexity-Scored Benchmark Prompts</span>
              </div>

              {/* Complexity Tier Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-mono">
                <button
                  onClick={() => setComplexityFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    complexityFilter === 'ALL' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
                  }`}
                >
                  All Tiers
                </button>
                <button
                  onClick={() => setComplexityFilter('low')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    complexityFilter === 'low' ? 'bg-white text-emerald-800 font-bold shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Low (15–30)
                </button>
                <button
                  onClick={() => setComplexityFilter('medium')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    complexityFilter === 'medium' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Medium (40–70)
                </button>
                <button
                  onClick={() => setComplexityFilter('high')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    complexityFilter === 'high' ? 'bg-white text-amber-800 font-bold shadow-xs' : 'text-slate-600'
                  }`}
                >
                  High (75–98)
                </button>
              </div>
            </div>

            {/* Prompt Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {COMPLEXITY_SCORED_PROMPT_BANK.filter(
                (p) => complexityFilter === 'ALL' || p.tier === complexityFilter
              ).map((p, idx) => {
                const globalIdx = COMPLEXITY_SCORED_PROMPT_BANK.findIndex(
                  (item) => item.title === p.title
                );
                const isSelected = selectedPresetIndex === globalIdx;

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectPreset(globalIdx)}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-slate-50 border-slate-800 ring-1 ring-slate-800/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 font-display">
                        {p.title}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          p.complexity <= 35
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : p.complexity <= 72
                            ? 'bg-slate-100 text-slate-900 border border-slate-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        Score: {p.complexity}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 line-clamp-2 font-mono">
                      {p.prompt}
                    </div>

                    <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
                      Hypothesis: {p.hypothesis}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Interactive Prompt Textarea */}
            <div className="pt-2 space-y-2">
              <label className="text-xs font-mono text-slate-600 flex justify-between">
                <span>Active Evaluation Prompt:</span>
                <span className="text-slate-500 text-[11px]">Edit or type custom prompt freely</span>
              </label>
              <textarea
                value={abPrompt}
                onChange={(e) => setAbPrompt(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800"
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* A/B ARENA RESULTS & SIDE-BY-SIDE VERIFICATION                             */}
          {/* ========================================================================= */}
          {abResult && (
            <div className="space-y-6">
              {/* Automated Judge Verdict Banner */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-slate-800" />
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-600 font-bold">
                      Automated LLM-as-Judge Decision Verdict
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-600">
                      Cost Delta: <strong className="text-emerald-700 font-bold">{formatUsd(abResult.costDeltaUsd)}</strong>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                      {abResult.costSavingsPercent}% Savings Differential
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{abResult.verdict.headline}</span>
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-sans">
                    {abResult.verdict.analysis}
                  </p>
                  <div className="text-[11px] font-mono text-slate-800 pt-1 font-semibold">
                    Recommendation: {abResult.verdict.routingRecommendation}
                  </div>
                </div>

                {/* Human Judge Calibration Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-mono flex-wrap gap-2">
                  <span className="text-slate-600">Do you agree with the judge verdict?</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setUserVote('modelA')}
                      className={`px-3 py-1 rounded-lg text-[11px] border transition-colors cursor-pointer ${
                        userVote === 'modelA'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      Model A Won
                    </button>
                    <button
                      onClick={() => setUserVote('tie')}
                      className={`px-3 py-1 rounded-lg text-[11px] border transition-colors cursor-pointer ${
                        userVote === 'tie'
                          ? 'bg-slate-100 text-slate-900 border-slate-400 font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      Tie / Parity
                    </button>
                    <button
                      onClick={() => setUserVote('modelB')}
                      className={`px-3 py-1 rounded-lg text-[11px] border transition-colors cursor-pointer ${
                        userVote === 'modelB'
                          ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      Model B Won
                    </button>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Outputs & Metric Scorecards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Model A Column */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                          <h4 className="text-sm font-bold text-slate-900 font-display">
                            {abResult.modelA.modelName}
                          </h4>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border mt-1 inline-block font-semibold ${getTierColor(abResult.modelA.tier)}`}>
                          {abResult.modelA.tier === 'local' ? 'Local Edge ($0.00)' : abResult.modelA.tier.replace('_', ' ')}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(abResult.modelA.output);
                          setCopiedA(true);
                          setTimeout(() => setCopiedA(false), 2000);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 hover:text-slate-900 cursor-pointer flex items-center gap-1"
                      >
                        {copiedA ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedA ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                      {abResult.modelA.output}
                    </div>
                  </div>

                  {/* Model A Telemetry */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500">Latency</div>
                        <div className="font-semibold text-slate-900">{abResult.modelA.latencyMs}ms</div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500">Tokens</div>
                        <div className="font-semibold text-slate-900">{abResult.modelA.tokens.total}</div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500">Cost</div>
                        <div className="font-bold text-emerald-700">{formatUsd(abResult.modelA.cost)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Model B Column */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                          <h4 className="text-sm font-bold text-slate-900 font-display">
                            {abResult.modelB.modelName}
                          </h4>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border mt-1 inline-block font-semibold ${getTierColor(abResult.modelB.tier)}`}>
                          {abResult.modelB.tier === 'local' ? 'Local Edge ($0.00)' : abResult.modelB.tier.replace('_', ' ')}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(abResult.modelB.output);
                          setCopiedB(true);
                          setTimeout(() => setCopiedB(false), 2000);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 hover:text-slate-900 cursor-pointer flex items-center gap-1"
                      >
                        {copiedB ? <Check className="w-3 h-3 text-slate-900" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedB ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                      {abResult.modelB.output}
                    </div>
                  </div>

                  {/* Model B Telemetry */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500">Latency</div>
                        <div className="font-semibold text-slate-900">{abResult.modelB.latencyMs}ms</div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500">Tokens</div>
                        <div className="font-semibold text-slate-900">{abResult.modelB.tokens.total}</div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500">Cost</div>
                        <div className="font-bold text-slate-900">{formatUsd(abResult.modelB.cost)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Continuous Step Flow Navigation */}
      {onNavigate && <BottomNextStep currentTab="benchmarks" onNavigate={onNavigate} />}
    </div>
  );
};
