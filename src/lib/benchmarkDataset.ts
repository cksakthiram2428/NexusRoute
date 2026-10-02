import { BenchmarkItem } from '../types/router';

export const BENCHMARK_DATASET: BenchmarkItem[] = [
  // 1. GSM8K (Math & Reasoning)
  {
    id: 'gsm8k-1',
    benchmark: 'GSM8K',
    question: 'Janet buys 3 packs of golf balls with 12 balls per pack. She loses 4 balls on the first 9 holes and 5 balls on the back 9. How many golf balls does Janet have left?',
    groundTruth: 'Janet starts with 3 * 12 = 36 balls. She loses 4 + 5 = 9 balls in total. Remaining: 36 - 9 = 27 balls. Answer: 27',
    expectedCategory: 'mathematical_reasoning',
    complexity: 82,
    idealModelTier: 'cloud_flagship',
  },
  {
    id: 'gsm8k-2',
    benchmark: 'GSM8K',
    question: 'A bakery bakes 150 loaves of bread every morning. They sell 40% in the morning rush and 35% of the total in the afternoon. If the remaining loaves are sold at half price for $2 each, how much revenue do the remaining loaves generate?',
    groundTruth: 'Sold in morning: 150 * 0.40 = 60. Sold in afternoon: 150 * 0.35 = 52.5 -> 52.5 loaves. Remaining: 150 - (60 + 52.5) = 37.5 loaves (or 37.5 * $2 = $75). Answer: $75',
    expectedCategory: 'mathematical_reasoning',
    complexity: 86,
    idealModelTier: 'cloud_flagship',
  },
  {
    id: 'gsm8k-3',
    benchmark: 'GSM8K',
    question: 'If a train travels at 90 km/h for 2 hours and 40 minutes, and then at 60 km/h for 1 hour and 15 minutes, what is the total distance traveled in kilometers?',
    groundTruth: '2 hours 40 min = 2 + 40/60 = 8/3 hrs. Distance 1 = 90 * (8/3) = 240 km. 1 hour 15 min = 1 + 15/60 = 5/4 hrs. Distance 2 = 60 * (5/4) = 75 km. Total distance = 240 + 75 = 315 km. Answer: 315 km',
    expectedCategory: 'mathematical_reasoning',
    complexity: 78,
    idealModelTier: 'cloud_standard',
  },

  // 2. MMLU (Multi-task Language Understanding)
  {
    id: 'mmlu-1',
    benchmark: 'MMLU',
    question: 'Which of the following best describes the primary biological function of the enzyme ATP synthase during oxidative phosphorylation in mitochondria?\nA) Hydrolyzes ATP to pump protons out\nB) Synthesizes ATP using the electrochemical proton gradient across the inner membrane\nC) Transports glucose into the matrix\nD) Reduces molecular oxygen directly into hydrogen peroxide',
    groundTruth: 'B) Synthesizes ATP using the electrochemical proton gradient across the inner membrane. Answer: B',
    expectedCategory: 'factual_qa',
    complexity: 64,
    idealModelTier: 'cloud_lite',
  },
  {
    id: 'mmlu-2',
    benchmark: 'MMLU',
    question: 'In European contract law, what is the primary distinction between "frustration of purpose" and "force majeure"?\nA) Frustration voids only written contracts\nB) Force majeure requires a statutory tribunal while frustration is automatic\nC) Force majeure addresses supervening physical impossibility, while frustration addresses radical alteration of the contractual foundation\nD) There is no legal distinction under UNIDROIT principles',
    groundTruth: 'C) Force majeure addresses supervening physical impossibility, while frustration addresses radical alteration of the contractual foundation. Answer: C',
    expectedCategory: 'complex_synthesis',
    complexity: 84,
    idealModelTier: 'cloud_flagship',
  },
  {
    id: 'mmlu-3',
    benchmark: 'MMLU',
    question: 'What is the SI unit of magnetic flux density?\nA) Henry\nB) Weber\nC) Tesla\nD) Siemens',
    groundTruth: 'C) Tesla. (Weber is magnetic flux, Tesla is magnetic flux density Wb/m²). Answer: C',
    expectedCategory: 'factual_qa',
    complexity: 30,
    idealModelTier: 'local',
  },

  // 3. Enterprise Operations (High volume, high cost-savings potential)
  {
    id: 'ent-1',
    benchmark: 'EnterpriseOps',
    question: 'Extract all email addresses and total amounts from this invoice text: "Vendor: Acme Cloud Inc. Contact: support@acmecloud.io, billing.dept@acmecloud.net. Subtotal: $450.00, Tax: $36.00, Total Due: $486.00 by 2026-11-15."',
    groundTruth: '{"emails": ["support@acmecloud.io", "billing.dept@acmecloud.net"], "subtotal": 450.00, "tax": 36.00, "total": 486.00, "dueDate": "2026-11-15"}',
    expectedCategory: 'text_extraction',
    complexity: 18,
    idealModelTier: 'local',
  },
  {
    id: 'ent-2',
    benchmark: 'EnterpriseOps',
    question: 'Classify the sentiment and urgency level of this customer ticket: "I have been double-charged $199 on my account #8492 and our production server is locked down! Fix this immediately or we will terminate the enterprise agreement."',
    groundTruth: '{"sentiment": "extremely_negative", "urgency": "critical", "topic": "billing_service_outage", "risk": "churn_threat"}',
    expectedCategory: 'classification_sentiment',
    complexity: 24,
    idealModelTier: 'local',
  },
  {
    id: 'ent-3',
    benchmark: 'EnterpriseOps',
    question: 'Convert the following unformatted names and phone numbers into clean JSON with E.164 phone normalization: "John Doe (555) 123-4567 | Jane Smith: +1 555-987-6543 | Alice Wong, 5558889999"',
    groundTruth: '[{"name": "John Doe", "phone": "+15551234567"}, {"name": "Jane Smith", "phone": "+15559876543"}, {"name": "Alice Wong", "phone": "+15558889999"}]',
    expectedCategory: 'data_formatting',
    complexity: 20,
    idealModelTier: 'local',
  },

  // 4. Code & Architecture
  {
    id: 'code-1',
    benchmark: 'CodeRefactor',
    question: 'Identify the concurrency race condition in this pseudo-code and provide a thread-safe fix:\n"int balance = 1000;\nvoid withdraw(int amount) {\n  if (balance >= amount) {\n    sleep(10); // network delay\n    balance -= amount;\n  }\n}"',
    groundTruth: 'Race condition: Check-then-act window without mutual exclusion allows multiple threads to pass the condition before balance is deducted, causing double-spending and negative balances. Thread-safe fix requires mutex locking or atomic compare-and-swap.',
    expectedCategory: 'code_generation',
    complexity: 74,
    idealModelTier: 'cloud_standard',
  },
  {
    id: 'code-2',
    benchmark: 'CodeRefactor',
    question: 'Write a TypeScript interface and a pure helper function to compute the exponential backoff delay in milliseconds given retry count `attempt` (base 200ms, cap 10000ms, with full jitter).',
    groundTruth: 'interface BackoffOptions { baseMs?: number; maxMs?: number; }\nfunction getJitteredBackoff(attempt: number, opts: BackoffOptions = {}): number { const base = opts.baseMs ?? 200; const max = opts.maxMs ?? 10000; const exp = Math.min(max, base * Math.pow(2, attempt)); return Math.floor(Math.random() * exp); }',
    expectedCategory: 'code_generation',
    complexity: 65,
    idealModelTier: 'cloud_lite',
  },
];
