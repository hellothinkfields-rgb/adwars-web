'use client';

import { useState } from 'react';
import { Brand } from '@/lib/types';
import { getContrastColor } from '@/lib/grid-utils';

const PRESET_COLORS = [ '#C0392B', '#E74C3C', '#E67E22', '#F39C12', '#27AE60', '#16A085', '#2980B9', '#8E44AD', '#2C3E50', '#1ABC9C', '#D35400', '#7F8C8D' ];

export default function BrandModal({ onClose, onRegister }: { onClose: () => void; onRegister: (b: Brand) => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#C0392B');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true); setError('');
    try {
      const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '') || null;
      const res = await fetch('/api/brands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), color, domain: cleanDomain }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed.'); setLoading(false); return; }
      onRegister(data.brand); onClose();
    } catch { setError('Network error.'); setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl p-8" style={{ background: '#16213e', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 className="text-2xl font-bold text-white mb-1">Register Your Brand</h2>
        <p className="text-sm mb-6" style={{ color: '#8892a4' }}>Claim your first squares.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Brand Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nike, MrBeast..." maxLength={40} required className="w-full rounded-lg px-4 py-2.5 text-white text-sm outline-none" style={{ background: '#0f3460', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Website Domain <span style={{ color: '#8892a4' }}>(for logo)</span></label>
            <input type="text" value={domain} onChange={e => setDomain(e.target.value)} placeholder="nike.com" className="w-full rounded-lg px-4 py-2.5 text-white text-sm outline-none" style={{ background: '#0f3460', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Brand Colour</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_COLORS.map(c => <button key={c} type="button" onClick={() => setColor(c)} className="w-7 h-7 rounded-full" style={{ background: c, outline: color === c ? '3px solid white' : 'none', outlineOffset: '2px' }} />)}
            </div>
            <div className="rounded-lg px-4 py-3 text-sm font-semibold text-center" style={{ background: color, color: getContrastColor(color) }}>{name || 'Your Brand'}</div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg py-2.5 text-sm font-medium text-gray-300" style={{ background: 'rgba(255,255,255,0.07)' }}>Cancel</button>
            <button type="submit" disabled={loading || !name.trim()} className="flex-1 rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-50" style={{ background: color }}>{loading ? 'Registering...' : 'Enter the Battlefield'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
