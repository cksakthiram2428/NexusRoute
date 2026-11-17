import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Zap,
  Lock,
  ArrowUpCircle,
  Ban,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  RoutingRule,
  RuleCondition,
  RuleAction,
  RoutingDecisionType,
  RuleConditionField,
  RuleConditionOperator,
} from '../types/router';
import { showToast } from '../lib/toast';
import { authHeaders } from '../lib/authHeader';

const CONDITION_FIELDS: { value: RuleConditionField; label: string; numeric: boolean }[] = [
  { value: 'prompt_contains', label: 'Prompt contains', numeric: false },
  { value: 'category', label: 'Category equals', numeric: false },
  { value: 'complexity', label: 'Complexity score', numeric: true },
  { value: 'token_count', label: 'Token count', numeric: true },
  { value: 'model_tier', label: 'Routed model tier', numeric: false },
];

const ACTION_TYPES: { value: RoutingDecisionType; label: string; icon: any }[] = [
  { value: 'force_local', label: 'Force → Local Edge ($0)', icon: Lock },
  { value: 'force_cloud_lite', label: 'Force → Cloud Lite', icon: Zap },
  { value: 'force_cloud_standard', label: 'Force → Cloud Standard', icon: Zap },
  { value: 'force_flagship', label: 'Force → Flagship', icon: ArrowUpCircle },
  { value: 'boost_signal', label: 'Boost complexity signal', icon: TrendingUp },
  { value: 'block_prompt', label: 'Block prompt', icon: Ban },
];

const OPERATORS: RuleConditionOperator[] = ['equals', 'contains', 'gte', 'lte', 'gt', 'lt'];

interface RoutingRulesPanelProps {
  onChanged?: () => void;
}

