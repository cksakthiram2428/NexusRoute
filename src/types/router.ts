export type ModelTier = 'local' | 'cloud_lite' | 'cloud_standard' | 'cloud_flagship';

export interface ModelSpec {
  id: string;
  name: string;
  provider: 'Local / Edge' | 'Google Gemini' | 'OpenAI' | 'Anthropic';
  tier: ModelTier;
  inputCostPer1M: number; // in USD
  outputCostPer1M: number; // in USD
  latencyAvgMs: number;
  reasoningCapability: number; // 0-100 score
  maxContext: number;
  description: string;
  status: 'online' | 'standby' | 'custom_endpoint';
  isLocal: boolean;
}

export interface ModelHealthStatus {
  modelId: string;
  name: string;
  provider: string;
  tier: ModelTier;
  status: 'online' | 'degraded' | 'offline';
  latencyMs: number;
  throughputTokensPerSec: number;
  uptimePercent: number;
  lastChecked: string;
  egressMode: 'Local Edge ($0)' | 'TLS 1.3 Cloud';
  isLocal: boolean;
}

export type TaskCategory =
  | 'text_extraction'
  | 'data_formatting'
  | 'classification_sentiment'
  | 'factual_qa'
  | 'summarization'
  | 'code_generation'
  | 'mathematical_reasoning'
  | 'complex_synthesis'
  | 'multi_part_composite';

export interface SubTask {
  id: string;
  title: string;
  prompt: string;
  category: TaskCategory;
  complexityScore: number; // 0 - 100
  recommendedModelId: string;
  recommendedModelTier: ModelTier;
  routingRationale: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCost: number;
  flagshipCost: number;
  estimatedSavingsPercent: number;
  dependencies: string[]; // subtask IDs it depends on
  status?: 'pending' | 'routing' | 'running' | 'completed' | 'failed';
  result?: string;
  actualModelId?: string;
  actualLatencyMs?: number;
  actualTokens?: {
    input: number;
    output: number;
    total: number;
  };
  actualCost?: number;
}

export interface ComplexitySignal {
  name: string;
  weight: number; // e.g. +15, -10
  description: string;
  triggered: boolean;
}

export interface RoutingAnalysis {
  overallComplexity: number; // 0 - 100
  isMultiPart: boolean;
  detectedCategory: TaskCategory;
  complexitySignals: ComplexitySignal[];
  subTasks: SubTask[];
  recommendedModelId: string;
  recommendedModelTier: ModelTier;
  routingPolicyMatched: string;
  routingRationale: string;
  confidenceScore: number; // 0 - 1
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCost: number;
  baselineFlagshipCost: number;
  projectedSavingsPercent: number;
}

export interface ExecutionTrace {
  id: string;
  timestamp: string;
  prompt: string;
  routingAnalysis: RoutingAnalysis;
  selectedModelId: string;
  isOverridden: boolean;
  overrideModelId?: string;
  subTaskResults?: {
    subTaskId: string;
    modelId: string;
    output: string;
    latencyMs: number;
    tokens: { input: number; output: number };
    cost: number;
  }[];
  finalOutput: string;
  totalLatencyMs: number;
  totalTokens: {
    input: number;
    output: number;
    total: number;
  };
  totalCost: number;
  baselineCost: number;
  costReductionPercent: number;
  qualityRating?: number; // 1-5 or evaluation score
  userFeedback?: 'optimal' | 'underpowered' | 'overpowered';
}

export interface BenchmarkItem {
  id: string;
  benchmark: 'GSM8K' | 'MMLU' | 'EnterpriseOps' | 'CodeRefactor';
  question: string;
  groundTruth: string;
  expectedCategory: TaskCategory;
  complexity: number;
  idealModelTier: ModelTier;
}

export interface BenchmarkResult {
  itemId: string;
  benchmark: string;
  question: string;
  groundTruth: string;
  flagship: {
    modelId: string;
    output: string;
    accuracy: number; // 0 or 1
    latencyMs: number;
    cost: number;
  };
  local: {
    modelId: string;
    output: string;
    accuracy: number; // 0 or 1
    latencyMs: number;
    cost: number;
  };
  routed: {
    modelId: string;
    routedTier: ModelTier;
    output: string;
    accuracy: number; // 0 or 1
    latencyMs: number;
    cost: number;
  };
}

export interface BenchmarkSuiteSummary {
  id: string;
  timestamp: string;
  totalItems: number;
  results: BenchmarkResult[];
  flagshipAccuracy: number;
  localAccuracy: number;
  routedAccuracy: number;
  flagshipTotalCost: number;
  localTotalCost: number;
  routedTotalCost: number;
  costReductionPercent: number; // e.g. 64.2%
  qualityRetentionPercent: number; // e.g. 98.5%
  qualityDeltaPercent: number; // e.g. -1.5%
}

export interface ABComparisonRequest {
  modelAId: string;
  modelBId: string;
  prompt: string;
  groundTruth?: string;
}

export interface ModelComparisonStats {
  modelId: string;
  modelName: string;
  tier: ModelTier;
  output: string;
  latencyMs: number;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  scores: {
    correctness: number; // 0-100
    reasoningDepth: number; // 0-100
    formatPrecision: number; // 0-100
    roiEfficiency: number; // 0-100
  };
}

export interface ABComparisonResult {
  id: string;
  timestamp: string;
  prompt: string;
  groundTruth?: string;
  complexityScore: number;
  complexityCategory: TaskCategory;
  modelA: ModelComparisonStats;
  modelB: ModelComparisonStats;
  costDeltaUsd: number;
  costSavingsPercent: number; // Model A vs Model B (e.g. 94% cheaper)
  latencyDeltaMs: number;
  verdict: {
    winner: 'modelA' | 'modelB' | 'tie';
    headline: string;
    analysis: string;
    routingRecommendation: string;
  };
}


export interface RoutingPolicyConfig {
  preset: 'max_savings' | 'balanced' | 'quality_first' | 'custom';
  localThreshold: number; // complexity <= threshold goes to local (e.g. 35)
  cloudLiteThreshold: number; // complexity <= threshold goes to cloud_lite (e.g. 70)
  enableAutoDecomposition: boolean;
  privacyStrictLocal: boolean;
  latencyBudgetMs: number;
  enableFallbackCascade: boolean;
  customOllamaUrl: string;
}

export interface SystemMetrics {
  totalRequests: number;
  totalCostSavedUsd: number;
  baselineCostUsd: number;
  actualCostUsd: number;
  overallCostReductionPercent: number;
  averageLatencyMs: number;
  averageQualityRetention: number;
  tierDistribution: {
    local: number;
    cloud_lite: number;
    cloud_standard: number;
    cloud_flagship: number;
  };
  recentTraces: ExecutionTrace[];
}
