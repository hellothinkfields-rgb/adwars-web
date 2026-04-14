'use client';

import { useState } from 'react';
import { Brand } from '@/lib/types';
import { getContrastColor } from '@/lib/grid-utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onClose: () => void;
  onRegister: (brand: Brand) => void;
}

const PRESET_COLORS = [
  '#C0392B', '#E74C3C', '#E67E22', '#F39C12',
  '#27AE60', '#16A085', '#2980B9', '#8E44AD',
  '#2C3E50', '#1ABC9C', '#D35400', '#7F8C8D',
];

export default function BrandModal({ open, onClose, onRegister }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#C0392B');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setName('');
    setDomain('');
    setColor('#C0392B');
    setError('');
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      const cleanDomain = domain.trim()
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '') || null;

      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color, domain: cleanDomain }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed. Try a different name.');
        setLoading(false);
        return;
      }

      onRegister(data.brand as Brand);
      reset();
      onClose();
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); } }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register Your Brand</DialogTitle>
          <DialogDescription>
            Claim your first squares and enter the battlefield.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <Label htmlFor="brand-name">Brand Name</Label>
            <Input
              id="brand-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nike, MrBeast, My Startup…"
              maxLength={40}
              required
              autoFocus
            />
          </div>

          {/* Domain */}
          <div>
            <Label htmlFor="brand-domain">
              Website Domain{' '}
              <span className="text-white/25 font-normal">(optional — used for your logo)</span>
            </Label>
            <Input
              id="brand-domain"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="nike.com"
            />
          </div>

          {/* Color */}
          <div>
            <Label>Brand Colour</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none flex-shrink-0"
                  style={{
                    background: c,
                    outline: color === c ? '3px solid white' : '3px solid transparent',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
              />
              <span className="text-xs text-white/25">or pick any custom colour</span>
            </div>
          </div>

          {/* Preview */}
          <div
            className="rounded-xl px-4 py-3 text-sm font-bold text-center transition-colors"
            style={{ background: color, color: getContrastColor(color) }}
          >
            {name || 'Your Brand'}
          </div>

          {error && (
            <p className="text-sm text-red-400 rounded-lg bg-red-400/10 border border-red-400/20 px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => { reset(); onClose(); }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 font-bold"
              style={{ background: color, color: getContrastColor(color) }}
            >
              {loading ? 'Registering…' : 'Enter the Battlefield ⚔️'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
