import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Key, CheckCircle2, Circle, Lock, Copy, Check,
  ExternalLink, Loader2, ChevronRight, AlertCircle, Timer, Gift, Zap
} from 'lucide-react';

const API_BASE = '/api/v1/client';

type Phase = 'intro' | 'step1' | 'step2' | 'step3' | 'claimed';

interface StepConfig {
  num: number;
  title: string;
  desc: string;
  linkLabel?: string;
  linkUrl?: string;
  waitSeconds: number;
}

const STEPS: StepConfig[] = [
  {
    num: 1,
    title: 'Visit Checkpoint Link',
    desc: 'Click the button below to open the checkpoint page. Stay on the page and wait for the timer.',
    linkLabel: '▶ Open Checkpoint 1',
    linkUrl: 'https://youtube.com/@ChiroUI',
    waitSeconds: 15,
  },
  {
    num: 2,
    title: 'Complete Second Task',
    desc: 'Open the second checkpoint and wait. This verifies you completed both tasks.',
    linkLabel: '▶ Open Checkpoint 2',
    linkUrl: 'https://youtube.com/@ChiroUI',
    waitSeconds: 15,
  },
  {
    num: 3,
    title: 'Claim Your Free Key',
    desc: 'All steps complete! Click below to auto-generate your free license key.',
    waitSeconds: 0,
  },
];

