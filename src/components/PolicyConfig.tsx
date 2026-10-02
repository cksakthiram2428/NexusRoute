import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  Zap,
  Lock,
  RotateCcw,
  Check,
  Server,
  AlertTriangle,
  Info,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { RoutingPolicyConfig } from '../types/router';
import { DEFAULT_ROUTING_POLICY } from '../lib/classifier';
import { ActiveTab } from './Header';
import { TopPanelBar, BottomNextStep } from './PanelNavigation';

interface PolicyConfigProps {
  policy: RoutingPolicyConfig;
  onUpdatePolicy: (newPolicy: RoutingPolicyConfig) => void;
  onNavigate?: (tab: ActiveTab) => void;
}

export const PolicyConfig: React.FC<PolicyConfigProps> = ({
  policy,
  onUpdatePolicy,
  onNavigate,
}) => {
  const [localPolicy, setLocalPolicy] = useState<RoutingPolicyConfig>(policy);
  const [saved, setSaved] = useState(false);

  const applyPreset = (preset: RoutingPolicyConfig['preset']) => {
    let updated: RoutingPolicyConfig = { ...localPolicy, preset };
    if (preset === 'max_savings') {
      updated.localThreshold = 55;
      updated.cloudLiteThreshold = 85;
      updated.enableAutoDecomposition = true;
    } else if (preset === 'balanced') {
      updated.localThreshold = 35;
      updated.cloudLiteThreshold = 72;
      updated.enableAutoDecomposition = true;
    } else if (preset === 'quality_first') {
      updated.localThreshold = 15;
      updated.cloudLiteThreshold = 45;
      updated.enableAutoDecomposition = true;
    }
    setLocalPolicy(updated);
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/config/routing-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localPolicy),
      });
      if (res.ok) {
        onUpdatePolicy(localPolicy);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save policy:', err);
    }
  };

  const handleReset = () => {
    setLocalPolicy({ ...DEFAULT_ROUTING_POLICY });
    onUpdatePolicy({ ...DEFAULT_ROUTING_POLICY });
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Step Navigation */}
      {onNavigate && <TopPanelBar currentTab="policy" onNavigate={onNavigate} />}

      {/* Top Description Box */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 shadow-xs backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0F1B31] dark:bg-sky-500 text-white dark:text-slate-950 flex items-center justify-center shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-[520] tracking-[-0.03em] text-[#020C21] dark:text-slate-100 font-display">
              Transparent Routing Policy & Control Center
            </h2>
          </div>
          <p className="text-xs text-[#59627E] dark:text-slate-400 max-w-2xl leading-relaxed font-sans">
            Configure deterministic complexity boundaries, fallback cascades, zero-data egress
            privacy rules, and local Ollama endpoint integrations to balance enterprise cost against
            reasoning fidelity.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-xs font-mono text-[#59627E] dark:text-slate-300 hover:text-[#020C21] dark:hover:text-white bg-[#E6EDF6] dark:bg-slate-800 border border-[#CBD8E8] dark:border-slate-700 rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-[520] text-white bg-[#0F1B31] dark:bg-sky-500 hover:bg-[#1A2B45] dark:hover:bg-sky-400 dark:text-slate-950 rounded-full transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-slate-950" />
                <span>Policy Saved</span>
              </>
            ) : (
              <span>Save Routing Policy</span>
            )}
          </button>
        </div>
      </div>

      {/* Quick Strategy Presets */}
      <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 shadow-xs backdrop-blur-xl space-y-3">
        <div className="text-xs font-mono text-[#59627E] dark:text-slate-400 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#0F1B31] dark:text-sky-400" />
          <span>Quick Strategy Presets:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => applyPreset('max_savings')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              localPolicy.preset === 'max_savings'
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 border-[#CBD8E8] dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-emerald-900 dark:text-emerald-300 font-mono">
                Aggressive Cost Reduction
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300/40 dark:border-emerald-600/50 font-mono font-bold">
                ~85% Savings
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-sans">
              Routes queries up to score 55 to Local Edge ($0). Maximize dollar savings.
            </p>
          </button>

          <button
            onClick={() => applyPreset('balanced')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              localPolicy.preset === 'balanced'
                ? 'bg-[#E6EDF6] dark:bg-slate-800/80 border-[#0F1B31] dark:border-sky-500 ring-2 ring-[#0F1B31]/15 dark:ring-sky-500/20 shadow-xs'
                : 'bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 border-[#CBD8E8] dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#020C21] dark:text-slate-100 font-mono">
                Balanced Pareto Frontier
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#CBD8E8] dark:bg-slate-700 text-[#020C21] dark:text-slate-100 font-mono font-bold">
                Recommended
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-sans">
              Local cutoff at 35, Flash cutoff at 72. Retains &gt;98.6% benchmark quality parity.
            </p>
          </button>

          <button
            onClick={() => applyPreset('quality_first')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              localPolicy.preset === 'quality_first'
                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 ring-2 ring-amber-500/20 shadow-xs'
                : 'bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 border-[#CBD8E8] dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-amber-900 dark:text-amber-300 font-mono">
                Maximum Reasoning Fidelity
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300/40 dark:border-amber-600/50 font-mono font-bold">
                Pro Preferred
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-sans">
              Conservatively routes to Flash & Pro tiers for mission-critical enterprise workloads.
            </p>
          </button>
        </div>
      </div>

      {/* Main Sliders & Governance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Complexity Threshold Sliders */}
        <div className="bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs backdrop-blur-xl transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6EDF6] dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#59627E] dark:text-slate-400 font-mono flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#0F1B31] dark:text-sky-400" />
              Complexity Routing Boundaries
            </span>
          </div>

          {/* Local Edge Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs flex-wrap gap-1">
              <span className="font-mono text-[#020C21] dark:text-slate-100 font-bold">
                Local Edge Cutoff Threshold (Score: 0 to {localPolicy.localThreshold})
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60 font-mono font-bold text-[11px]">
                {localPolicy.localThreshold} / 100
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              value={localPolicy.localThreshold}
              onChange={(e) =>
                setLocalPolicy({
                  ...localPolicy,
                  localThreshold: Number(e.target.value),
                  preset: 'custom',
                })
              }
              className="w-full accent-[#0F1B31] dark:accent-sky-400 cursor-pointer"
            />
            <div className="text-[11px] text-[#59627E] dark:text-slate-400 font-mono flex justify-between">
              <span>Prompts scored ≤ {localPolicy.localThreshold} route to Local Llama 3.2 3B ($0.00 egress).</span>
            </div>
          </div>

          {/* Cloud Lite Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs flex-wrap gap-1">
              <span className="font-mono text-[#020C21] dark:text-slate-100 font-bold">
                Cloud Lite Cutoff Threshold (Score: {localPolicy.localThreshold + 1} to {localPolicy.cloudLiteThreshold})
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#E6EDF6] dark:bg-slate-800 text-[#020C21] dark:text-slate-200 border border-[#CBD8E8] dark:border-slate-700 font-mono font-bold text-[11px]">
                {localPolicy.cloudLiteThreshold} / 100
              </span>
            </div>
            <input
              type="range"
              min={localPolicy.localThreshold + 5}
              max={90}
              value={localPolicy.cloudLiteThreshold}
              onChange={(e) =>
                setLocalPolicy({
                  ...localPolicy,
                  cloudLiteThreshold: Number(e.target.value),
                  preset: 'custom',
                })
              }
              className="w-full accent-[#0F1B31] dark:accent-sky-400 cursor-pointer"
            />
            <div className="text-[11px] text-[#59627E] dark:text-slate-400 font-mono flex justify-between">
              <span>Prompts scored {localPolicy.localThreshold + 1}–{localPolicy.cloudLiteThreshold} route to Gemini Flash-Lite ($0.075/1M).</span>
            </div>
          </div>

          {/* Cloud Flagship Tier */}
          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/60 rounded-2xl text-xs space-y-1 transition-colors">
            <div className="text-amber-900 dark:text-amber-300 font-bold font-mono">
              Frontier Reasoning Escalation (Score &gt; {localPolicy.cloudLiteThreshold})
            </div>
            <div className="text-[11px] text-amber-800 dark:text-amber-400">
              Deductive math proofs, complex multi-step code, and formal synthesis automatically escalate to Gemini 3.1 Pro ($1.25/1M).
            </div>
          </div>
        </div>

        {/* Right: Security, PII Rules & Ollama Integration */}
        <div className="bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs backdrop-blur-xl transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6EDF6] dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#59627E] dark:text-slate-400 font-mono flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Zero-Data Egress & Privacy Governance
            </span>
          </div>

          <div className="space-y-4 text-xs font-sans">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localPolicy.privacyStrictLocal}
                onChange={(e) =>
                  setLocalPolicy({
                    ...localPolicy,
                    privacyStrictLocal: e.target.checked,
                  })
                }
                className="mt-1 rounded border-[#CBD8E8] dark:border-slate-700 text-[#0F1B31] dark:text-sky-500 focus:ring-[#0F1B31] dark:focus:ring-sky-500"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-[#020C21] dark:text-slate-100 font-mono">
                  Strict Zero-Egress on PII Detection (HIPAA / GDPR)
                </span>
                <p className="text-[11px] text-[#59627E] dark:text-slate-400 leading-relaxed">
                  Automatically confine requests containing Social Security Numbers, credit cards, or medical IDs to local on-premises hardware.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localPolicy.enableAutoDecomposition}
                onChange={(e) =>
                  setLocalPolicy({
                    ...localPolicy,
                    enableAutoDecomposition: e.target.checked,
                  })
                }
                className="mt-1 rounded border-[#CBD8E8] dark:border-slate-700 text-[#0F1B31] dark:text-sky-500 focus:ring-[#0F1B31] dark:focus:ring-sky-500"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-[#020C21] dark:text-slate-100 font-mono">
                  Autonomous Multi-Part Query Decomposition
                </span>
                <p className="text-[11px] text-[#59627E] dark:text-slate-400 leading-relaxed">
                  Deconstruct complex multi-intent prompts into sub-tasks and execute in parallel across model tiers.
                </p>
              </div>
            </label>

            {/* Custom Ollama URL Input */}
            <div className="p-4 bg-[#E6EDF6]/50 dark:bg-slate-800/60 rounded-2xl border border-[#CBD8E8] dark:border-slate-700 space-y-2 transition-colors">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[#020C21] dark:text-slate-100 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-[#0F1B31] dark:text-sky-400" />
                  Local Ollama Endpoint URL
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">Active / Connected</span>
              </div>
              <input
                type="text"
                value={localPolicy.customOllamaUrl}
                onChange={(e) =>
                  setLocalPolicy({
                    ...localPolicy,
                    customOllamaUrl: e.target.value,
                  })
                }
                placeholder="http://localhost:11434"
                className="w-full bg-white dark:bg-slate-900 border border-[#CBD8E8] dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono text-[#020C21] dark:text-slate-100 focus:outline-none focus:border-[#0F1B31] dark:focus:border-sky-500"
              />
              <div className="text-[10px] text-[#59627E] dark:text-slate-400 font-mono">
                NexusRoute auto-connects to locally hosted Llama/Qwen models or falls back to the low-latency edge simulator.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Continuous Step Flow Navigation */}
      {onNavigate && <BottomNextStep currentTab="policy" onNavigate={onNavigate} />}
    </div>
  );
};
