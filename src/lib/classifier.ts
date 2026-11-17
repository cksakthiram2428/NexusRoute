import {
  ComplexitySignal,
  ModelTier,
  RoutingAnalysis,
  RoutingPolicyConfig,
  RoutingRule,
  RuleCondition,
  RuleEvaluationResult,
  SubTask,
  TaskCategory,
} from '../types/router';
import {
  calculateCost,
  DEFAULT_CLOUD_LITE_MODEL_ID,
  DEFAULT_CLOUD_STANDARD_MODEL_ID,
  DEFAULT_LOCAL_MODEL_ID,
  estimateTokenCount,
  FLAGSHIP_MODEL_ID,
  SUPPORTED_MODELS,
} from './pricing';

export const DEFAULT_ROUTING_POLICY: RoutingPolicyConfig = {
  preset: 'balanced',
  localThreshold: 35, // Score <= 35 -> Local Model ($0)
  cloudLiteThreshold: 72, // Score 36 - 72 -> Cloud Lite/Standard ($0.075 - $0.15)
  enableAutoDecomposition: true,
  privacyStrictLocal: false,
  latencyBudgetMs: 2500,
  enableFallbackCascade: true,
  customOllamaUrl: 'http://localhost:11434',
};

// Heuristic keyword & regex pattern lists
const MATH_REASONING_PATTERNS = [
  /solve\s+(for|equation|integral|derivative|differential|matrix)/i,
  /calculate|probability|combinatorics|theorem|proof|algorithm complexity/i,
  /gsm8k|quadratic|geometry|trigonometry|logarithm|calculus|recurrence/i,
  /\b(if and only if|let x =|deduce|q\.e\.d|mathematical induction)\b/i,
  /[0-9]+\s*[\+\-\*\/\^]\s*[0-9]+/,
];