export const RoutingRulesPanel: React.FC<RoutingRulesPanelProps> = ({ onChanged }) => {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create-form state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState(100);
  const [newConditions, setNewConditions] = useState<RuleCondition[]>([
    { field: 'prompt_contains', operator: 'contains', value: '' },
  ]);
  const [newActions, setNewActions] = useState<RuleAction[]>([
    { type: 'force_local', reason: '' },
  ]);
  const [saving, setSaving] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch('/api/config/rules');
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
      }
    } catch (err) {
      console.error('Failed to fetch routing rules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleToggle = async (rule: RoutingRule) => {
    try {
      const res = await fetch(`/api/config/rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      if (res.ok) {
        setRules((current) =>
          current.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r))
        );
        showToast(`Rule "${rule.name}" ${rule.enabled ? 'disabled' : 'enabled'}`, 'info');
        onChanged?.();
      } else {
        showToast('Failed to toggle rule', 'error');
      }
    } catch {
      showToast('Failed to toggle rule', 'error');
    }
  };

  const handleDelete = async (rule: RoutingRule) => {
    try {
      const res = await fetch(`/api/config/rules/${rule.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        setRules((current) => current.filter((r) => r.id !== rule.id));
        showToast(`Rule "${rule.name}" deleted`, 'info');
        onChanged?.();
      } else {
        showToast('Failed to delete rule', 'error');
      }
    } catch {
      showToast('Failed to delete rule', 'error');
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      showToast('Rule name is required.', 'error');
      return;
    }
    const validConditions = newConditions.filter((c) => String(c.value).trim() !== '');
    if (validConditions.length === 0) {
      showToast('At least one condition with a value is required.', 'error');
      return;
    }
    const validActions = newActions.filter((a) => a.reason.trim() !== '');
    if (validActions.length === 0) {
      showToast('At least one action with a reason is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/config/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim(),
          priority: newPriority,
          enabled: true,
          conditions: validConditions,
          actions: validActions,
        }),
      });
      if (res.ok) {
        showToast(`Rule "${newName.trim()}" created and active`, 'success');
        setNewName('');
        setNewDescription('');
        setNewPriority(100);
        setNewConditions([{ field: 'prompt_contains', operator: 'contains', value: '' }]);
        setNewActions([{ type: 'force_local', reason: '' }]);
        setShowCreateForm(false);
        await fetchRules();
        onChanged?.();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Failed to create rule', 'error');
      }
    } catch {
      showToast('Failed to create rule', 'error');
    } finally {
      setSaving(false);
    }
  };

  const setCondition = (index: number, patch: Partial<RuleCondition>) => {
    setNewConditions((current) => current.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const setAction = (index: number, patch: Partial<RuleAction>) => {
    setNewActions((current) => current.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  };

  if (loading) {
    return (
      <div className="bg-white/85 dark:bg-slate-900/85 border border-[#CBD8E8] dark:border-slate-800 rounded-3xl p-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse h-14 rounded-2xl bg-[#CBD8E8]/40 dark:bg-slate-700/40" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white/85 dark:bg-slate-900/85 border border-[#CBD8E8] dark:border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xs backdrop-blur-xl transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0F1B31] dark:bg-sky-500 text-white dark:text-slate-950 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-[520] tracking-[-0.02em] text-[#020C21] dark:text-slate-100 font-display">
              Governance Rules Engine
            </h3>
          </div>
          <p className="text-[11px] text-[#59627E] dark:text-slate-400 font-sans mt-1">
            {rules.filter((r) => r.enabled).length} of {rules.length} rules active · evaluated in priority order on every routed request
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRules}
            className="px-3 py-1.5 rounded-full bg-[#E6EDF6] dark:bg-slate-800 border border-[#CBD8E8] dark:border-slate-700 text-xs font-mono text-[#59627E] dark:text-slate-400 hover:text-[#020C21] dark:hover:text-slate-100 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-1.5 rounded-full bg-[#0F1B31] dark:bg-sky-500 hover:bg-[#1A2B45] dark:hover:bg-sky-400 text-white dark:text-slate-950 text-xs font-semibold shadow-sm cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Rule</span>
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="p-4 rounded-2xl border border-dashed border-[#0F1B31]/30 dark:border-sky-500/40 bg-[#E6EDF6]/40 dark:bg-slate-800/40 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Rule name (e.g. Weekend Cost Cap)"
              className="sm:col-span-2 bg-white dark:bg-slate-900 border border-[#CBD8E8] dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-[#020C21] dark:text-slate-100 placeholder-[#59627E] dark:placeholder-slate-500 focus:outline-none focus:border-[#0F1B31] dark:focus:border-sky-500"
            />
            <input
              type="number"
              value={newPriority}
              onChange={(e) => setNewPriority(Number(e.target.value))}
              placeholder="Priority (lower = first)"
              className="bg-white dark:bg-slate-900 border border-[#CBD8E8] dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-[#020C21] dark:text-slate-100 placeholder-[#59627E] dark:placeholder-slate-500 focus:outline-none focus:border-[#0F1B31] dark:focus:border-sky-500"
            />
          </div>
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description of what this rule governs…"
            className="w-full bg-white dark:bg-slate-900 border border-[#CBD8E8] dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-[#020C21] dark:text-slate-100 placeholder-[#59627E] dark:placeholder-slate-500 focus:outline-none focus:border-[#0F1B31] dark:focus:border-sky-500"
          />

          {/* Conditions */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#59627E] dark:text-slate-400 font-semibold">
              When ALL of these conditions match:
            </div>
            {newConditions.map((cond, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2">
                <select
                  value={cond.field}
                  onChange={(e) => {
                    const field = e.target.value as RuleConditionField;
                    const numeric = CONDITION_FIELDS.find((f) => f.value === field)?.numeric;
                    setCondition(index, {
                      field,
                      operator: numeric ? 'gte' : 'contains',
                      value: numeric ? 50 : '',
                    });
                  }}
                  className="sm:w-40 bg-white dark:bg-slate-900 border border-[#CBD8E8] dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-mono text-[#020C21] dark:text-slate-100 cursor-pointer focus:outline-none"
                >
                  {CONDITION_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                <select
                  value={cond.operator}
                  onChange={(e) => setCondition(index, { operator: e.target.value as RuleConditionOperator })}
                  className="sm:w-28 bg-white dark:bg-slate-900 border border-[#CBD8E8] dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-mono text-[#020C21] dark:text-slate-100 cursor-pointer focus:outline-none"
                >
                  {OPERATORS.map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={String(cond.value)}
                  onChange={(e) => {
                    const numeric = CONDITION_FIELDS.find((f) => f.value === cond.field)?.numeric;
                    setCondition(index, { value: numeric ? Number(e.target.value) || 0 : e.target.value });
                  }}
                  placeholder="Value…"
                  className="flex-1 bg-white dark:bg-slate-900 border border-[#CBD8E8] dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-mono text-[#020C21] dark:text-slate-100 placeholder-[#59627E] dark:placeholder-slate-500 focus:outline-none focus:border-[#0F1B31] dark:focus:border-sky-500"
                />
                {newConditions.length > 1 && (
                  <button
                    onClick={() => setNewConditions((c) => c.filter((_, i) => i !== index))}
                    className="px-2.5 py-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    aria-label="Remove condition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setNewConditions((c) => [...c, { field: 'complexity', operator: 'gte', value: 50 }])}
              className="text-[11px] font-mono text-sky-700 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add condition
            </button>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#59627E] dark:text-slate-400 font-semibold">
              Then perform:
            </div>
            {newActions.map((action, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2">
                <select
                  value={action.type}
                  onChange={(e) => setAction(index, { type: e.target.value as RoutingDecisionType })}
                  className="sm:w-56 bg-white dark:bg-slate-900 border border-[#CBD8E8] dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-mono text-[#020C21] dark:text-slate-100 cursor-pointer focus:outline-none"
                >
                  {ACTION_TYPES.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={action.reason}
                  onChange={(e) => setAction(index, { reason: e.target.value })}
                  placeholder="Audit reason (recorded on every matched trace)…"
                  className="flex-1 bg-white dark:bg-slate-900 border border-[#CBD8E8] dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-mono text-[#020C21] dark:text-slate-100 placeholder-[#59627E] dark:placeholder-slate-500 focus:outline-none focus:border-[#0F1B31] dark:focus:border-sky-500"
                />
                {newActions.length > 1 && (
                  <button
                    onClick={() => setNewActions((a) => a.filter((_, i) => i !== index))}
                    className="px-2.5 py-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    aria-label="Remove action"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setNewActions((a) => [...a, { type: 'force_cloud_lite', reason: '' }])}
              className="text-[11px] font-mono text-sky-700 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add action
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 rounded-full bg-[#E6EDF6] dark:bg-slate-800 text-[#020C21] dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-5 py-2 rounded-full bg-[#0F1B31] dark:bg-sky-500 hover:bg-[#1A2B45] dark:hover:bg-sky-400 text-white dark:text-slate-950 text-xs font-semibold shadow-sm cursor-pointer transition-all disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Rule'}
            </button>
          </div>
        </div>
      )}

      {/* Rules list */}
      <div className="space-y-2.5">
        {rules.length === 0 && (
          <div className="py-8 text-center text-xs text-[#59627E] dark:text-slate-400 font-sans italic">
            No governance rules defined. Create one above to enforce deterministic dispatch policies.
          </div>
        )}
        {rules.map((rule) => {
          const isExpanded = expandedRule === rule.id;
          return (
            <div
              key={rule.id}
              className={`rounded-2xl border transition-colors ${
                rule.enabled
                  ? 'bg-white/70 dark:bg-slate-800/50 border-[#CBD8E8] dark:border-slate-700'
                  : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70'
              }`}
            >
              <div className="flex items-center gap-3 p-3.5">
                <button
                  onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                  className="flex-1 flex items-center gap-3 text-left min-w-0 cursor-pointer group"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${rule.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold font-mono truncate ${rule.enabled ? 'text-[#020C21] dark:text-slate-100' : 'text-slate-500 dark:text-slate-500 line-through'}`}>
                        {rule.name}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#E6EDF6] dark:bg-slate-800 text-[#59627E] dark:text-slate-400">
                        P{rule.priority}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#59627E] dark:text-slate-400 font-sans truncate mt-0.5">
                      {rule.description || `${rule.conditions.length} condition(s) → ${rule.actions.length} action(s)`}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#59627E] dark:text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#59627E] dark:text-slate-400 shrink-0" />
                  )}
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(rule)}
                    className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                      rule.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                    title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                    aria-label={rule.enabled ? 'Disable rule' : 'Enable rule'}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                        rule.enabled ? 'left-[18px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleDelete(rule)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    aria-label={`Delete rule ${rule.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-0 space-y-2 text-[11px] font-mono">
                  <div className="p-2.5 rounded-xl bg-[#E6EDF6]/50 dark:bg-slate-900/50 border border-[#CBD8E8] dark:border-slate-700 space-y-1">
                    <div className="text-[9px] uppercase tracking-wider text-[#59627E] dark:text-slate-500 font-semibold">Conditions (all must match)</div>
                    {rule.conditions.map((c, i) => (
                      <div key={i} className="text-[#0F182F] dark:text-slate-300">
                        <span className="text-sky-700 dark:text-sky-400 font-semibold">{c.field}</span>{' '}
                        <span className="text-[#59627E] dark:text-slate-400">{c.operator}</span>{' '}
                        <span className="font-bold">{String(c.value)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#E6EDF6]/50 dark:bg-slate-900/50 border border-[#CBD8E8] dark:border-slate-700 space-y-1">
                    <div className="text-[9px] uppercase tracking-wider text-[#59627E] dark:text-slate-500 font-semibold">Actions</div>
                    {rule.actions.map((a, i) => (
                      <div key={i} className="text-[#0F182F] dark:text-slate-300">
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{a.type}</span>
                        {a.targetModelId && <span> → {a.targetModelId}</span>}
                        {a.signalWeight !== undefined && <span> (weight {a.signalWeight > 0 ? '+' : ''}{a.signalWeight})</span>}
                        <span className="text-[#59627E] dark:text-slate-400"> — {a.reason}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-[9px] text-[#59627E] dark:text-slate-500 flex justify-between">
                    <span>Created by {rule.createdBy}</span>
                    <span>Updated {new Date(rule.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};