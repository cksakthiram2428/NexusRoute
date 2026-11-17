import React, { useState } from 'react';
import { authHeaders } from '../lib/authHeader';
import {
  Split,
  Layers,
  ArrowRight,
  TrendingDown,
  Clock,
  Coins,
  Cpu,
  CheckCircle2,
  GitMerge,
  Sparkles,
  ArrowDown,
  Shield,
  Zap,
  GitBranch,
} from 'lucide-react';
import { ModelSpec, RoutingPolicyConfig, SubTask } from '../types/router';
import { decomposePrompt } from '../lib/classifier';
import { formatUsd } from '../lib/pricing';
import { ActiveTab } from './Header';
import { TopPanelBar, BottomNextStep } from './PanelNavigation';

interface MultiPartDecomposerProps {
  models: ModelSpec[];
  policy: RoutingPolicyConfig;
  onNavigate?: (tab: ActiveTab) => void;
}

const MULTI_PART_PRESETS = [
  {
    name: 'Enterprise Workflow (Data Extraction + SQL Schema + Strategic Forecast)',
    prompt: `1. Extract all client accounts, contact emails, and contract values from this text: "Acme Holdings (contact: dev@acme.org, value: $140,000), Beta Corp (contact: ops@betacorp.io, value: $85,500), and Gamma Ltd (contact: legal@gamma.com, value: $210,000)."
2. Generate an optimized PostgreSQL schema with JSONB columns, foreign keys, and indexes for storing high-frequency contract revisions.
3. Provide an executive macro-economic risk analysis on how multi-currency contract volatility affects EBITDA over a 3-year inflation cycle.`,
  },
  {
    name: 'Cybersecurity Incident (Log Extraction + Bash Script + Legal Risk Memo)',
    prompt: `1. Extract all foreign IP addresses and failed port 22 access attempts from this firewall log: "2026-10-02 04:12:01 IP 198.51.100.43:22 FAIL auth, 2026-10-02 04:12:05 IP 203.0.113.19:22 FAIL auth, 2026-10-02 04:13:00 IP 198.51.100.43:22 FAIL auth."
2. Write a production-grade Bash iptables rate-limiting script that automatically drops IPs exceeding 5 failed SSH connections in 60 seconds.
3. Formulate a formal ISO 27001 / GDPR data breach notification assessment evaluating mandatory reporting timelines.`,
  },
];

