'use client';

import { Stats } from '@/lib/types';
import { formatUSD } from '@/lib/grid-utils';

interface Props {
  stats: Stats;
}

export default function StatsBar({ stats }: Props) {
  return (
    <div
      className="flex items-center justify-center gap-6 px-6 py-3 rounded-xl text-center flex-wrap"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div>
        <p className="text-lg font-bold" style={{ color: '#2ecc71' }}>
          {formatUSD(stats.total_charity_donated)}
        </p>
        <p className="text-xs" style={{ color: '#8892a4' }}>Donated to charity</p>
      </div>
      <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.1)' }} />
      <div>
        <p className="text-lg font-bold text-white">{formatUSD(stats.total_volume)}</p>
        <p className="text-xs" style={{ color: '#8892a4' }}>Total battlefield spend</p>
      </div>
      <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.1)' }} />
      <div>
        <p className="text-lg font-bold text-white">{stats.total_transactions.toLocaleString()}</p>
        <p className="text-xs" style={{ color: '#8892a4' }}>Conquests</p>
      </div>
    </div>
  );
}
