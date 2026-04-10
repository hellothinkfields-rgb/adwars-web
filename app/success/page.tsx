'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a1a' }}>
      <div className="text-center max-w-md px-6">
        <div className="text-6xl mb-6">⚔️</div>
        <h1 className="text-3xl font-black text-white mb-3">Territory Claimed!</h1>
        <p className="text-lg mb-2" style={{ color: '#2ecc71' }}>
          Your conquest is now live on the battlefield.
        </p>
        <p className="text-sm mb-8" style={{ color: '#8892a4' }}>
          35% of your payment has been donated to charity.
        </p>
        <a href="/" className="inline-block px-8 py-3 rounded-xl font-bold text-white text-sm" style={{ background: '#C0392B' }}>Back to Battlefield</a>
        <p className="text-xs mt-4" style={{ color: '#8892a4' }}>Auto-redirecting in {countdown}s…</p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#0a0a1a' }} />}>
      <SuccessContent />
    </Suspense>
  );
}