export const MultiPartDecomposer: React.FC<MultiPartDecomposerProps> = ({
  models,
  policy,
  onNavigate,
}) => {
  const [prompt, setPrompt] = useState(MULTI_PART_PRESETS[0].prompt);
  const [subTasks, setSubTasks] = useState<SubTask[]>(() =>
    decomposePrompt(MULTI_PART_PRESETS[0].prompt, policy)
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [executionResult, setExecutionResult] = useState<any | null>(null);

  const handleDecompose = (customPrompt?: string) => {
    const text = customPrompt || prompt;
    const tasks = decomposePrompt(text, policy);
    setSubTasks(tasks);
    setExecutionResult(null);
  };

  const handleRunPipeline = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/route/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ prompt, policyOverride: policy }),
      });
      if (res.ok) {
        const trace = await res.json();
        setExecutionResult(trace);
      }
    } catch (err) {
      console.error('Multi-part execution failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalDecomposedCost = subTasks.reduce((acc, t) => acc + t.estimatedCost, 0);
  const totalFlagshipCost = subTasks.reduce((acc, t) => acc + t.flagshipCost, 0);
  const overallSavingsPercent =
    totalFlagshipCost > 0
      ? Math.round(((totalFlagshipCost - totalDecomposedCost) / totalFlagshipCost) * 100)
      : 0;

  const getTierBadge = (tier: string) => {
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
      {onNavigate && <TopPanelBar currentTab="decomposer" onNavigate={onNavigate} />}

      {/* Header Banner - Standardized executive banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 shadow-xs backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0F1B31] dark:bg-sky-500 text-white dark:text-slate-950 flex items-center justify-center shadow-xs">
              <Split className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-[520] tracking-[-0.03em] text-[#020C21] dark:text-slate-100 font-display">
              Multi-Part Request Decomposition & Synthesis
            </h2>
          </div>
          <p className="text-xs text-[#59627E] dark:text-slate-400 max-w-2xl leading-relaxed font-sans">
            Splits multi-part compound queries into discrete sub-tasks, dispatches each to the
            cheapest capable model tier (Local Edge for extraction, Gemini Flash for code, Gemini
            Pro for deep reasoning), and seamlessly merges the result.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunPipeline}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-full bg-[#0F1B31] dark:bg-sky-500 hover:bg-[#1A2B45] dark:hover:bg-sky-400 text-white dark:text-slate-950 font-[520] text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Dispatching Sub-Tasks...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-emerald-400 dark:text-slate-950 fill-current" />
                <span>Execute Split & Merge Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3D DAG Pipeline Topology Visualizer Figure */}
      <div className="p-5 bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-[#CBD8E8] dark:border-slate-800 space-y-4 shadow-xs backdrop-blur-xl transition-colors">
        <div className="flex items-center justify-between text-xs font-mono text-[#59627E] dark:text-slate-400 flex-wrap gap-2">
          <span className="flex items-center gap-1.5 font-bold">
            <GitBranch className="w-3.5 h-3.5 text-[#0F1B31] dark:text-sky-400 shrink-0" />
            <span>3D Directed Acyclic Graph (DAG) Parallel Split Architecture</span>
          </span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold shrink-0">
            Composite Net Reduction: ~{overallSavingsPercent}%
          </span>
        </div>

        <div className="relative min-h-[130px] sm:h-28 bg-[#E6EDF6]/30 dark:bg-slate-950/60 rounded-2xl border border-[#CBD8E8] dark:border-slate-700/60 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:12px_12px]"></div>

          {/* Ingestion Node */}
          <div className="relative z-10 p-2 rounded-xl bg-[#0F1B31] dark:bg-sky-500 text-white dark:text-slate-950 text-center text-xs font-mono shadow-xs shrink-0 w-full sm:w-auto">
            <div className="text-[10px] text-slate-300 dark:text-slate-900">Incoming</div>
            <div className="font-bold">Prompt</div>
          </div>

          {/* Fork lines */}
          <div className="relative z-10 flex-1 px-1 sm:px-3 flex flex-col justify-between h-full py-1 w-full space-y-1.5 sm:space-y-0">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono border-b border-dashed border-[#CBD8E8] dark:border-slate-800 pb-1 gap-2">
              <span className="text-[#59627E] dark:text-slate-400 truncate">Part 1 (Deterministic Parse)</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold shrink-0">→ Edge Llama 3.2 ($0.00)</span>
            </div>
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono border-b border-dashed border-[#CBD8E8] dark:border-slate-800 pb-1 gap-2">
              <span className="text-[#59627E] dark:text-slate-400 truncate">Part 2 (Code / Schema)</span>
              <span className="text-[#020C21] dark:text-sky-300 font-bold shrink-0">→ Flash-Lite ($0.075)</span>
            </div>
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono gap-2">
              <span className="text-[#59627E] dark:text-slate-400 truncate">Part 3 (Deductive Reason)</span>
              <span className="text-amber-800 dark:text-amber-400 font-bold shrink-0">→ Pro Flagship ($1.25)</span>
            </div>
          </div>

          {/* Merge Synthesis Node */}
          <div className="relative z-10 p-2 rounded-xl bg-emerald-600 text-white text-center text-xs font-mono shadow-xs shrink-0 w-full sm:w-auto">
            <div className="text-[10px] text-emerald-100">Synthesized</div>
            <div className="font-bold">Output</div>
          </div>
        </div>

        {/* Presets */}
        <div className="pt-2 border-t border-[#E6EDF6] dark:border-slate-800 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[#59627E] dark:text-slate-400 font-mono">Select Scenario:</span>
          {MULTI_PART_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(preset.prompt);
                handleDecompose(preset.prompt);
              }}
              className="px-3.5 py-1.5 rounded-full bg-[#E6EDF6] dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-[#CBD8E8] dark:border-slate-700 text-[#020C21] dark:text-slate-200 transition-colors font-medium text-xs cursor-pointer shadow-xs"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Composite Input Box */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 rounded-3xl p-6 space-y-3 shadow-xs backdrop-blur-xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#59627E] dark:text-slate-400 font-mono">
            Composite Multi-Part Prompt
          </label>
          <button
            onClick={() => handleDecompose()}
            className="text-xs text-[#0F1B31] dark:text-sky-400 hover:underline font-mono font-semibold transition-colors cursor-pointer"
          >
            Re-Decompose Parts →
          </button>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            handleDecompose(e.target.value);
          }}
          rows={5}
          className="w-full bg-[#E6EDF6]/40 dark:bg-slate-950/60 border border-[#CBD8E8] dark:border-slate-700 rounded-2xl p-4 text-xs text-[#020C21] dark:text-slate-100 placeholder-[#59627E] dark:placeholder-slate-400 font-mono leading-relaxed focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:border-[#0F1B31] dark:focus:border-sky-500"
        />
      </div>

      {/* Visual Pipeline Decomposition Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#59627E] dark:text-slate-400 font-mono flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#0F1B31] dark:text-sky-400" />
            <span>Sub-Task Routing Matrix ({subTasks.length} Dispatched Nodes)</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
            <div className="text-[#59627E] dark:text-slate-400">
              Single-Model Flagship Cost: <span className="line-through">{formatUsd(totalFlagshipCost)}</span>
            </div>
            <div className="text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-700/60">
              Decomposed Cost: {formatUsd(totalDecomposedCost)} ({overallSavingsPercent}% Saved)
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subTasks.map((task, idx) => (
            <div
              key={task.id}
              className="bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-3 relative overflow-hidden shadow-xs backdrop-blur-xl"
            >
              {/* Node Step Marker */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-[#020C21] dark:text-slate-100">
                  Node 0{idx + 1}
                </span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-md font-semibold border ${getTierBadge(
                    task.recommendedModelTier
                  )}`}
                >
                  {task.recommendedModelTier === 'local' ? 'Local Edge ($0)' : task.recommendedModelTier.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-[#020C21] dark:text-slate-100 font-display">
                  {task.title}
                </h4>
                <div className="p-2.5 rounded-lg bg-[#E6EDF6]/40 dark:bg-slate-950/60 text-[#020C21] dark:text-slate-200 font-mono text-[11px] leading-relaxed max-h-24 overflow-y-auto border border-[#CBD8E8] dark:border-slate-800">
                  {task.prompt}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#E6EDF6] dark:border-slate-800 text-xs">
                <div className="flex justify-between items-center text-[#59627E] dark:text-slate-400 font-mono text-[11px] gap-2">
                  <span className="shrink-0">Target Model:</span>
                  <span className="text-[#020C21] dark:text-slate-100 font-bold truncate">{task.recommendedModelId}</span>
                </div>

                <div className="flex justify-between items-center text-[#59627E] dark:text-slate-400 font-mono text-[11px] gap-2">
                  <span className="shrink-0">Complexity:</span>
                  <span className="text-[#020C21] dark:text-slate-100 font-bold shrink-0">{task.complexityScore} / 100</span>
                </div>

                <div className="flex justify-between items-center pt-1 text-[11px] font-mono gap-2 flex-wrap">
                  <span className="text-[#59627E] dark:text-slate-400 shrink-0">Savings:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    {task.estimatedSavingsPercent}% ($0 vs {formatUsd(task.flagshipCost)})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Merged Synthesis Output Box */}
      {executionResult && (
        <div className="bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6EDF6] dark:border-slate-800 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-[#020C21] dark:text-slate-100 font-display">
                Merged & Synthesized Multi-Model Output
              </h3>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-[#59627E] dark:text-slate-400 flex-wrap">
              <span>Total Latency: <strong className="text-[#020C21] dark:text-slate-100">{executionResult.totalLatencyMs}ms</strong></span>
              <span>Total Cost: <strong className="text-emerald-700 dark:text-emerald-400">{formatUsd(executionResult.totalCost)}</strong></span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                {executionResult.costReductionPercent}% Net Savings
              </span>
            </div>
          </div>

          <div className="bg-[#E6EDF6]/40 dark:bg-slate-950/60 p-4 rounded-2xl border border-[#CBD8E8] dark:border-slate-800 font-mono text-xs text-[#020C21] dark:text-slate-100 leading-relaxed whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
            {executionResult.finalOutput}
          </div>
        </div>
      )}

      {/* Bottom Continuous Step Flow Navigation */}
      {onNavigate && <BottomNextStep currentTab="decomposer" onNavigate={onNavigate} />}
    </div>
  );
};
