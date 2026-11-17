import React, { useState } from 'react';
import { X, Cpu, ShieldCheck, Zap, Coins, Clock, Copy, Check, History, Sliders, AlertTriangle, GitBranch } from 'lucide-react';
import { ExecutionTrace, ModelSpec } from '../types/router';
import { formatUsd } from '../lib/pricing';
import { showToast } from '../lib/toast';

interface TraceInspectorModalProps {
  trace: ExecutionTrace;
  models: ModelSpec[];
  onClose: () => void;
  onOverride: (traceId: string, modelId: string, reason: string) => Promise<void>;
}

const PIPELINE_LABELS: Record<string, string> = {
  heuristic: 'Heuristic Engine',
  'onnx-neural': 'ONNX Neural (INT8 DistilBERT)',
  'rule-engine': 'Governance Rules Engine',
  'manual-override': 'Manual Operator Override',
};

export const TraceInspectorModal: React.FC<TraceInspectorModalProps> = ({
  trace,
  models,
  onClose,
  onOverride,
}) => {
  const [targetModelId, setTargetModelId] = useState(trace.selectedModelId);
  const [reason, setReason] = useState('');
  const [copied, setCopied] = useState(false);
  const [applying, setApplying] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(trace.finalOutput);
    setCopied(true);
    showToast('Model output copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOverride = async () => {
    if (!targetModelId || !reason.trim()) {
      showToast('Select a target model and record a justification first.', 'error');
      return;
    }
    setApplying(true);
    try {
      await onOverride(trace.id, targetModelId, reason.trim());
      showToast(`Trace re-dispatched to ${targetModelId}`, 'success');
      setReason('');
    } catch (err: any) {
      showToast(err?.message || 'Override failed', 'error');
    } finally {
      setApplying(false);
    }
  };

  const signals = trace.routingAnalysis.complexitySignals.filter((s) => s.triggered);
  const appliedRuleNames = (trace.appliedRuleIds || [])
    .map((id) => id)
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-[#CBD8E8] dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E6EDF6] dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Cpu className="w-5 h-5 text-[#020C21] dark:text-sky-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-[520] text-[#020C21] dark:text-slate-100 truncate">
                Trace Inspector · {trace.id}
              </h3>
              <p className="text-[10px] text-[#59627E] dark:text-slate-400 font-mono">
                {new Date(trace.timestamp).toLocaleString()} ·{' '}
                {PIPELINE_LABELS[trace.sourcePipeline || 'heuristic'] || trace.sourcePipeline}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Prompt */}
          <div className="space-y-1">
            <div className="text-[#59627E] dark:text-slate-400 font-sans font-medium">User Prompt:</div>
            <div className="p-3 bg-[#E6EDF6]/60 dark:bg-slate-800/60 rounded-xl border border-[#CBD8E8] dark:border-slate-700 text-[#020C21] dark:text-slate-100 font-mono text-[11px] leading-relaxed">
              {trace.prompt}
            </div>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-[#CBD8E8] dark:border-slate-700">
              <div className="text-[#59627E] dark:text-slate-400 text-[10px] font-sans">Model Used</div>
              <div className="text-[#020C21] dark:text-slate-100 font-bold truncate">{trace.selectedModelId}</div>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-[#CBD8E8] dark:border-slate-700">
              <div className="text-[#59627E] dark:text-slate-400 text-[10px] font-sans">Complexity</div>
              <div className="text-sky-700 dark:text-sky-400 font-bold">
                {trace.routingAnalysis.overallComplexity} / 100
              </div>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-[#CBD8E8] dark:border-slate-700">
              <div className="text-[#59627E] dark:text-slate-400 text-[10px] font-sans">Latency</div>
              <div className="text-[#020C21] dark:text-slate-100 font-bold">{trace.totalLatencyMs}ms</div>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
              <div className="text-emerald-800 dark:text-emerald-300 text-[10px] font-sans">Net Cost Saved</div>
              <div className="text-emerald-800 dark:text-emerald-300 font-bold">
                {trace.costReductionPercent}% ({formatUsd(trace.totalCost)})
              </div>
            </div>
          </div>

          {/* Triggered signals */}
          {signals.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[#59627E] dark:text-slate-400 font-sans font-medium flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Triggered Complexity Signals ({signals.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {signals.map((s, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono border ${
                      s.weight >= 0
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                    }`}
                    title={s.description}
                  >
                    {s.name} ({s.weight > 0 ? '+' : ''}{s.weight})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Applied governance rules */}
          {appliedRuleNames.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[#59627E] dark:text-slate-400 font-sans font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Applied Governance Rules
              </div>
              <div className="flex flex-wrap gap-2">
                {appliedRuleNames.map((id) => (
                  <span
                    key={id}
                    className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-800 dark:text-indigo-300"
                  >
                    {id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Routing rationale */}
          <div className="space-y-1">
            <div className="text-[#59627E] dark:text-slate-400 font-sans font-medium">Routing Rationale:</div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-[#CBD8E8] dark:border-slate-700 text-[#0F182F] dark:text-slate-200 leading-relaxed font-sans text-xs whitespace-pre-wrap">
              {trace.routingAnalysis.routingRationale}
            </div>
          </div>

          {/* Override history */}
          {(trace.overrideHistory?.length || 0) > 0 && (
            <div className="space-y-1.5">
              <div className="text-[#59627E] dark:text-slate-400 font-sans font-medium flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-violet-500" />
                Override History
              </div>
              <div className="space-y-2">
                {trace.overrideHistory!.map((entry, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-violet-50/60 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50 text-[11px] font-mono space-y-0.5"
                  >
                    <div className="text-violet-900 dark:text-violet-200 font-semibold">
                      {entry.previousModelId} → {entry.overriddenModelId}
                    </div>
                    <div className="text-[#59627E] dark:text-slate-400">{entry.reason}</div>
                    <div className="text-[10px] text-[#59627E] dark:text-slate-500">
                      by {entry.overriddenBy} · {new Date(entry.overriddenAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[#59627E] dark:text-slate-400 font-sans font-medium">
              <span>Generated Output:</span>
              <button
                onClick={handleCopy}
                className="text-[#020C21] dark:text-slate-200 hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-3 bg-[#E6EDF6]/60 dark:bg-slate-800/60 rounded-xl border border-[#CBD8E8] dark:border-slate-700 text-[#020C21] dark:text-slate-100 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono text-[11px]">
              {trace.finalOutput}
            </div>
          </div>
        </div>

        {/* Override footer */}
        <div className="p-4 border-t border-[#CBD8E8] dark:border-slate-800 bg-[#E6EDF6]/40 dark:bg-slate-900 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-sans font-semibold text-[#020C21] dark:text-slate-100">
            <Sliders className="w-3.5 h-3.5 text-[#0F1B31] dark:text-sky-400" />
            Re-dispatch this request (manual override)
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={targetModelId}
              onChange={(e) => setTargetModelId(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-800 border border-[#CBD8E8] dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-[#020C21] dark:text-slate-100 focus:outline-none focus:border-[#0F1B31] dark:focus:border-sky-500 cursor-pointer"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.isLocal ? '$0 (local)' : `$${m.inputCostPer1M}/1M in`}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Justification (required for audit trail)…"
              className="flex-1 bg-white dark:bg-slate-800 border border-[#CBD8E8] dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-[#020C21] dark:text-slate-100 placeholder-[#59627E] dark:placeholder-slate-500 focus:outline-none focus:border-[#0F1B31] dark:focus:border-sky-500"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-[#59627E] dark:text-slate-400 font-sans flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              Overrides are recorded permanently in the audit ledger.
            </span>
            <button
              onClick={handleOverride}
              disabled={applying}
              className="px-5 py-2 rounded-full bg-[#0F1B31] dark:bg-sky-500 hover:bg-[#1A2B45] dark:hover:bg-sky-400 text-white dark:text-slate-950 text-xs font-[520] shadow-sm cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <GitBranch className="w-3.5 h-3.5" />
              {applying ? 'Applying…' : 'Apply Override'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};