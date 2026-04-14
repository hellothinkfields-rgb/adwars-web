'use client';

import { useState } from 'react';
import { Brand } from '@/lib/types';
import { getContrastColor } from '@/lib/grid-utils';

const PRESET_COLORS = [
  '#C0392B', '#E74C3C', '#E67E22', '#F39C12',
  '#27AE60', '#16A085', '#2980B9', '#8E44AD',
  '#2C3E50', '#1ABC9C', '#D35400', '#7F8C8D',
];

interface Props {
  onClose: () => void;
  onRegister: (b: Brand) => void;
  userId?: string | null;
}

export default function BrandModal({ onClose, onRegister, userId }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#C0392B');
  const [domain, setDomain] = useState('');
  const [charityName, setCharityName] = useState('');
  const [charityUrl, setCharityUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setName(''); setColor('#C0392B'); setDomain('');
    setCharityName(''); setCharityUrl(''); setError(''); setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true); setError('');
    try {
      const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '') || null;
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(), color,
          domain: cleanDomain,
          charity_name: charityName.trim() || null,
          charity_url: charityUrl.trim() || null,
          user_id: userId ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed.'); setLoading(false); return; }
      onRegister(data.brand); reset(); onClose();
    } catch { setError('Network error. Please try again.'); setLoading(false); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl p-6 space-y-5 my-4" style={{ background: '#16213e', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <h2 className="text-xl font-black text-white">Register Your Brand</h2>
          <p className="text-xs mt-1" style={{ color: '#8892a4' }}>Claim your first squares and enter the battlefield.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Brand Name</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              placeholder="Nike, MrBeast, My Startup…" maxLength={40} required autoFocus
            />
          </div>

          {/* Domain */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Website Domain <span style={{ color: 'rgba(255,255,255,0.25)' }}>(optional — for your logo)</span>
            </label>
            <input
              value={domain} onChange={e => setDomain(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              placeholder="nike.com"
            />
          </div>

          {/* Colour */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Brand Colour</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{ background: c, outline: color === c ? '3px solid white' : '3px solid transparent', outlineOffset: '2px' }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" style={{ background: 'transparent' }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>or pick a custom colour</span>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl px-4 py-3 text-sm font-bold text-center" style={{ background: color, color: getContrastColor(color) }}>
            {name || 'Your Brand'}
          </div>

          {/* Charity */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(46,204,113,0.06)', border: '1px solid rgba(46,204,113,0.15)' }}>
            <div className="flex items-center gap-2">
              <span style={{ color: '#2ecc71' }}>♥</span>
              <span className="text-xs font-semibold text-white">Charity</span>
              <span className="text-xs" style={{ color: '#8892a4' }}>— optional · 35% of every conquest goes to charity</span>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Charity name</label>
              <input
                value={charityName} onChange={e => setCharityName(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                placeholder="e.g. UNICEF, Red Cross…" maxLength={80}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Charity website</label>
              <input
                value={charityUrl} onChange={e => setCharityUrl(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                placeholder="https://unicef.org"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm rounded-lg px-3 py-2" style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { reset(); onClose(); }} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.07)', color: '#8892a4' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !name.trim()} className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-40" style={{ background: color, color: getContrastColor(color) }}>
              {loading ? 'Registering…' : 'Enter the Battlefield ⚔️'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
