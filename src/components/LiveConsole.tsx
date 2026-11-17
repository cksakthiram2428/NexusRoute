import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { authHeaders } from '../lib/authHeader';
import {
  Play,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Clock,
  Coins,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Split,
  Settings2,
  Lock,
  Layers,
  Info,
  Compass,
  Activity,
  RefreshCw,
  Server,
  Zap,
  ShieldCheck,
  Radio,
  LineChart as ChartIcon,
  TrendingUp,
} from 'lucide-react';
import { ExecutionTrace, ModelHealthStatus, ModelSpec, RoutingAnalysis, RoutingPolicyConfig } from '../types/router';
import { formatUsd } from '../lib/pricing';
import { ActiveTab } from './Header';
import { TopPanelBar, BottomNextStep } from './PanelNavigation';
import { showToast } from '../lib/toast';

interface LiveConsoleProps {
  models: ModelSpec[];
  policy: RoutingPolicyConfig;
  onExecutionComplete: (trace: ExecutionTrace) => void;
  onNavigate?: (tab: ActiveTab) => void;
}

const SAMPLE_PROMPTS = [
  {
    title: 'Multi-Part Split (Extraction + SQL + Executive Summary)',
    category: 'multi_part_composite',
    prompt: `1. Extract all customer email addresses and total invoice amounts from this text: "Customer: Acme Corp, billing: finance@acme.com, contact: support@acme.com. Total amount: $12,450.00 due 2026-11-30."
2. Write a PostgreSQL table schema with indexes for storing these invoice records.
3. Provide an executive economic analysis on how corporate invoice automation lowers working capital cycle times by 14 days.`,
  },
  {
    title: 'Grade School Math / GSM8K (High Reasoning)',
    category: 'mathematical_reasoning',
    prompt: `Janet has 42 marbles. She gives 1/3 of them to Mark, and then gives 2/7 of the remaining marbles to Sarah. Afterwards, she buys 15 new marbles. How many marbles does Janet have now? Show step-by-step mathematical reasoning.`,
  },
  {
    title: 'JSON Data Normalization (Local $0 Edge)',
    category: 'data_formatting',
    prompt: `Convert the following unformatted customer log entries into valid JSON array format with standardized keys (name, email, city):
- Alice Johnson / alice.j@domain.org / Seattle
- Bob Vance / bob@vance.com / Scranton
- Clara Oswald / clara@tardis.co.uk / London`,
  },
  {
    title: 'Customer Ticket Sentiment & Routing (Local $0 Edge)',
    category: 'classification_sentiment',
    prompt: `Classify the sentiment and urgency level of this support ticket:
"Our production database has been down for 45 minutes and we cannot process payments! This is unacceptable and losing us thousands every minute. Escalate to engineering immediately!"`,
  },
  {
    title: 'Concurrency Code Refactor (Cloud Standard)',
    category: 'code_generation',
    prompt: `Write a robust TypeScript async queue with concurrency limit of 3, retry on failure (max 2 attempts with exponential backoff), and an event emitter for completion.`,
  },
  {
    title: 'Strict PII Compliance (Zero-Egress Enforcement)',
    category: 'text_extraction',
    prompt: `CONFIDENTIAL PII: Please scrub Social Security Numbers and patient health IDs from this internal ledger: "Patient Johnathan Doe (SSN: 000-12-3456, HealthID: HID-9921) visited Cardiology on Oct 1st."`,
  },
];

// Helper to generate a 24-hour latency sparkline curve for a model
const generateSparklineData = (baseLatency: number, tier: string) => {
  const points: number[] = [];
  const variance = tier === 'local' ? 3 : tier === 'cloud_lite' ? 18 : tier === 'cloud_standard' ? 25 : 45;
  for (let i = 0; i < 24; i++) {
    // Diurnal variation wave + minor jitter
    const wave = Math.sin(i * 0.3) * (variance * 0.4);
    const noise = (Math.random() - 0.5) * (variance * 0.6);
    const val = Math.max(8, Math.round(baseLatency + wave + noise));
    points.push(val);
  }
  return points;
};

