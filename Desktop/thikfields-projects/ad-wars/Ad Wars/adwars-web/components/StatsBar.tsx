'use client';

import { Stats } from '@/lib/types';
import { formatUSD } from '@/lib/grid-utils';

interface Props {
  stats: Stats;
}

export default function StatsBar({ stats }: Props) {
  const metrics = [
    {
      label: 'Donated to Charity',
      value: formatUSD(stats.total_charity_donated),
      valueColor: '#2ecc71',
      sublabel: '35% of every conquest',
    },
    {
      label: 'Battlefield Spend',
      value: formatUSD(stats.total_volume),
      valueColor: '#fff',
      sublabel: 'Total volume',
    },
    {
      label: 'Total Conquests',
      value: stats.total_transactions.toLocaleString(),
      valueColor: '#fff',
      sublabel: 'Battles fought',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {metrics.map((m, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/[0.07] bg-[#0a0f1e] px-4 py-4 sm:px-6 sm:py-5 text-center"
        >
          <p
            className="text-xl sm:text-2xl lg:text-3xl font-black tabular-nums"
            style={{ color: m.valueColor }}
          >
            {m.value}
          </p>
          <p className="text-xs font-medium text-white/50 mt-1">{m.label}</p>
          <p className="text-[10px] text-white/20 mt-0.5 hidden sm:block">{m.sublabel}</p>
        </div>
      ))}
    </div>
  );
}
