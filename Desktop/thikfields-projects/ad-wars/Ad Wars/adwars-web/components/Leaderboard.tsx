'use client';

import { useMemo } from 'react';
import { GridState, Brand, TOTAL_CELLS } from '@/lib/types';

interface Props {
  grid: GridState;
  brands: Brand[];
  selectedBrand: Brand | null;
}

const RANK_COLORS = ['#f39c12', '#aaa', '#c97', '#8892a4'];

export default function Leaderboard({ grid, brands: _brands, selectedBrand }: Props) {
  const entries = useMemo(() => {
    const counts: Record<string, { name: string; color: string; cells: number; domain: string | null }> = {};

    for (const cell of Object.values(grid)) {
      if (!counts[cell.brand_name]) {
        counts[cell.brand_name] = { name: cell.brand_name, color: cell.color, cells: 0, domain: null };
      }
      counts[cell.brand_name].cells++;
    }

    for (const b of _brands) {
      if (counts[b.name]) counts[b.name].domain = b.domain;
    }

    return Object.values(counts).sort((a, b) => b.cells - a.cells);
  }, [grid, _brands]);

  const totalClaimed = entries.reduce((s, e) => s + e.cells, 0);
  const maxCells = entries[0]?.cells ?? 1;

  if (entries.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-3xl mb-2">⚔️</p>
        <p className="text-sm text-white/30">No brands yet — be the first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {entries.map((entry, i) => {
        const pct = ((entry.cells / TOTAL_CELLS) * 100).toFixed(1);
        const isMe = selectedBrand?.name === entry.name;

        return (
          <div
            key={entry.name}
            className="rounded-xl px-3 py-2.5 transition-colors"
            style={{
              background: isMe ? entry.color + '14' : 'rgba(255,255,255,0.02)',
              border: isMe ? `1px solid ${entry.color}30` : '1px solid transparent',
            }}
          >
            <div className="flex items-center gap-2.5">
              {/* Rank */}
              <span
                className="text-xs font-bold w-5 text-center flex-shrink-0 tabular-nums"
                style={{ color: RANK_COLORS[Math.min(i, 3)] }}
              >
                {i + 1}
              </span>

              {/* Logo / swatch */}
              <div
                className="w-6 h-6 rounded flex-shrink-0 overflow-hidden"
                style={{ background: entry.color }}
              >
                {entry.domain && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://logo.clearbit.com/${entry.domain}`}
                    alt=""
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </div>

              {/* Name + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-semibold text-white truncate">{entry.name}</span>
                  {isMe && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded font-bold flex-shrink-0 leading-none"
                      style={{ background: entry.color, color: '#fff' }}
                    >
                      YOU
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-white/[0.07]">
                    <div
                      className="h-1 rounded-full transition-all"
                      style={{
                        background: entry.color,
                        width: `${(entry.cells / maxCells) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-white/30 flex-shrink-0 tabular-nums">
                    {entry.cells} <span className="text-white/20">({pct}%)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <p className="text-center pt-2 text-[10px] text-white/20">
        {totalClaimed.toLocaleString()} / {TOTAL_CELLS.toLocaleString()} squares claimed
      </p>
    </div>
  );
}