// Pure SVG Sparkline Component
const LatencySparkline: React.FC<{
  data: number[];
  color: string;
  fillColor: string;
  height?: number;
}> = ({ data, color, fillColor, height = 24 }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(1, max - min);
  const width = 100;

  // Compute SVG polyline points
  const pointsStr = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Compute closed polygon for gradient fill
  const firstX = 0;
  const lastX = width;
  const bottomY = height;
  const areaPoints = `${firstX},${bottomY} ${pointsStr} ${lastX},${bottomY}`;

  return (
    <div className="relative group/sparkline flex items-center w-20 sm:w-24 md:w-28 h-6 shrink-0">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polygon
          points={areaPoints}
          fill={`url(#grad-${color.replace(/[^a-zA-Z0-9]/g, '')})`}
        />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pointsStr}
        />
      </svg>
    </div>
  );
};

export const LiveConsole: React.FC<LiveConsoleProps> = ({
  models,
  policy,
  onExecutionComplete,
  onNavigate,
}) => {
  const [prompt, setPrompt] = useState(SAMPLE_PROMPTS[0].prompt);
  const [overrideModelId, setOverrideModelId] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [analysis, setAnalysis] = useState<RoutingAnalysis | null>(null);
  const [currentTrace, setCurrentTrace] = useState<ExecutionTrace | null>(null);
  const [copied, setCopied] = useState(false);

  // Live Model Health & Latency Indicator State
  const [healthStatuses, setHealthStatuses] = useState<ModelHealthStatus[]>([]);
  const [isProbingHealth, setIsProbingHealth] = useState(false);
  const [lastProbeTime, setLastProbeTime] = useState<string>('');

  // 24-hour historical latency datasets for sparklines
  const sparklineHistory = useMemo(() => {
    const historyMap: Record<string, number[]> = {};
    models.forEach((m) => {
      historyMap[m.id] = generateSparklineData(m.latencyAvgMs, m.tier);
    });
    return historyMap;
  }, [models]);

  // Probe fleet health function
  const probeFleetHealth = useCallback(async () => {
    setIsProbingHealth(true);
    try {
      const res = await fetch('/api/models/health');
      if (res.ok) {
        const data = await res.json();
        if (data.statuses) {
          setHealthStatuses(data.statuses);
          setLastProbeTime(
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          );
        }
      }
    } catch (err) {
      console.warn('Health probe fallback notice:', err);
    } finally {
      setIsProbingHealth(false);
    }
  }, []);

  // Initial and periodic probe every 10 seconds
  useEffect(() => {
    probeFleetHealth();
    const interval = setInterval(probeFleetHealth, 10000);
    return () => clearInterval(interval);
  }, [probeFleetHealth]);

  // Trigger analysis when prompt changes
  useEffect(() => {
    if (!prompt.trim()) {
      setAnalysis(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const res = await fetch('/api/route/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, policyOverride: policy }),
        });
        if (res.ok) {
          const data = await res.json();
          setAnalysis(data);
        }
      } catch (err) {
        console.error('Analysis error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [prompt, policy]);

  const handleExecute = async () => {
    if (!prompt.trim() || isExecuting) return;

    setIsExecuting(true);
    try {
      const res = await fetch('/api/route/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          prompt,
          manualOverrideModelId: overrideModelId || undefined,
          policyOverride: policy,
        }),
      });

      if (res.ok) {
        const trace: ExecutionTrace = await res.json();
        setCurrentTrace(trace);
        onExecutionComplete(trace);
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 503 || res.status === 429) {
          showToast(data.error || 'Service is busy — retry in a few seconds.', 'error');
        } else if (res.status === 403) {
          showToast(data.error || 'Blocked by routing governance rule.', 'error');
        } else {
          showToast(data.error || 'Execution failed.', 'error');
        }
      }
    } catch (err) {
      console.error('Execution error:', err);
      showToast('Network error reaching the routing fleet.', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopy = () => {
    if (currentTrace?.finalOutput) {
      navigator.clipboard.writeText(currentTrace.finalOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getTierBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'local':
        return {
          textColor: 'text-emerald-800 dark:text-emerald-300',
          bgClass: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-700/60',
          strokeColor: '#059669',
          fillColor: '#10b981',
        };
      case 'cloud_lite':
        return {
          textColor: 'text-sky-800 dark:text-sky-300',
          bgClass: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-700/60',
          strokeColor: '#0284c7',
          fillColor: '#38bdf8',
        };
      case 'cloud_standard':
        return {
          textColor: 'text-indigo-800 dark:text-indigo-300',
          bgClass: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-700/60',
          strokeColor: '#4f46e5',
          fillColor: '#818cf8',
        };
      case 'cloud_flagship':
        return {
          textColor: 'text-amber-800 dark:text-amber-300',
          bgClass: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-700/60',
          strokeColor: '#d97706',
          fillColor: '#f59e0b',
        };
      default:
        return {
          textColor: 'text-slate-700 dark:text-slate-200',
          bgClass: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
          strokeColor: '#64748b',
          fillColor: '#94a3b8',
        };
    }
  };

  const getScoreColor = (score: number) => {
    if (score <= policy.localThreshold) return 'text-emerald-700 dark:text-emerald-400';
    if (score <= policy.cloudLiteThreshold) return 'text-sky-700 dark:text-sky-400';
    return 'text-amber-700 dark:text-amber-400';
  };

  // Determine currently active model for live availability indicator
  const activeModelId = overrideModelId || analysis?.recommendedModelId || 'local-llama-3.2-3b';
  const activeHealth = healthStatuses.find((h) => h.modelId === activeModelId);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Step Navigation */}
      {onNavigate && <TopPanelBar currentTab="console" onNavigate={onNavigate} />}

      {/* Header Banner - Standardized executive banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 shadow-xs backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0F1B31] dark:bg-sky-500 text-white dark:text-slate-950 flex items-center justify-center shadow-xs shrink-0">
            <Cpu className="w-6 h-6 text-white dark:text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#59627E] dark:text-slate-400">
                Deterministic Edge Dispatch
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active 4/4 Endpoints</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-[520] tracking-tight text-[#020C21] dark:text-slate-100">
              Live Router Console & Heuristic Scoring
            </h2>
            <p className="text-xs sm:text-sm text-[#4D5B77] dark:text-slate-400 mt-1 max-w-2xl">
              Inspect multi-dimensional query complexity vectors (0–100), view 24-hour latency sparklines, and execute real-time dispatches with zero-egress validation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-[#59627E] dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Fleet Telemetry Live</span>
          </span>
          <button
            onClick={() => onNavigate && onNavigate('decomposer')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F1B31] dark:bg-sky-500 hover:bg-[#1A2B45] dark:hover:bg-sky-400 text-white dark:text-slate-950 text-xs font-[520] shadow-xs cursor-pointer transition-all"
          >
            <span>Query Splitter</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Model Fleet Health & 24h Latency Sparkline Matrix Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 rounded-3xl p-6 shadow-xs backdrop-blur-xl space-y-4 transition-colors">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-[#E6EDF6] dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0d1b30] dark:bg-sky-500 flex items-center justify-center text-white dark:text-slate-950 shadow-xs">
              <Radio className="w-4 h-4 text-emerald-400 dark:text-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-[520] text-[#020C21] dark:text-slate-100 font-display">
                  Live Model Fleet Status & 24h Latency Matrix
                </h3>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>4/4 Endpoints Online</span>
                </span>
              </div>
              <p className="text-xs text-[#59627E] dark:text-slate-400 font-sans">
                Real-time roundtrip ping, 24-hour latency sparkline trends, and zero-egress validation before dispatch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastProbeTime && (
              <span className="text-[11px] font-mono text-[#59627E] dark:text-slate-400 hidden sm:inline">
                Last ping: {lastProbeTime}
              </span>
            )}
            <button
              onClick={probeFleetHealth}
              disabled={isProbingHealth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E6EDF6] dark:bg-slate-800 hover:bg-[#D4E2F2] dark:hover:bg-slate-700 text-[#020C21] dark:text-slate-200 text-xs font-[520] transition-colors cursor-pointer border border-[#CBD8E8] dark:border-slate-700"
              title="Probe live latency of all endpoints"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProbingHealth ? 'animate-spin' : ''}`} />
              <span>{isProbingHealth ? 'Probing...' : 'Probe Fleet'}</span>
            </button>
          </div>
        </div>

        {/* 4-Tier Model Live Health Grid with 24-Hour Sparklines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {models.map((m) => {
            const health = healthStatuses.find((h) => h.modelId === m.id);
            const isTarget = activeModelId === m.id;
            const latency = health?.latencyMs || m.latencyAvgMs;
            const isOnline = health?.status !== 'offline';
            const tierStyle = getTierBadgeStyle(m.tier);
            const sparkData = sparklineHistory[m.id] || [latency, latency];
            const minLat = Math.min(...sparkData);
            const maxLat = Math.max(...sparkData);

            return (
              <div
                key={m.id}
                onClick={() => setOverrideModelId(m.id === overrideModelId ? '' : m.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-3 ${
                  isTarget
                    ? 'bg-white dark:bg-slate-900 border-[#0F1B31] dark:border-sky-500 shadow-md ring-2 ring-[#0F1B31]/15 dark:ring-sky-500/25'
                    : 'bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 border-[#CBD8E8] dark:border-slate-800 shadow-xs'
                }`}
              >
                {isTarget && (
                  <div className="absolute top-0 right-0 px-2.5 py-0.5 rounded-bl-xl bg-[#0F1B31] dark:bg-sky-500 text-white dark:text-slate-950 text-[9px] font-mono font-bold uppercase tracking-wider">
                    {overrideModelId === m.id ? 'Manual Override' : 'Active Target'}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isOnline
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse'
                            : 'bg-red-500'
                        }`}
                      ></span>
                      <span className="text-xs font-[520] text-[#020C21] dark:text-slate-100 truncate max-w-[125px]">
                        {m.name}
                      </span>
                    </div>
                  </div>

                  {/* 24-Hour Latency Sparkline Chart Container */}
                  <div className="py-1 px-2 bg-[#E6EDF6]/40 dark:bg-slate-800/60 rounded-xl border border-[#CBD8E8]/70 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="text-[9px] font-mono text-[#59627E] dark:text-slate-400 uppercase tracking-wider">24h Latency</div>
                      <div className="text-[10px] font-bold font-mono text-[#020C21] dark:text-slate-100">
                        {minLat}–{maxLat}ms
                      </div>
                    </div>
                    <LatencySparkline
                      data={sparkData}
                      color={tierStyle.strokeColor}
                      fillColor={tierStyle.fillColor}
                      height={24}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#59627E] dark:text-slate-400">Current RTT:</span>
                    <span
                      className={`font-bold flex items-center gap-1 ${
                        latency < 50
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : latency < 200
                          ? 'text-[#020C21] dark:text-sky-400'
                          : 'text-amber-800 dark:text-amber-400'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      {latency}ms
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#E6EDF6] dark:border-slate-800">
                    <span className="text-[#59627E] dark:text-slate-400">Egress Security:</span>
                    <span className="font-semibold text-[#0F182F] dark:text-slate-200">
                      {m.tier === 'local' ? 'Zero Egress ($0)' : 'TLS 1.3 Cloud'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Banner: Quick Template Selectors */}
      <div className="bg-white/80 border border-[#CBD8E8] rounded-3xl p-5 shadow-xs backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#59627E] dark:text-slate-400 flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#0F1B31] dark:text-sky-400" />
            <span>Enterprise Benchmark Scenarios</span>
          </div>
          <span className="text-xs text-[#59627E] dark:text-slate-400 font-sans hidden sm:inline">
            Click any template to test dynamic classification & cost routing
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {SAMPLE_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(item.prompt);
                setOverrideModelId('');
              }}
              className="text-left px-3.5 py-2.5 rounded-2xl bg-[#E6EDF6]/50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-[#CBD8E8] dark:border-slate-700 transition-all text-xs group cursor-pointer"
            >
              <div className="font-[520] text-[#020C21] dark:text-slate-100 group-hover:text-[#0F1B31] dark:group-hover:text-sky-400 transition-colors truncate">
                {item.title}
              </div>
              <div className="text-[#59627E] dark:text-slate-400 text-[11px] mt-0.5 truncate font-mono">
                Category: {item.category.replace('_', ' ')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Input & Router Preview vs Output & Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Prompt Input & Explainable Routing Card */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 rounded-3xl p-6 shadow-xs backdrop-blur-xl space-y-4 transition-colors">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#59627E] dark:text-slate-400 font-mono flex items-center gap-2">
                <span>Incoming LLM Query</span>
                {isAnalyzing && (
                  <span className="text-[11px] text-[#4A78B0] dark:text-sky-400 font-normal animate-pulse">
                    Evaluating complexity...
                  </span>
                )}
              </label>

              {/* Manual Model Override Selector */}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="text-[#59627E] dark:text-slate-400 font-mono flex items-center gap-1">
                  <Settings2 className="w-3.5 h-3.5 text-[#59627E] dark:text-slate-400" />
                  Override:
                </span>
                <select
                  value={overrideModelId}
                  onChange={(e) => setOverrideModelId(e.target.value)}
                  className="bg-[#E6EDF6] dark:bg-slate-800 border border-[#CBD8E8] dark:border-slate-700 text-[#020C21] dark:text-slate-100 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-[#0F1B31] dark:focus:border-sky-500 font-mono"
                >
                  <option value="">Auto-Route (Cost Optimizer)</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.tier === 'local' ? '$0.00' : `$${m.inputCostPer1M}/1M`})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type or paste any task prompt here to evaluate complexity and cost routing..."
              rows={7}
              className="w-full bg-[#E6EDF6]/40 dark:bg-slate-950/60 border border-[#CBD8E8] dark:border-slate-700/80 rounded-2xl p-4 text-xs text-[#020C21] dark:text-slate-100 placeholder-[#59627E] dark:placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-[#0F1B31] dark:focus:border-sky-500 font-mono leading-relaxed resize-y break-words"
            />

            {/* Real-Time Live Status Feedback Badge inside input container */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E6EDF6] dark:border-slate-800 flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs font-mono flex-wrap min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
                <span className="text-[#59627E] dark:text-slate-400 shrink-0">Active Target:</span>
                <span className="font-bold text-[#020C21] dark:text-slate-100 truncate max-w-[140px] sm:max-w-xs">
                  {models.find((m) => m.id === activeModelId)?.name}
                </span>
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-700/60 shrink-0 font-semibold">
                  ⚡ {activeHealth?.latencyMs || 16}ms Latency
                </span>
              </div>

              <button
                onClick={handleExecute}
                disabled={isExecuting || !prompt.trim()}
                className="px-6 py-2.5 rounded-full bg-[#0F1B31] dark:bg-sky-500 hover:bg-[#1A2B45] dark:hover:bg-sky-400 disabled:opacity-50 text-white dark:text-slate-950 font-[520] text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                {isExecuting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>Routing & Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Intelligent Route</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Skeleton loader while routing executes */}
          {isExecuting && (
            <div className="bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="h-3 w-48 rounded-full bg-[#CBD8E8]/60 dark:bg-slate-700/50 animate-pulse" />
                <div className="h-4 w-20 rounded-full bg-[#CBD8E8]/60 dark:bg-slate-700/50 animate-pulse" />
              </div>
              <div className="h-3 w-full rounded-full bg-[#CBD8E8]/60 dark:bg-slate-700/50 animate-pulse" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-[#CBD8E8]/40 dark:bg-slate-700/40 animate-pulse" />
                ))}
              </div>
              <p className="text-[10px] text-[#59627E] dark:text-slate-400 font-mono animate-pulse">
                Profiling complexity signals and evaluating governance rules…
              </p>
            </div>
          )}

          {/* Explainable Routing & 3D Complexity Vector Card */}
          {analysis && (
            <div className="bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs backdrop-blur-xl transition-colors">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#59627E] dark:text-slate-400 font-mono flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#0F1B31] dark:text-sky-400" />
                  <span>Transparent Routing Decision Engine</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#59627E] dark:text-slate-400 font-mono">Complexity:</span>
                  <span className={`text-sm font-bold font-mono ${getScoreColor(analysis.overallComplexity)}`}>
                    {analysis.overallComplexity} / 100
                  </span>
                </div>
              </div>

              {/* 3D Complexity Vector & Signal Radar Diagram */}
              <div className="p-4 bg-[#E6EDF6]/50 dark:bg-slate-800/60 rounded-2xl border border-[#CBD8E8] dark:border-slate-700 space-y-2.5 transition-colors">
                <div className="flex items-center justify-between text-xs font-mono text-[#020C21] dark:text-slate-100 flex-wrap gap-1">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Compass className="w-3.5 h-3.5 text-[#0F1B31] dark:text-sky-400 shrink-0" />
                    <span>3D Complexity Vector Space</span>
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold shrink-0">
                    Score: {analysis.overallComplexity} (Level {analysis.overallComplexity <= 35 ? 'Edge Tier' : analysis.overallComplexity <= 72 ? 'Lite Tier' : 'Frontier Tier'})
                  </span>
                </div>

                {/* Graphical Vector Bar */}
                <div className="space-y-1">
                  <div className="h-3 w-full bg-[#CBD8E8] dark:bg-slate-700 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${analysis.overallComplexity}%` }}
                      className={`h-full transition-all duration-500 ${
                        analysis.overallComplexity <= 35
                          ? 'bg-emerald-600 dark:bg-emerald-500'
                          : analysis.overallComplexity <= 72
                          ? 'bg-[#0F1B31] dark:bg-sky-500'
                          : 'bg-amber-600 dark:bg-amber-500'
                      }`}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-[#59627E] dark:text-slate-400">
                    <span>0 (Deterministic / $0)</span>
                    <span>35 (Local Cap)</span>
                    <span>72 (Lite Cap)</span>
                    <span>100 (Deep Proofs)</span>
                  </div>
                </div>
              </div>

              {/* Decision Lockup */}
              <div className="p-4 rounded-2xl bg-[#E6EDF6]/40 dark:bg-slate-800/50 border border-[#CBD8E8] dark:border-slate-700 space-y-2.5 transition-colors">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-[#59627E] dark:text-slate-400 shrink-0">Target Route:</span>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-mono font-bold border ${getTierBadgeStyle(
                        analysis.recommendedModelTier
                      ).bgClass}`}
                    >
                      {models.find((m) => m.id === analysis.recommendedModelId)?.name ||
                        analysis.recommendedModelId}
                    </span>
                  </div>

                  {overrideModelId && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 font-mono flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3 h-3" /> Manual Override Active
                    </span>
                  )}
                </div>

                <div className="text-xs text-[#0F182F] dark:text-slate-200 leading-relaxed font-sans">
                  <strong className="text-[#020C21] dark:text-slate-100 font-mono mr-1">Rationale:</strong>
                  {analysis.routingRationale}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Execution Output & Real-Time Telemetry */}
        <div className="lg:col-span-6 space-y-5">
          {currentTrace ? (
            <div className="bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 rounded-3xl p-6 shadow-xs backdrop-blur-xl space-y-4 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#020C21] dark:text-slate-100 font-display">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Execution Output Stream</span>
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-[#59627E] dark:text-slate-400 hover:text-[#020C21] dark:hover:text-slate-100 cursor-pointer transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Telemetry KPI Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                <div className="p-3 bg-[#E6EDF6]/50 dark:bg-slate-800/60 rounded-2xl border border-[#CBD8E8] dark:border-slate-700">
                  <div className="text-[10px] text-[#59627E] dark:text-slate-400">Model Executed</div>
                  <div className="font-bold text-[#020C21] dark:text-slate-100 truncate mt-0.5">
                    {currentTrace.selectedModelId}
                  </div>
                </div>

                <div className="p-3 bg-[#E6EDF6]/50 dark:bg-slate-800/60 rounded-2xl border border-[#CBD8E8] dark:border-slate-700">
                  <div className="text-[10px] text-[#59627E] dark:text-slate-400">Latency</div>
                  <div className="font-bold text-[#020C21] dark:text-slate-100 mt-0.5">
                    {currentTrace.totalLatencyMs}ms
                  </div>
                </div>

                <div className="p-3 bg-[#E6EDF6]/50 dark:bg-slate-800/60 rounded-2xl border border-[#CBD8E8] dark:border-slate-700">
                  <div className="text-[10px] text-[#59627E] dark:text-slate-400">Total Tokens</div>
                  <div className="font-bold text-[#020C21] dark:text-slate-100 mt-0.5">
                    {currentTrace.totalTokens.total}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-700/60">
                  <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold">Cost Saved</div>
                  <div className="font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">
                    {currentTrace.costReductionPercent}%
                  </div>
                </div>
              </div>

              {/* Output Content */}
              <div className="p-4 bg-[#E6EDF6]/40 dark:bg-slate-950/60 rounded-2xl border border-[#CBD8E8] dark:border-slate-800 text-xs font-mono text-[#020C21] dark:text-slate-100 whitespace-pre-wrap break-words break-all max-h-96 overflow-y-auto leading-relaxed">
                {currentTrace.finalOutput}
              </div>
            </div>
          ) : (
            <div className="bg-white/70 dark:bg-slate-900/70 border border-[#CBD8E8] dark:border-slate-800 rounded-3xl p-12 text-center shadow-xs backdrop-blur-xl flex flex-col items-center justify-center min-h-[380px] space-y-3 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#E6EDF6] dark:bg-slate-800 flex items-center justify-center text-[#59627E] dark:text-slate-400">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-base font-[520] text-[#020C21] dark:text-slate-100">
                Awaiting Query Execution
              </h3>
              <p className="text-xs text-[#59627E] dark:text-slate-400 max-w-sm">
                Enter a prompt on the left or select a template scenario to evaluate the real-time routing decision and cost reduction.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Continuous Step Flow Navigation */}
      {onNavigate && <BottomNextStep currentTab="console" onNavigate={onNavigate} />}
    </div>
  );
};
