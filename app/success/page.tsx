'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get('session_id');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer);
          window.location.href = '/';
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-[#C0392B]/15 border border-[#C0392B]/30 flex items-center justify-center text-4xl mx-auto mb-6">
          ⚔️
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Territory Claimed!
        </h1>
        <p className="text-white/50 mb-8 text-lg">
          Your conquest is now live on the battlefield.
        </p>

        {/* Charity card */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] px-6 py-5 mb-8 text-left">
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 text-xl flex-shrink-0">♥</span>
            <div>
              <p className="text-sm font-semibold text-emerald-400 mb-1">Thank you for giving</p>
              <p className="text-xs text-white/40 leading-relaxed">
                35% of your payment has been donated to charity. Every conquest on Ad Wars makes the world a little better.
              </p>
            </div>
          </div>
        </div>

        <a
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white text-sm bg-[#C0392B] hover:bg-[#a93226] transition-colors shadow-lg shadow-[#C0392B]/20"
        >
          Back to Battlefield
        </a>

        <p className="text-xs text-white/20 mt-5">
          Auto-redirecting in {countdown}s
          {sessionId && <span className="ml-2 opacity-50">· {sessionId.slice(-8)}</span>}
        </p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050510]" />}>
      <SuccessContent />
    </Suspense>
  );
}
