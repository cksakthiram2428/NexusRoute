import { ModelSpec, ModelTier } from '../types/router';

export const SUPPORTED_MODELS: ModelSpec[] = [
  {
    id: 'local-llama-3.2-3b',
    name: 'Llama 3.2 3B (Edge / Local)',
    provider: 'Local / Edge',
    tier: 'local',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    latencyAvgMs: 120,
    reasoningCapability: 58,
    maxContext: 8192,
    description: 'On-device / local Ollama model. $0 cost, zero data egress. Optimal for extraction, formatting, regex, entity tagging, and lightweight classification.',
    status: 'online',
    isLocal: true,
  },
  {
    id: 'local-qwen-2.5-7b',
    name: 'Qwen 2.5 7B (Local Heavy)',
    provider: 'Local / Edge',
    tier: 'local',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    latencyAvgMs: 240,
    reasoningCapability: 76,
    maxContext: 32768,
    description: 'High-capability local open-weights model. Handles moderate coding, structured JSON normalization, and standard factual Q&A at zero cost.',
    status: 'online',
    isLocal: true,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    provider: 'Google Gemini',
    tier: 'cloud_lite',
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30,
    latencyAvgMs: 310,
    reasoningCapability: 82,
    maxContext: 1048576,
    description: 'Ultra high-throughput lightweight cloud model. Ideal for summarization, document indexing, drafting, and medium-complexity multi-turn chats.',
    status: 'online',
    isLocal: false,
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'Google Gemini',
    tier: 'cloud_standard',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    latencyAvgMs: 420,
    reasoningCapability: 91,
    maxContext: 1048576,
    description: 'State-of-the-art multimodal standard workhorse. High speed, low cost, excellent at coding, tool calling, and general reasoning.',
    status: 'online',
    isLocal: false,
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Flagship)',
    provider: 'Google Gemini',
    tier: 'cloud_flagship',
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.00,
    latencyAvgMs: 1450,
    reasoningCapability: 99,
    maxContext: 2097152,
    description: 'Flagship frontier model with deep reasoning, formal proofs, complex multi-step algorithmic optimization, and nuanced domain synthesis.',
    status: 'online',
    isLocal: false,
  },
];

export const FLAGSHIP_MODEL_ID = 'gemini-3.1-pro-preview';
export const DEFAULT_LOCAL_MODEL_ID = 'local-llama-3.2-3b';
export const DEFAULT_CLOUD_LITE_MODEL_ID = 'gemini-3.1-flash-lite';
export const DEFAULT_CLOUD_STANDARD_MODEL_ID = 'gemini-3.8-flash';

export function calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const model = SUPPORTED_MODELS.find(m => m.id === modelId) || SUPPORTED_MODELS.find(m => m.id === FLAGSHIP_MODEL_ID)!;
  const inCost = (inputTokens / 1_000_000) * model.inputCostPer1M;
  const outCost = (outputTokens / 1_000_000) * model.outputCostPer1M;
  return Number((inCost + outCost).toFixed(7));
}

export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  // Approximation: ~1 token per 4 chars or 0.75 words
  return Math.max(1, Math.ceil(text.length / 3.8));
}

export function formatUsd(amount: number): string {
  if (amount === 0) return '$0.0000';
  if (amount < 0.0001) return `$${amount.toFixed(6)}`;
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(3)}`;
}