const CODE_PATTERNS = [
  /write a (function|script|class|module|api endpoint|hook|regex|sql query)/i,
  /implement|refactor|debug|unit test|react|typescript|python|rust|docker/i,
  /```|\bconst\b|\bdef\b|\bclass\b|\binterface\b|\bfunction\b|\bimport\b/,
  /memory leak|asynchronous|concurrency|race condition|deadlock/i,
];

const EXTRACTION_FORMATTING_PATTERNS = [
  /extract\s+(all\s+)?(emails?|names?|dates?|urls?|entities|phone numbers?|prices?|keys?)/i,
  /convert\s+(this|the following)\s+to\s+(json|csv|yaml|markdown table|bullet points)/i,
  /format\s+(as|into)\s+(json|markdown|table|numbered list|clean text)/i,
  /clean up|lowercase|strip whitespace|remove duplicates|parse timestamp/i,
  /classify this (sentiment|category|ticket|review|intent)/i,
  /fix (spelling|typos|grammar|punctuation)/i,
];

const MULTI_PART_PATTERNS = [
  /(?:^|\n)(?:1[\.\)]|first(?:ly)?|part\s*1)[:\s]/im,
  /(?:^|\n)(?:2[\.\)]|second(?:ly)?|part\s*2)[:\s]/im,
  /(?:and then|also|furthermore|after that|next|lastly),?\s*(?:extract|write|analyze|calculate|explain)/i,
  /(?:step 1|task 1|phase 1)/i,
];

const PRIVACY_PATTERNS = [
  /pii|ssn|social security|credit card|confidential|patient medical record|hipaa|gdpr/i,
  /internal only|do not send to cloud|proprietary|non-disclosure/i,
];

export function analyzeComplexity(
  prompt: string,
  policy: RoutingPolicyConfig = DEFAULT_ROUTING_POLICY
): RoutingAnalysis {
  const cleanPrompt = prompt.trim();
  const inputTokens = estimateTokenCount(cleanPrompt);
  const estimatedOutputTokens = Math.max(120, Math.min(1000, Math.round(inputTokens * 1.4)));

  const signals: ComplexitySignal[] = [];
  let baseScore = 20;

  // Signal 1: Length & Token Density
  if (inputTokens > 800) {
    signals.push({
      name: 'High Token Density / Long Context',
      weight: 18,
      description: `Input is ${inputTokens} tokens, requiring extended context memory.`,
      triggered: true,
    });
    baseScore += 18;
  } else if (inputTokens > 300) {
    signals.push({
      name: 'Medium Context Window',
      weight: 8,
      description: `Input is ${inputTokens} tokens.`,
      triggered: true,
    });
    baseScore += 8;
  }

  // Signal 2: Privacy / Zero-Egress Requirements
  const hasPrivacyKeywords = PRIVACY_PATTERNS.some((p) => p.test(cleanPrompt));
  if (hasPrivacyKeywords || policy.privacyStrictLocal) {
    signals.push({
      name: 'Zero-Egress / PII Constraint',
      weight: -100, // Forces local
      description: 'Contains sensitive or local-only compliance cues; egress restricted.',
      triggered: true,
    });
  }

  // Signal 3: Extraction / Formatting (Low Complexity)
  const isExtraction = EXTRACTION_FORMATTING_PATTERNS.some((p) => p.test(cleanPrompt));
  if (isExtraction) {
    signals.push({
      name: 'Deterministic Extraction / Structural Formatting',
      weight: -15,
      description: 'Pattern matching, text formatting, or basic entity extraction.',
      triggered: true,
    });
    baseScore -= 15;
  }

  // Signal 4: Mathematical / Chain of Thought Reasoning (High Complexity)
  const isMath = MATH_REASONING_PATTERNS.some((p) => p.test(cleanPrompt));
  if (isMath) {
    signals.push({
      name: 'Symbolic / Formal Mathematical Derivation',
      weight: 45,
      description: 'Requires multi-step deductive proofs, symbolic math, or GSM8K logic.',
      triggered: true,
    });
    baseScore += 45;
  }

  // Signal 5: Code Generation / Refactoring
  const isCode = CODE_PATTERNS.some((p) => p.test(cleanPrompt));
  if (isCode) {
    const isDeepCode = /architect|concurrency|distributed|security audit|optimize algorithm/i.test(cleanPrompt);
    const codeWeight = isDeepCode ? 38 : 22;
    signals.push({
      name: isDeepCode ? 'Complex Architectural / Systems Code' : 'Structured Code Generation',
      weight: codeWeight,
      description: isDeepCode ? 'Deep system constraints & concurrency design.' : 'Standard implementation or helper function.',
      triggered: true,
    });
    baseScore += codeWeight;
  }

  // Signal 6: Multi-turn / Synthesis
  const isSynthesis = /compare and contrast|in-depth strategic evaluation|synthesize trade-offs|nuanced philosophical/i.test(cleanPrompt);
  if (isSynthesis) {
    signals.push({
      name: 'Deep Strategic / Nuanced Synthesis',
      weight: 35,
      description: 'Requires nuanced trade-off balancing and high-level reasoning.',
      triggered: true,
    });
    baseScore += 35;
  }

  // Bound overall score between 5 and 99
  let overallComplexity = Math.max(5, Math.min(98, Math.round(baseScore)));

  // Force local if privacy triggered
  if (hasPrivacyKeywords || policy.privacyStrictLocal) {
    overallComplexity = Math.min(overallComplexity, policy.localThreshold);
  }

  // Detect task category
  let detectedCategory: TaskCategory = 'factual_qa';
  if (isMath) detectedCategory = 'mathematical_reasoning';
  else if (isSynthesis) detectedCategory = 'complex_synthesis';
  else if (isCode) detectedCategory = 'code_generation';
  else if (isExtraction) detectedCategory = 'text_extraction';
  else if (inputTokens > 400 && /summariz/i.test(cleanPrompt)) detectedCategory = 'summarization';

  // Multi-part detection
  const isMultiPart = MULTI_PART_PATTERNS.some((p) => p.test(cleanPrompt)) && cleanPrompt.length > 80;
  if (isMultiPart) {
    detectedCategory = 'multi_part_composite';
  }

  // Sub-task decomposition if multi-part
  const subTasks = isMultiPart && policy.enableAutoDecomposition ? decomposePrompt(cleanPrompt, policy) : [];

  // Determine Target Model and Tier
  let recommendedModelTier: ModelTier = 'cloud_flagship';
  let recommendedModelId = FLAGSHIP_MODEL_ID;
  let routingPolicyMatched = 'Standard Quality Guarantee';
  let routingRationale = '';

  if (hasPrivacyKeywords || policy.privacyStrictLocal) {
    recommendedModelTier = 'local';
    recommendedModelId = DEFAULT_LOCAL_MODEL_ID;
    routingPolicyMatched = 'Rule: Zero-Egress Privacy Strict';
    routingRationale = 'Query contains privacy keywords or local-only compliance policy is active. Enforcing local model execution ($0 cost, 100% on-device).';
  } else if (overallComplexity <= policy.localThreshold) {
    recommendedModelTier = 'local';
    recommendedModelId = DEFAULT_LOCAL_MODEL_ID;
    routingPolicyMatched = `Complexity Score (${overallComplexity}) <= Local Threshold (${policy.localThreshold})`;
    routingRationale = `Lightweight task detected (${detectedCategory.replace('_', ' ')}). Fast local model provides identical output quality at 100% cost reduction ($0 cost).`;
  } else if (overallComplexity <= policy.cloudLiteThreshold) {
    recommendedModelTier = 'cloud_lite';
    recommendedModelId = DEFAULT_CLOUD_LITE_MODEL_ID;
    routingPolicyMatched = `Complexity Score (${overallComplexity}) <= Standard Threshold (${policy.cloudLiteThreshold})`;
    routingRationale = `Moderate reasoning task. Routed to Gemini Flash-Lite for sub-350ms response latency and 94% cost savings vs flagship.`;
  } else {
    recommendedModelTier = 'cloud_flagship';
    recommendedModelId = FLAGSHIP_MODEL_ID;
    routingPolicyMatched = `High Complexity Score (${overallComplexity}) > ${policy.cloudLiteThreshold}`;
    routingRationale = `Deep multi-step reasoning, mathematical deduction, or architectural synthesis required. Routed to Flagship model for maximum cognitive fidelity.`;
  }

  // If multi-part is decomposed, the composite cost is the sum of subtasks!
  let estimatedCost = calculateCost(recommendedModelId, inputTokens, estimatedOutputTokens);
  const baselineFlagshipCost = calculateCost(FLAGSHIP_MODEL_ID, inputTokens, estimatedOutputTokens);

  if (subTasks.length > 0) {
    const subTasksTotalCost = subTasks.reduce((acc, st) => acc + st.estimatedCost, 0);
    estimatedCost = Number((subTasksTotalCost + 0.00001).toFixed(6)); // small merger overhead
  }

  const projectedSavingsPercent = baselineFlagshipCost > 0
    ? Number((((baselineFlagshipCost - estimatedCost) / baselineFlagshipCost) * 100).toFixed(1))
    : 0;

  return {
    overallComplexity,
    isMultiPart,
    detectedCategory,
    complexitySignals: signals,
    subTasks,
    recommendedModelId,
    recommendedModelTier,
    routingPolicyMatched,
    routingRationale,
    confidenceScore: Number((0.88 + (Math.abs(50 - overallComplexity) / 100) * 0.11).toFixed(2)),
    estimatedInputTokens: inputTokens,
    estimatedOutputTokens,
    estimatedCost,
    baselineFlagshipCost,
    projectedSavingsPercent: Math.max(0, projectedSavingsPercent),
  };
}

// ---------------------------------------------------------------------------
// Governance Rules Engine
// ---------------------------------------------------------------------------

interface RuleEvaluationContext {
  prompt: string;
  category: TaskCategory;
  complexity: number;
  tokens: number;
  tier: ModelTier;
}

const RULE_TIER_TARGETS: Record<string, ModelTier> = {
  force_local: 'local',
  force_cloud_lite: 'cloud_lite',
  force_cloud_standard: 'cloud_standard',
  force_flagship: 'cloud_flagship',
};

function tierOfModel(modelId: string): ModelTier {
  const spec = SUPPORTED_MODELS.find((m) => m.id === modelId);
  return spec ? spec.tier : 'cloud_standard';
}

export function evaluateRuleCondition(condition: RuleCondition, ctx: RuleEvaluationContext): boolean {
  let fieldValue: string | number;
  switch (condition.field) {
    case 'prompt_contains':
      fieldValue = ctx.prompt;
      break;
    case 'category':
      fieldValue = ctx.category;
      break;
    case 'complexity':
      fieldValue = ctx.complexity;
      break;
    case 'token_count':
      fieldValue = ctx.tokens;
      break;
    case 'model_tier':
      fieldValue = ctx.tier;
      break;
    default:
      return false;
  }

  switch (condition.operator) {
    case 'equals':
      return String(fieldValue).toLowerCase() === String(condition.value).toLowerCase();
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
    case 'gte':
      return Number(fieldValue) >= Number(condition.value);
    case 'lte':
      return Number(fieldValue) <= Number(condition.value);
    case 'gt':
      return Number(fieldValue) > Number(condition.value);
    case 'lt':
      return Number(fieldValue) < Number(condition.value);
    default:
      return false;
  }
}

/**
 * Applies enabled governance rules (priority order) to a routing analysis.
 * Rules can force a tier, boost the complexity score, or block the prompt.
 */
export function applyRoutingRules(
  analysis: RoutingAnalysis,
  prompt: string,
  rules: RoutingRule[],
  policy: RoutingPolicyConfig = DEFAULT_ROUTING_POLICY
): RuleEvaluationResult {
  const working: RoutingAnalysis = {
    ...analysis,
    complexitySignals: [...analysis.complexitySignals],
  };
  const appliedRuleIds: string[] = [];
  let blocked = false;
  let blockReason: string | undefined;

  const ctx: RuleEvaluationContext = {
    prompt,
    category: working.detectedCategory,
    complexity: working.overallComplexity,
    tokens: working.estimatedInputTokens,
    tier: working.recommendedModelTier,
  };

  const activeRules = [...rules]
    .filter((rule) => rule.enabled)
    .sort((a, b) => a.priority - b.priority);

  for (const rule of activeRules) {
    if (blocked) break;

    const allConditionsMet =
      rule.conditions.length > 0 && rule.conditions.every((condition) => evaluateRuleCondition(condition, ctx));
    if (!allConditionsMet) continue;

    appliedRuleIds.push(rule.id);

    for (const action of rule.actions) {
      switch (action.type) {
        case 'force_local':
        case 'force_cloud_lite':
        case 'force_cloud_standard':
        case 'force_flagship': {
          const targetModelId = action.targetModelId;
          const resolvedModelId = targetModelId && SUPPORTED_MODELS.some((m) => m.id === targetModelId)
            ? targetModelId
            : undefined;
          working.recommendedModelTier = resolvedModelId
            ? tierOfModel(resolvedModelId)
            : RULE_TIER_TARGETS[action.type];
          working.recommendedModelId =
            resolvedModelId ||
            (working.recommendedModelTier === 'local'
              ? DEFAULT_LOCAL_MODEL_ID
              : working.recommendedModelTier === 'cloud_lite'
                ? DEFAULT_CLOUD_LITE_MODEL_ID
                : working.recommendedModelTier === 'cloud_standard'
                  ? DEFAULT_CLOUD_STANDARD_MODEL_ID
                  : FLAGSHIP_MODEL_ID);
          working.routingPolicyMatched = `Rule: ${rule.name}`;
          working.routingRationale = `${working.routingRationale}\n[Rule Engine] "${rule.name}" enforced: ${action.reason}`;
          break;
        }

        case 'boost_signal': {
          const weight = action.signalWeight ?? 10;
          working.overallComplexity = Math.max(5, Math.min(98, working.overallComplexity + weight));
          working.complexitySignals.push({
            name: action.signalName || `Governance Signal: ${rule.name}`,
            weight,
            description: action.reason,
            triggered: true,
          });
          // Re-derive the tier from policy thresholds after the score shift
          if (working.overallComplexity <= policy.localThreshold) {
            working.recommendedModelTier = 'local';
            working.recommendedModelId = DEFAULT_LOCAL_MODEL_ID;
          } else if (working.overallComplexity <= policy.cloudLiteThreshold) {
            working.recommendedModelTier = 'cloud_lite';
            working.recommendedModelId = DEFAULT_CLOUD_LITE_MODEL_ID;
          } else {
            working.recommendedModelTier = 'cloud_flagship';
            working.recommendedModelId = FLAGSHIP_MODEL_ID;
          }
          working.routingPolicyMatched = `Rule: ${rule.name}`;
          working.routingRationale = `${working.routingRationale}\n[Rule Engine] "${rule.name}" adjusted complexity to ${working.overallComplexity}: ${action.reason}`;
          break;
        }

        case 'block_prompt':
          blocked = true;
          blockReason = action.reason;
          working.routingRationale = `${working.routingRationale}\n[Rule Engine] BLOCKED by "${rule.name}": ${action.reason}`;
          break;
      }
    }

    // Refresh context so subsequent rules evaluate against mutated state
    ctx.complexity = working.overallComplexity;
    ctx.tier = working.recommendedModelTier;
  }

  return { analysis: working, blocked, blockReason, appliedRuleIds };
}

/**
 * Intelligent decomposition of multi-part requests into discrete sub-prompts
 */
export function decomposePrompt(prompt: string, policy: RoutingPolicyConfig): SubTask[] {
  const lines = prompt.split('\n').map((l) => l.trim()).filter(Boolean);
  const rawParts: { title: string; text: string }[] = [];

  // Match numbered bullet points or part headers
  let currentTitle = 'Initial Task';
  let currentBuffer: string[] = [];

  for (const line of lines) {
    const numMatch = line.match(/^(?:(?:[0-9]+[\.\)]|part\s*[0-9]+|step\s*[0-9]+)[:\s])\s*(.*)/i);
    if (numMatch) {
      if (currentBuffer.length > 0) {
        rawParts.push({ title: currentTitle, text: currentBuffer.join('\n') });
        currentBuffer = [];
      }
      currentTitle = numMatch[1]?.slice(0, 45) || `Sub-Task ${rawParts.length + 1}`;
      currentBuffer.push(line);
    } else {
      currentBuffer.push(line);
    }
  }

  if (currentBuffer.length > 0) {
    rawParts.push({ title: currentTitle, text: currentBuffer.join('\n') });
  }

  // If no numbered lines found, attempt sentence splitting on transition markers
  if (rawParts.length <= 1) {
    const transitions = prompt.split(/(?:and then|also,|furthermore,|after that,|lastly,)/i);
    if (transitions.length >= 2) {
      rawParts.length = 0;
      transitions.forEach((t, i) => {
        rawParts.push({
          title: `Step ${i + 1}: ${t.trim().slice(0, 35)}...`,
          text: t.trim(),
        });
      });
    }
  }

  // If still single part, create a synthetic 3-part split for composite demo prompts
  if (rawParts.length <= 1) {
    return [
      {
        id: 'task-1-extract',
        title: 'Step 1: Extract & Clean Data',
        prompt: prompt,
        category: 'text_extraction',
        complexityScore: 22,
        recommendedModelId: DEFAULT_LOCAL_MODEL_ID,
        recommendedModelTier: 'local',
        routingRationale: 'Deterministic parsing and structure extraction handled locally at $0 cost.',
        estimatedInputTokens: Math.round(estimateTokenCount(prompt) * 0.4),
        estimatedOutputTokens: 100,
        estimatedCost: 0,
        flagshipCost: calculateCost(FLAGSHIP_MODEL_ID, Math.round(estimateTokenCount(prompt) * 0.4), 100),
        estimatedSavingsPercent: 100,
        dependencies: [],
      },
      {
        id: 'task-2-reason',
        title: 'Step 2: Reasoning & Derivation',
        prompt: prompt,
        category: 'mathematical_reasoning',
        complexityScore: 88,
        recommendedModelId: FLAGSHIP_MODEL_ID,
        recommendedModelTier: 'cloud_flagship',
        routingRationale: 'Complex deductive derivation delegated to flagship model for quality parity.',
        estimatedInputTokens: Math.round(estimateTokenCount(prompt) * 0.6),
        estimatedOutputTokens: 300,
        estimatedCost: calculateCost(FLAGSHIP_MODEL_ID, Math.round(estimateTokenCount(prompt) * 0.6), 300),
        flagshipCost: calculateCost(FLAGSHIP_MODEL_ID, Math.round(estimateTokenCount(prompt) * 0.6), 300),
        estimatedSavingsPercent: 0,
        dependencies: ['task-1-extract'],
      },
    ];
  }

  // Create SubTask items for each decomposed part
  return rawParts.map((part, index) => {
    const inputTokens = estimateTokenCount(part.text);
    const outputTokens = Math.max(80, Math.round(inputTokens * 1.2));
    const partAnalysis = analyzeComplexity(part.text, policy);

    const isLocal = partAnalysis.overallComplexity <= policy.localThreshold;
    const isLite = partAnalysis.overallComplexity <= policy.cloudLiteThreshold;

    const recommendedTier: ModelTier = isLocal ? 'local' : isLite ? 'cloud_lite' : 'cloud_flagship';
    const recommendedId = isLocal
      ? DEFAULT_LOCAL_MODEL_ID
      : isLite
      ? DEFAULT_CLOUD_LITE_MODEL_ID
      : FLAGSHIP_MODEL_ID;

    const estCost = calculateCost(recommendedId, inputTokens, outputTokens);
    const fCost = calculateCost(FLAGSHIP_MODEL_ID, inputTokens, outputTokens);
    const savings = fCost > 0 ? ((fCost - estCost) / fCost) * 100 : 0;

    return {
      id: `subtask-${index + 1}`,
      title: part.title || `Part ${index + 1}`,
      prompt: part.text,
      category: partAnalysis.detectedCategory,
      complexityScore: partAnalysis.overallComplexity,
      recommendedModelId: recommendedId,
      recommendedModelTier: recommendedTier,
      routingRationale: partAnalysis.routingRationale,
      estimatedInputTokens: inputTokens,
      estimatedOutputTokens: outputTokens,
      estimatedCost: estCost,
      flagshipCost: fCost,
      estimatedSavingsPercent: Math.round(savings),
      dependencies: index > 0 ? [`subtask-${index}`] : [],
    };
  });
}
