import React, { useState } from 'react';
import { X, ShieldCheck, Lock, FileText, Check, Sliders, Cookie, Sparkles, CheckCircle2 } from 'lucide-react';

interface LegalModalsProps {
  isPrivacyOpen: boolean;
  onClosePrivacy: () => void;
  isTermsOpen: boolean;
  onCloseTerms: () => void;
}

export const LegalModals: React.FC<LegalModalsProps> = ({
  isPrivacyOpen,
  onClosePrivacy,
  isTermsOpen,
  onCloseTerms,
}) => {
  const [cookieConsent, setCookieConsent] = useState<'accepted' | 'declined' | 'pending'>(() => {
    return (localStorage.getItem('nexusroute_cookie_consent') as any) || 'pending';
  });

  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [prefAnalytics, setPrefAnalytics] = useState(true);
  const [prefTelemetry, setPrefTelemetry] = useState(true);

  const handleAcceptCookies = () => {
    localStorage.setItem('nexusroute_cookie_consent', 'accepted');
    setCookieConsent('accepted');
  };

  const handleDeclineCookies = () => {
    localStorage.setItem('nexusroute_cookie_consent', 'declined');
    setCookieConsent('declined');
  };

  const handleSavePreferences = () => {
    localStorage.setItem(
      'nexusroute_cookie_preferences',
      JSON.stringify({ analytics: prefAnalytics, telemetry: prefTelemetry })
    );
    localStorage.setItem('nexusroute_cookie_consent', 'custom');
    setCookieConsent('accepted');
    setPreferencesOpen(false);
  };

  return (
    <>
      {/* Privacy Policy Modal (Feature #1) */}
      {isPrivacyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 font-display">
                  NexusRoute Privacy Policy & Zero-Egress Architecture
                </h3>
              </div>
              <button
                onClick={onClosePrivacy}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans text-slate-700 leading-relaxed">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 font-mono">
                <div className="text-emerald-800 font-bold text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>1. Zero-Data Egress Principle</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  When local mode or PII detection is triggered, all tokens are processed exclusively on on-premises / edge hardware. No payload ever leaves your enterprise perimeter.
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm font-display">2. Cloud Token Routing & Security</h4>
                <p>
                  For prompts exceeding local complexity thresholds, encrypted requests are routed over TLS 1.3 to tier-approved cloud providers (Google Gemini Cloud, Groq). No user prompts are used for foundation model training.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm font-display">3. HIPAA & GDPR Compliance</h4>
                <p>
                  Deterministic regex filters automatically intercept Social Security Numbers, Medical Record Identifiers, and credit card numbers, enforcing local model confinement.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm font-display">4. Ephemeral Telemetry</h4>
                <p>
                  Execution traces and latency logs are retained strictly in ephemeral session memory for audit inspection and are automatically rotated upon session closure.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={onClosePrivacy}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal (Feature #2) */}
      {isTermsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Terms of Service & Routing Governance
                </h3>
              </div>
              <button
                onClick={onCloseTerms}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans text-slate-700 leading-relaxed">
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm font-display">1. Operational SLA & Quality Guarantee</h4>
                <p>
                  NexusRoute provides dynamic model dispatch based on algorithmic complexity heuristic classification. While the Pareto frontier aims for &gt;98% empirical accuracy parity with flagship models, administrators retain full manual override control at all times.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm font-display">2. Fallback Cascading Rules</h4>
                <p>
                  If an on-device local model endpoint fails to respond within the configured latency budget (default: 2,500ms), NexusRoute will automatically cascade the request to the next available tier to prevent service disruption.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm font-display">3. Cost Calculation Accuracy</h4>
                <p>
                  Token rates are billed according to published provider schedules ($/1M input and output tokens). Realized enterprise savings depend on workload complexity distribution.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={onCloseTerms}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
              >
                Accept Terms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tactile Skeuomorphic Cookie Consent Banner (Feature #5) */}
      {cookieConsent === 'pending' && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-white border border-slate-200 rounded-2xl p-5 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-display">
              <Cookie className="w-4 h-4 text-emerald-600" />
              Essential Telemetry & Cookie Policy
            </span>
          </div>

          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            NexusRoute uses strictly local session storage for caching benchmark traces and routing
            preferences. No tracking data is sold to 3rd parties.
          </p>

          {preferencesOpen && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <label className="flex items-center justify-between text-slate-700 cursor-pointer">
                <span>Routing Telemetry & Traces</span>
                <input
                  type="checkbox"
                  checked={prefTelemetry}
                  onChange={(e) => setPrefTelemetry(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
              </label>
              <label className="flex items-center justify-between text-slate-700 cursor-pointer">
                <span>Cost Reduction Trend Analytics</span>
                <input
                  type="checkbox"
                  checked={prefAnalytics}
                  onChange={(e) => setPrefAnalytics(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
              </label>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-1 font-sans text-xs">
            <button
              onClick={() => setPreferencesOpen(!preferencesOpen)}
              className="text-slate-500 hover:text-slate-900 underline text-[11px] cursor-pointer"
            >
              {preferencesOpen ? 'Hide Preferences' : 'Customize'}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDeclineCookies}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
              >
                Decline
              </button>
              {preferencesOpen ? (
                <button
                  onClick={handleSavePreferences}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Save Settings
                </button>
              ) : (
                <button
                  onClick={handleAcceptCookies}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Accept All
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
