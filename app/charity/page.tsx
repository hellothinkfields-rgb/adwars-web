'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Brand, Stats } from '@/lib/types';

interface BrandRow {
  brand: Brand;
  charity_total: number;
  cells_owned: number;
}

export default function CharityPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: statsData }, { data: brandsData }, { data: txData }, { data: gridData }] = await Promise.all([
        supabase.from('stats').select('*').single(),
        supabase.from('brands').select('*').order('created_at', { ascending: true }),
        supabase.from('transactions').select('brand_name, charity_amount'),
        supabase.from('grid_cells').select('brand_id'),
      ]);

      if (statsData) setStats(statsData as Stats);

      if (brandsData) {
        const charityByBrand: Record<string, number> = {};
        for (const tx of (txData ?? [])) {
          charityByBrand[tx.brand_name] = (charityByBrand[tx.brand_name] ?? 0) + (tx.charity_amount ?? 0);
        }
        const cellsByBrand: Record<string, number> = {};
        for (const cell of (gridData ?? [])) {
          cellsByBrand[cell.brand_id] = (cellsByBrand[cell.brand_id] ?? 0) + 1;
        }
        const result: BrandRow[] = (brandsData as Brand[]).map(brand => ({
          brand,
          charity_total: charityByBrand[brand.name] ?? 0,
          cells_owned: cellsByBrand[brand.id] ?? 0,
        })).sort((a, b) => b.charity_total - a.charity_total);
        setRows(result);
      }
      setLoading(false);
    }
    load();
  }, []);

  const totalDonated = stats?.total_charity_donated ?? 0;

  return (
    <div className="min-h-screen" style={{ background: '#0a0a1a' }}>
      {/* Header */}
      <header className="flex items-center gap-4 px-4 sm:px-6 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <Link href="/" className="text-xl font-black tracking-tight text-white transition-opacity hover:opacity-80">
          ⚔️ <span style={{ color: '#C0392B' }}>AD</span> WARS
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
        <span className="text-sm font-semibold" style={{ color: '#8892a4' }}>Charity Dashboard</span>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ background: 'rgba(46,204,113,0.1)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.2)' }}>
            ♥ Real money, real impact
          </div>
          <div className="text-6xl font-black text-white mb-2">
            ${totalDonated.toFixed(2)}
          </div>
          <div className="text-sm font-medium" style={{ color: '#8892a4' }}>Total donated to charity</div>
          <p className="mt-3 text-sm max-w-md mx-auto leading-relaxed" style={{ color: '#8892a4' }}>
            35% of every conquest on the Ad Wars grid goes directly to charity.
            Brands can nominate their own charity when registering.
          </p>
          <Link href="/" className="mt-5 inline-block px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#C0392B' }}>
            ⚔️ Join the Battle
          </Link>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 text-sm" style={{ color: '#8892a4' }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: '#0e1628', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-sm" style={{ color: '#8892a4' }}>No brands have registered yet. Be the first!</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#0e1628', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <h2 className="text-sm font-bold text-white">Brand Contributions</h2>
              <span className="text-xs" style={{ color: '#8892a4' }}>{rows.length} brand{rows.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8892a4' }}>#</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8892a4' }}>Brand</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8892a4' }}>Supporting</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8892a4' }}>Squares</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8892a4' }}>Raised</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ brand, charity_total, cells_owned }, i) => (
                    <tr key={brand.id} className="border-b last:border-0 transition-colors hover:bg-white/[0.02]" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="px-5 py-4 text-sm" style={{ color: '#8892a4' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: brand.color }} />
                          <span className="text-sm font-semibold text-white">{brand.name}</span>
                          {brand.domain && (
                            <img
                              src={`https://logo.clearbit.com/${brand.domain}`}
                              alt=""
                              className="w-4 h-4 rounded-sm object-contain"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {brand.charity_name ? (
                          brand.charity_url ? (
                            <a href={brand.charity_url} target="_blank" rel="noopener noreferrer"
                              className="text-sm hover:underline underline-offset-2"
                              style={{ color: '#2ecc71' }}>
                              {brand.charity_name}
                            </a>
                          ) : (
                            <span className="text-sm" style={{ color: '#2ecc71' }}>{brand.charity_name}</span>
                          )
                        ) : (
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Not set</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm text-white">{cells_owned.toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-bold" style={{ color: charity_total > 0 ? '#2ecc71' : 'rgba(255,255,255,0.25)' }}>
                          ${charity_total.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-center text-xs mt-8" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Charity amounts reflect 35% of all completed conquests. Payouts processed monthly.
        </p>
      </main>
    </div>
  );
}
