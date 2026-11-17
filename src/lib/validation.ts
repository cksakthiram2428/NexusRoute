/**
 * Request input sanitization & validation helpers.
 * Rejects oversized or malformed payloads before they reach business logic.
 */
import {
  RuleConditionField,
  RuleConditionOperator,
  RoutingDecisionType,
  RoutingPolicyConfig,
} from '../types/router';
import { SUPPORTED_MODELS } from './pricing';

export const MAX_PROMPT_LENGTH = 20_000;
export const MAX_CHAT_MESSAGES = 50;
export const MAX_CHAT_CONTENT_LENGTH = 4_000;
export const MAX_GROUND_TRUTH_LENGTH = 10_000;

/** Trimmed, non-empty string within maxLength, else null. */
export function asValidString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  return trimmed;
}

/** Coerced finite number within bounds, else undefined. */
export function asNumberInRange(value: unknown, min: number, max: number): number | undefined {
  const num = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  if (!Number.isFinite(num)) return undefined;
  if (num < min || num > max) return undefined;
  return num;
}

export function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  return undefined;
}

export function asEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export function isKnownModelId(value: unknown): value is string {
  return typeof value === 'string' && SUPPORTED_MODELS.some((m) => m.id === value);
}

/** Sanitized policy override: known keys only, validated types & ranges. */
export function sanitizePolicyOverride(
  input: unknown
): Partial<RoutingPolicyConfig> | null | undefined {
  if (input === undefined || input === null) return undefined;
  if (typeof input !== 'object') return null;

  const src = input as Record<string, unknown>;
  const out: Partial<RoutingPolicyConfig> = {};

  if ('preset' in src) {
    const preset = asEnum(src.preset, ['max_savings', 'balanced', 'quality_first', 'custom'] as const);
    if (preset) out.preset = preset; else if (src.preset !== undefined) return null;
  }
  if ('localThreshold' in src) {
    const v = asNumberInRange(src.localThreshold, 5, 60);
    if (v !== undefined) out.localThreshold = Math.round(v); else if (src.localThreshold !== undefined) return null;
  }
  if ('cloudLiteThreshold' in src) {
    const v = asNumberInRange(src.cloudLiteThreshold, 40, 90);
    if (v !== undefined) out.cloudLiteThreshold = Math.round(v); else if (src.cloudLiteThreshold !== undefined) return null;
  }
  if ('enableAutoDecomposition' in src) {
    const v = asBoolean(src.enableAutoDecomposition);
    if (v !== undefined) out.enableAutoDecomposition = v; else if (src.enableAutoDecomposition !== undefined) return null;
  }
  if ('privacyStrictLocal' in src) {
    const v = asBoolean(src.privacyStrictLocal);
    if (v !== undefined) out.privacyStrictLocal = v; else if (src.privacyStrictLocal !== undefined) return null;
  }
  if ('latencyBudgetMs' in src) {
    const v = asNumberInRange(src.latencyBudgetMs, 100, 15000);
    if (v !== undefined) out.latencyBudgetMs = Math.round(v); else if (src.latencyBudgetMs !== undefined) return null;
  }
  if ('enableFallbackCascade' in src) {
    const v = asBoolean(src.enableFallbackCascade);
    if (v !== undefined) out.enableFallbackCascade = v; else if (src.enableFallbackCascade !== undefined) return null;
  }
  if ('customOllamaUrl' in src) {
    const v = asValidString(src.customOllamaUrl, 200);
    if (v !== null) {
      try {
        const url = new URL(v);
        out.customOllamaUrl = url.toString();
      } catch {
        return null;
      }
    } else if (src.customOllamaUrl !== undefined) return null;
  }

  return out;
}

export interface SanitizedChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function sanitizeChatMessages(value: unknown): SanitizedChatMessage[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length === 0 || value.length > MAX_CHAT_MESSAGES) return null;

  const sanitized: SanitizedChatMessage[] = [];
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) return null;
    const role = asEnum((entry as any).role, ['user', 'assistant', 'system'] as const);
    const content = asValidString((entry as any).content, MAX_CHAT_CONTENT_LENGTH);
    if (!role || !content) return null;
    sanitized.push({ role, content });
  }
  return sanitized;
}

const RULE_CONDITION_FIELDS: readonly RuleConditionField[] = [
  'prompt_contains',
  'category',
  'complexity',
  'token_count',
  'model_tier',
];
const RULE_CONDITION_OPERATORS: readonly RuleConditionOperator[] = ['equals', 'contains', 'gte', 'lte', 'gt', 'lt'];
const RULE_ACTION_TYPES: readonly RoutingDecisionType[] = [
  'force_local',
  'force_cloud_lite',
  'force_cloud_standard',
  'force_flagship',
  'block_prompt',
  'boost_signal',
];

export function sanitizeRuleConditions(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 10) return null;
  const out: { field: RuleConditionField; operator: RuleConditionOperator; value: string | number }[] = [];
  for (const c of value) {
    if (typeof c !== 'object' || c === null) return null;
    const field = asEnum((c as any).field, RULE_CONDITION_FIELDS);
    const operator = asEnum((c as any).operator, RULE_CONDITION_OPERATORS);
    const rawValue = (c as any).value;
    if (!field || !operator) return null;
    const stringFields: RuleConditionField[] = ['prompt_contains', 'category', 'model_tier'];
    if (stringFields.includes(field)) {
      const v = asValidString(rawValue, 500);
      if (v === null) return null;
      out.push({ field, operator, value: v });
    } else {
      const v = asNumberInRange(rawValue, 0, 1_000_000);
      if (v === undefined) return null;
      out.push({ field, operator, value: Math.round(v) });
    }
  }
  return out;
}

export function sanitizeRuleActions(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 10) return null;
  const out: {
    type: RoutingDecisionType;
    targetModelId?: string;
    signalName?: string;
    signalWeight?: number;
    reason: string;
  }[] = [];
  for (const a of value) {
    if (typeof a !== 'object' || a === null) return null;
    const type = asEnum((a as any).type, RULE_ACTION_TYPES);
    const reason = asValidString((a as any).reason, 300);
    if (!type || !reason) return null;
    const action: (typeof out)[number] = { type, reason };
    if ((a as any).targetModelId !== undefined) {
      const target = asValidString((a as any).targetModelId, 100);
      if (target && isKnownModelId(target)) action.targetModelId = target; else return null;
    }
    if ((a as any).signalName !== undefined) {
      const signalName = asValidString((a as any).signalName, 120);
      if (signalName) action.signalName = signalName;
    }
    if ((a as any).signalWeight !== undefined) {
      const weight = asNumberInRange((a as any).signalWeight, -50, 50);
      if (weight === undefined) return null;
      action.signalWeight = Math.round(weight);
    }
    out.push(action);
  }
  return out;
}
