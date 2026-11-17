import { describe, it, expect } from 'vitest';
import { analyzeComplexity, applyRoutingRules, DEFAULT_ROUTING_POLICY } from '../src/lib/classifier';
import type { RoutingRule } from '../src/types/router';

const baseRule: Omit<RoutingRule, 'id' | 'name' | 'conditions' | 'actions'> = {
  description: 'test rule',
  enabled: true,
  priority: 10,
  createdAt: '',
  updatedAt: '',
  createdBy: 'test',
};

describe('governance rules engine', () => {
  it('privacy zero-egress lock is not overridden by boost_signal', () => {
    const piiPrompt = 'My SSN is 123-45-6789, verify it against the internal patient record securely.';
    const rules: RoutingRule[] = [
      {
        ...baseRule,
        id: 'test-boost',
        name: 'TEST Boost',
        conditions: [{ field: 'prompt_contains', operator: 'contains', value: 'SSN' }],
        actions: [{ type: 'boost_signal', reason: 'test', signalWeight: 90 }],
      },
    ];
    const analysis = analyzeComplexity(piiPrompt, DEFAULT_ROUTING_POLICY);
    const result = applyRoutingRules(analysis, piiPrompt, rules, DEFAULT_ROUTING_POLICY);
    expect(result.analysis.recommendedModelTier).toBe('local');
    expect(result.analysis.complexitySignals.some((s) => /pii|zero-egress/i.test(s.name))).toBe(true);
  });

  it('forces local tier on PII prompts', () => {
    const analysis = analyzeComplexity('ssn = 123-45-6789, verify this bank record', DEFAULT_ROUTING_POLICY);
    expect(analysis.recommendedModelTier).toBe('local');
  });

  it('block_prompt rule produces a blocked result', () => {
    const rules: RoutingRule[] = [
      {
        ...baseRule,
        id: 'test-block',
        name: 'TEST Block',
        conditions: [{ field: 'prompt_contains', operator: 'contains', value: 'drop table' }],
        actions: [{ type: 'block_prompt', reason: 'Destructive DDL blocked' }],
      },
    ];
    const analysis = analyzeComplexity('drop table users', DEFAULT_ROUTING_POLICY);
    const result = applyRoutingRules(analysis, 'drop table users', rules, DEFAULT_ROUTING_POLICY);
    expect(result.blocked).toBe(true);
    expect(result.blockReason).toContain('Destructive');
  });

  it('disabled rules never match', () => {
    const rules: RoutingRule[] = [
      {
        ...baseRule,
        enabled: false,
        id: 'test-disabled',
        name: 'TEST Disabled',
        conditions: [{ field: 'prompt_contains', operator: 'contains', value: 'drop table' }],
        actions: [{ type: 'block_prompt', reason: 'should not trigger' }],
      },
    ];
    const analysis = analyzeComplexity('drop table users', DEFAULT_ROUTING_POLICY);
    const result = applyRoutingRules(analysis, 'drop table users', rules, DEFAULT_ROUTING_POLICY);
    expect(result.blocked).toBe(false);
    expect(result.appliedRuleIds).toHaveLength(0);
  });
});
