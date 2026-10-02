import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, Search, Home, Cpu, Layers, Compass, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface Custom404Props {
  onNavigate: (tab: 'landing' | 'console' | 'decomposer' | 'benchmarks' | 'policy' | 'analytics' | 'chat' | 'features') => void;
  attemptedPath?: string;
}

export const Custom404: React.FC<Custom404Props> = ({ onNavigate, attemptedPath = '/unknown/route-endpoint' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  const popularRoutes = [
    { name: 'Routing Console', tab: 'console' as const, desc: 'Classify prompts & preview routing decisions', icon: Cpu },
    { name: 'Multi-Part Splitter', tab: 'decomposer' as const, desc: 'Split composite queries into parallel model streams', icon: Layers },
    { name: 'Benchmark Lab & A/B Arena', tab: 'benchmarks' as const, desc: 'Empirical MMLU/GSM8K quality validation', icon: Zap },
    { name: 'Policy & Thresholds', tab: 'policy' as const, desc: 'Calibrate sensitivity, fallbacks & local endpoints', icon: Compass },
    { name: '20-Feature Production Center', tab: 'features' as const, desc: 'Verify all 20 web production requirements', icon: ShieldCheck },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.toLowerCase().trim();
    if (q.includes('console') || q.includes('prompt') || q.includes('route')) {
      onNavigate('console');
    } else if (q.includes('split') || q.includes('part') || q.includes('decompose')) {
      onNavigate('decomposer');
    } else if (q.includes('bench') || q.includes('arena') || q.includes('compare')) {
      onNavigate('benchmarks');
    } else if (q.includes('policy') || q.includes('threshold') || q.includes('setting')) {
      onNavigate('policy');
    } else if (q.includes('analytic') || q.includes('metric') || q.includes('saving')) {
      onNavigate('analytics');
    } else if (q.includes('feature') || q.includes('seo') || q.includes('check')) {
      onNavigate('features');
    } else {
      setTestResult(`No exact match for "${searchQuery}". We redirected you to the primary Routing Console.`);
      setTimeout(() => onNavigate('console'), 1200);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      {/* 3D Visual Error Badge */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-[#CBD8E8] dark:border-slate-800 rounded-3xl p-8 shadow-xs backdrop-blur-xl text-center relative overflow-hidden transition-colors">
        {/* Subtle background tactile grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        <div className="relative z-10 max-w-lg mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 text-xs font-mono font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>HTTP 404 · Unresolved Route Detected</span>
          </div>

          <div className="text-7xl font-extrabold tracking-tight text-[#020C21] dark:text-white font-display">
            4<span className="text-emerald-600 dark:text-emerald-400">0</span>4
          </div>

          <h1 className="text-xl font-bold text-[#020C21] dark:text-slate-100 font-display">
            The requested routing path does not exist.
          </h1>

          <p className="text-xs text-[#59627E] dark:text-slate-400 font-sans leading-relaxed">
            The endpoint <code className="px-1.5 py-0.5 rounded bg-[#E6EDF6] dark:bg-slate-800 text-[#020C21] dark:text-slate-200 font-mono border border-[#CBD8E8] dark:border-slate-700">{attemptedPath}</code> was either moved, partitioned during dynamic query splitting, or does not match any registered system handlers.
          </p>

          {/* Search to Rescue Input */}
          <form onSubmit={handleSearch} className="pt-2 flex gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#59627E] dark:text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules (e.g., 'arena', 'decomposer', 'policy')..."
                className="w-full pl-9 pr-3 py-2 bg-[#E6EDF6]/40 dark:bg-slate-950/60 border border-[#CBD8E8] dark:border-slate-700 rounded-xl text-xs text-[#020C21] dark:text-slate-100 placeholder-[#59627E] dark:placeholder-slate-400 focus:outline-none focus:border-[#0F1B31] dark:focus:border-sky-500 font-sans"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0F1B31] dark:bg-sky-500 hover:bg-[#1A2B45] dark:hover:bg-sky-400 text-white dark:text-slate-950 rounded-xl text-xs font-[520] shadow-xs cursor-pointer transition-all"
            >
              Locate
            </button>
          </form>

          {testResult && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 text-xs font-mono flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{testResult}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#E6EDF6] dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-[#020C21] dark:text-slate-200 rounded-full text-xs font-semibold cursor-pointer transition-all border border-[#CBD8E8] dark:border-slate-700 shadow-xs"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return to Overview</span>
            </button>
            <button
              onClick={() => onNavigate('console')}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0F1B31] dark:bg-sky-500 hover:bg-[#1A2B45] dark:hover:bg-sky-400 text-white dark:text-slate-950 rounded-full text-xs font-[520] cursor-pointer transition-all shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400 dark:text-slate-950" />
              <span>Launch Router Console</span>
            </button>
          </div>
        </div>
      </div>

      {/* Suggested Fast Navigation Tiles */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-[#59627E] dark:text-slate-400 font-semibold px-1">
          Registered Active Routes & Destinations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {popularRoutes.map((route, idx) => {
            const Icon = route.icon;
            return (
              <button
                key={idx}
                onClick={() => onNavigate(route.tab)}
                className="p-4 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 border border-[#CBD8E8] dark:border-slate-800 rounded-2xl text-left transition-all hover:shadow-xs group cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#E6EDF6] dark:bg-slate-800 group-hover:bg-[#0F1B31] dark:group-hover:bg-sky-500 group-hover:text-white dark:group-hover:text-slate-950 text-[#020C21] dark:text-slate-200 flex items-center justify-center transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-[#020C21] dark:text-slate-100 font-display">
                    {route.name}
                  </span>
                </div>
                <p className="text-xs text-[#59627E] dark:text-slate-400 font-sans leading-relaxed">
                  {route.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
