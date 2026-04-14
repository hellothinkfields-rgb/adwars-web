'use client';

import { useMemo } from 'react';
import { GridState, Brand, TOTAL_CELLS } from '@/lib/types';

interface Props {
  grid: GridState;
  brands: Brand[];
  selectedBrand: Brand | null;
}

export default function Leaderboard({ grid, brands: _brands, selectedBrand }: Props) {
  const entries = useMemo(() => {
    const counts: Record<string, { name: string; color: string; cells: number; domain: string | null }> = {};

    for (const cell of Object.values(grid)) {
      if (!counts[cell.brand_name]) {
        counts[cell.brand_name] = { name: cell.brand_name, color: cell.color, cells: 0, domain: null };
      }
      counts[cell.brand_name].cells++;
    }

    // Fill in domains from brands list
    for (const b of _brands) {
      if (counts[b.name]) counts[b.name].domain = b.domain;
    }

    return Object.values(counts)
      .sort((a, b) => b.cells - a.cells);
  }, [grid, _brands]);

  const totalClaimed = entries.reduce((s, e) => s + e.cells, 0);

  return (
    <div className="flex flex-col gap-0.5">
      {entries.length === 0 && (
        <p className="text-center py-6 text-sm" style={{ color: '#8892a4' }}>
          No brands yet — be the first!
        </p>
      )}

      {entries.map((entry, i) => {
        const pct = ((entry.cells / TOTAL_CELLS) * 100).toFixed(1);
        const isMe = selectedBrand?.name === entry.name;

        return (
          <div
            key={entry.name}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors"
            style={{
              background: isMe ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)',
              border: isMe ? `1px solid ${entry.color}40` : '1px solid transparent',
            }}
          >
            {/* Rank */}
            <span
              className="text-xs font-bold w-5 text-center flex-shrink-0"
              style={{ color: i < 3 ? '#f39c12' : '#8892a4' }}
            >
              {i + 1}
            </span>

            {/* Logo / color swatch */}
            <div
              className="w-6 h-6 rounded flex-shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold"
              style={{ background: entry.color }}
            >
              {entry.domain ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://logo.clearbit.com/${entry.domain}`}
                  alt=""
                  className="w5full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : null}
            </div>

            {/* Name + bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white truncate">{entry.name}</span>
                {isMe && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0"
                    style={{ background: entry.color, color: '#fff', fontSize: '9px' }}
                  >
                    YOU
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div
                    className="h-1 rounded-full"
                    style={{
                      background: entry.color,
                      width: `${(entry.cells / Math.max(entries[0]?.cells, 1)) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: '#8892a4' }}>
                  {entry.cells} ({pct}%)
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {totalClaimed > 0 && (
        <p className="text-center pt-2 text-xs" style={{ color: '#8892a4' }}>
          {totalClaimed} / {TOTAL_CELLS} squares claimed
        </p>
      )}
    </div>
  );
}
