'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  initialTab?: 'login' | 'signup';
}

export default function AuthModal({ onClose, onSuccess, initialTab = 'login' }: Props) {
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (tab === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Account created! Check your email to confirm, then log in.');
        setTab('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-5"
        style={{ background: '#0e1628', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h2 className="text-lg font-black text-white">
            {tab === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-xs mt-1" style={{ color: '#8892a4' }}>
            {tab === 'login'
              ? 'Log in to manage your brand across devices.'
              : 'Create an account to keep your brand safe.'}
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {(['login', 'signup'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setMessage(''); }}
              className="flex-1 py-2 rounded-md text-sm font-semibold transition-all"
              style={{
                background: tab === t ? '#C0392B' : 'transparent',
                color: tab === t ? '#fff' : '#8892a4',
              }}
            >
              {t === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none focus:ring-1"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', focusRingColor: '#C0392B' } as React.CSSProperties}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              placeholder="••••••••"
              required
              minLength={6}
            />
            {tab === 'signup' && (
              <p className="text-xs mt-1" style={{ color: '#8892a4' }}>Minimum 6 characters</p>
            )}
          </div>

          {error && (
            <p className="text-sm rounded-lg px-3 py-2" style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm rounded-lg px-3 py-2" style={{ color: '#4ade80', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              {message}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.07)', color: '#8892a4' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white transition-opacity disabled:opacity-50"
              style={{ background: '#C0392B' }}
            >
              {loading ? '...' : tab === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