function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const progress = seconds / total;
  const dashOffset = circ * (1 - progress);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="110" height="110" viewBox="0 0 110 110" className="rotate-[-90deg]">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="55" cy="55" r={r} fill="none"
          stroke={seconds <= 5 ? '#ef4444' : '#06b6d4'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-2xl font-bold font-mono ${seconds <= 5 ? 'text-red-400' : 'text-cyan-400'}`}>
          {seconds}
        </span>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest">sec</span>
      </div>
    </div>
  );
}

export const FreeKey: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentStep, setCurrentStep] = useState(0); // 0-indexed
  const [token, setToken] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [canAdvance, setCanAdvance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [linkOpened, setLinkOpened] = useState(false);

  // Countdown ticker
  useEffect(() => {
    if (countdown <= 0) {
      setCanAdvance(true);
      return;
    }
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { setCanAdvance(true); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const startStep = useCallback(async (stepIdx: number, existingToken?: string) => {
    setLoading(true);
    setError(null);
    setCanAdvance(false);
    setLinkOpened(false);

    const step = STEPS[stepIdx];
    try {
      const body: Record<string, unknown> = { step: step.num };
      if (existingToken) body.token = existingToken;

      const res = await fetch(`${API_BASE}/free-keygen/checkpoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to start step');
      }

      setToken(json.data.token);
      setCurrentStep(stepIdx);
      setPhase(`step${step.num}` as Phase);

      if (step.waitSeconds > 0) {
        setCountdown(step.waitSeconds);
        setCanAdvance(false);
      } else {
        setCanAdvance(true);
      }
    } catch (e: any) {
      setError(e.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const claimKey = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/free-keygen/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to claim key');
      }
      setGeneratedKey(json.data.key);
      setExpiresAt(json.data.expiresAt ? new Date(json.data.expiresAt).toLocaleDateString() : null);
      setPhase('claimed');
    } catch (e: any) {
      setError(e.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyKey = async () => {
    if (!generatedKey) return;
    await navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const stepPhase = parseInt(phase.replace('step', '')) - 1;

  return (
    <div className="min-h-screen bg-[#070a10] flex flex-col items-center justify-start p-4 pb-16 relative overflow-hidden">
      {/* Glow BG */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-2xl mt-10 mb-8 flex flex-col items-center gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Chiro UI</h1>
            <p className="text-xs text-cyan-400 font-mono tracking-widest uppercase">Free Key Generator</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 text-center max-w-md mt-1">
          Complete all 3 checkpoints to receive your free license key — no payment required.
        </p>
      </header>

      <div className="w-full max-w-2xl space-y-4 relative z-10">

        {/* Step Progress Bar */}
        <div className="flex items-center gap-0 mb-2">
          {STEPS.map((s, i) => {
            const done = phase === 'claimed' || (phase !== 'intro' && stepPhase > i);
            const active = phase !== 'intro' && phase !== 'claimed' && stepPhase === i;
            return (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-bold text-sm
                    ${done ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400' : active ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300 ring-2 ring-cyan-500/30' : 'border-gray-700 bg-gray-800/50 text-gray-500'}`}>
                    {done ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                  </div>
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${done ? 'text-cyan-400' : active ? 'text-cyan-300' : 'text-gray-600'}`}>
                    Step {s.num}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 transition-all duration-500 ${done ? 'bg-cyan-500' : 'bg-gray-700'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* === INTRO === */}
        {phase === 'intro' && (
          <div className="rounded-2xl bg-gray-900/70 border border-gray-800 p-6 space-y-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Get Your Free Key</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {STEPS.map(s => (
                <div key={s.num} className="rounded-xl bg-gray-800/60 border border-gray-700/50 p-4 space-y-2">
                  <span className="text-xs font-mono text-cyan-500 uppercase tracking-widest">Step {s.num}</span>
                  <p className="text-sm font-semibold text-white">{s.title}</p>
                  {s.waitSeconds > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <Timer className="w-3 h-3" /> ~{s.waitSeconds}s wait
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-cyan-500/5 border border-cyan-500/20 px-4 py-3 text-xs text-cyan-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Your key will be valid for <strong>365 days</strong> and bound to <strong>chiro-free-key</strong> product. One key per session.</span>
            </div>
            <button
              onClick={() => startStep(0)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
              Start — Get Free Key
            </button>
          </div>
        )}

        {/* === ACTIVE STEP === */}
        {(phase === 'step1' || phase === 'step2' || phase === 'step3') && (() => {
          const idx = stepPhase;
          const step = STEPS[idx];
          const isLastStep = idx === STEPS.length - 1;

          return (
            <div className="rounded-2xl bg-gray-900/70 border border-gray-800 p-6 space-y-6 backdrop-blur-sm">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-cyan-500 uppercase tracking-widest">Step {step.num} of 3</span>
                  <h2 className="text-xl font-bold text-white mt-0.5">{step.title}</h2>
                </div>
                {!isLastStep && (
                  <div className="text-xs text-gray-500 font-mono bg-gray-800 px-2 py-1 rounded-lg">
                    ~{step.waitSeconds}s
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-300">{step.desc}</p>

              {/* External Link */}
              {step.linkUrl && (
                <a
                  href={step.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setLinkOpened(true)}
                  className="flex items-center justify-center gap-2 w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-cyan-500/40 text-white font-semibold py-3 px-5 rounded-xl transition-all duration-200"
                >
                  <ExternalLink className="w-4 h-4 text-cyan-400" />
                  {step.linkLabel}
                </a>
              )}

              {/* Timer */}
              {step.waitSeconds > 0 && (
                <div className="flex flex-col items-center gap-3 py-2">
                  <CountdownRing seconds={countdown} total={step.waitSeconds} />
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-400">Waiting for timer...</p>
                  ) : (
                    <p className="text-sm text-green-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Timer complete! You can continue.
                    </p>
                  )}
                </div>
              )}

              {/* Advance / Claim button */}
              {!isLastStep ? (
                <button
                  onClick={() => {
                    if (idx + 1 < STEPS.length) {
                      startStep(idx + 1, token ?? undefined);
                    }
                  }}
                  disabled={!canAdvance || loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                  {canAdvance ? `Continue to Step ${step.num + 1}` : `Wait ${countdown}s...`}
                </button>
              ) : (
                <button
                  onClick={claimKey}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-5 h-5" />}
                  {loading ? 'Generating Key...' : '🎉 Claim My Free Key'}
                </button>
              )}
            </div>
          );
        })()}

        {/* === KEY CLAIMED === */}
        {phase === 'claimed' && generatedKey && (
          <div className="rounded-2xl bg-gray-900/70 border border-emerald-500/30 p-6 space-y-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Key Generated! 🎉</h2>
                <p className="text-xs text-emerald-400">Your free license is ready</p>
              </div>
            </div>

            {/* Key display */}
            <div className="rounded-xl bg-gray-950/80 border border-gray-700 p-4">
              <p className="text-xs text-gray-500 mb-2 font-mono uppercase tracking-widest">Your License Key</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-cyan-300 font-mono text-base sm:text-lg font-bold tracking-widest break-all">
                  {generatedKey}
                </code>
                <button
                  onClick={copyKey}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                    ${copied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'}`}
                >
                  {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
                </button>
              </div>
              {expiresAt && (
                <p className="text-xs text-gray-500 mt-2">Expires: <span className="text-gray-300">{expiresAt}</span></p>
              )}
            </div>

            {/* Usage instructions */}
            <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-4 space-y-2">
              <p className="text-xs font-mono text-cyan-500 uppercase tracking-widest mb-2">How to Use</p>
              <div className="rounded-lg bg-gray-950 p-3 font-mono text-xs text-gray-300 leading-relaxed overflow-x-auto">
                <span className="text-gray-500">-- Set this BEFORE loading the script</span>{'\n'}
                <span className="text-purple-400">getgenv</span>
                <span className="text-white">().Key = </span>
                <span className="text-green-400">"{generatedKey}"</span>{'\n\n'}
                <span className="text-gray-500">-- Then execute your script</span>{'\n'}
                <span className="text-purple-400">local</span>
                <span className="text-white"> Chiro = </span>
                <span className="text-purple-400">loadstring</span>
                <span className="text-white">(game:HttpGet(</span>
                <span className="text-green-400">"...chiro_lib.luau"</span>
                <span className="text-white">))()</span>
              </div>
            </div>

            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-xs text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Save your key! It is <strong>only shown once</strong>. Each checkpoint session generates a unique key.</span>
            </div>

            <button
              onClick={() => {
                setPhase('intro');
                setToken(null);
                setGeneratedKey(null);
                setError(null);
                setCurrentStep(0);
                setExpiresAt(null);
              }}
              className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Generate another key →
            </button>
          </div>
        )}

        {/* Locked key preview (shown during steps) */}
        {phase !== 'intro' && phase !== 'claimed' && (
          <div className="rounded-2xl bg-gray-900/50 border border-gray-800 p-4 flex items-center gap-4 opacity-60">
            <Lock className="w-5 h-5 text-gray-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-600 mb-1 font-mono uppercase tracking-widest">Your Key</p>
              <div className="h-5 w-full bg-gray-800 rounded-lg flex items-center px-3 gap-2">
                <span className="text-gray-600 font-mono text-sm select-none blur-sm">CHIRO-XXXX-XXXX-XXXX</span>
              </div>
            </div>
            <span className="text-xs text-gray-600 font-mono whitespace-nowrap">Complete all steps</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-10 text-center text-xs text-gray-700 font-mono">
        Chiro UI License System · Free Tier · chiro-free-key
      </footer>
    </div>
  );
};
