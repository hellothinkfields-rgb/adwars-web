'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Brand, GridState, Stats, CellData } from '@/lib/types';
import { formatUSD } from '@/lib/grid-utils';
import Grid from '@/components/Grid';
import Leaderboard from '@/components/Leaderboard';
import BrandModal from '@/components/BrandModal';
import StatsBar from '@/components/StatsBar';

const BRAND_STORAGE_KEY = 'adwars_brand_id';

export default function HomePage() {
  const [grid, setGrid] = useState<GridState>({});
  const [brands, setBrands] = useState<Brand[]>([]);
  const [stats, setStats] = useState<Stats>({ total_charity_donated: 0, total_volume: 0, total_transactions: 0 });
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'leaderboard' | 'howto'>('leaderboard');
  const [liveCount, setLiveCount] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);

  const loadGrid = useCallback(async () => {
    const { data } = await supabase
      .from('grid_cells')
      .select('cell_id, brand_id, brand_name, color, price_paid');
    if (data) {
      const state: GridState = {};
      for (const row of data) {
        state[row.cell_id] = {
          brand_id: row.brand_id,
          brand_name: row.brand_name,
          color: row.color,
          price_paid: row.price_paid,
        } as CellData;
      }
      setGrid(state);
    }
  }, []);

  const loadBrands = useCallback(async () => {
    const { data } = await supabase
      .from('brands')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setBrands(data as Brand[]);
  }, []);

  const loadStats = useCallback(async () => {
    const { data } = await supabase.from('stats').select('*').single();
    if (data) setStats(data as Stats);
  }, []);

  useEffect(() => {
    loadGrid();
    loadBrands();
    loadStats();
  }, [loadGrid, loadBrands, loadStats]);

  useEffect(() => {
    const savedId = localStorage.getItem(BRAND_STORAGE_KEY);
    if (savedId && brands.length > 0) {
      const found = brands.find(b => b.id === savedId);
      if (found) setSelectedBrand(found);
    }
  }, [brands]);

  useEffect(() => {
    const presenceChannel = supabase.channel('presence');
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setLiveCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

    const gridChannel = supabase
      .channel('grid-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'grid_cells' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new as {
              cell_id: number; brand_id: string; brand_name: string;
              color: string; price_paid: number;
            };
            setGrid(prev => ({
              ...prev,
              [row.cell_id]: {
                brand_id: row.brand_id,
                brand_name: row.brand_name,
                color: row.color,
                price_paid: row.price_paid,
              },
            }));
          }
          if (payload.eventType === 'DELETE') {
            setGrid(prev => {
              const next = { ...prev };
              delete next[(payload.old as { cell_id: number }).cell_id];
              return next;
            });
          }
        }
      )
      .subscribe();

    const statsChannel = supabase
      .channel('stats-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'stats' },
        (payload) => setStats(payload.new as Stats)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(gridChannel);
      supabase.removeChannel(statsChannel);
    };
  }, []);

  function handleRegister(brand: Brand) {
    setBrands(prev => [...prev.filter(b => b.id !== brand.id), brand]);
    setSelectedBrand(brand);
    localStorage.setItem(BRAND_STORAGE_KEY, brand.id);
    showBannerMsg(`⚔️ ${brand.name} has entered the battlefield!`);
    setSidebarTab('leaderboard');
  }

  function showBannerMsg(msg: string) {
    setBanner(msg);
    setTimeout(() => setBanner(null), 4000);
  }

  return (
    <div className="min-h-screen bg-[#050510] text-white">

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#050510]/95 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <h1 className="text-xl font-black tracking-tight">
              ⚔️ <span className="text-[#C0392B]">AD</span> WARS
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C0392B]/15 text-[#C0392B] border border-[#C0392B]/30 tracking-wider">
              LIVE
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/35">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block pulse-dot" />
              {liveCount} watching
            </div>

            {selectedBrand ? (
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold"
                  style={{
                    background: selectedBrand.color + '1a',
                    border: `1px solid ${selectedBrand.color}40`,
                    color: selectedBrand.color,
                  }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: selectedBrand.color }} />
                  <span className="max-w-[120px] truncate">{selectedBrand.name}</span>
                </div>
                <button
                  onClick={() => setShowBrandModal(true)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-white/[0.05] text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
                >
                  Switch
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowBrandModal(true)}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#C0392B] hover:bg-[#a93226] transition-colors shadow-lg shadow-[#C0392B]/20"
              >
                Register Brand
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Conquest banner */}
      {banner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-[#C0392B] shadow-xl shadow-[#C0392B]/25 whitespace-nowrap pointer-events-none">
          {banner}
        </div>
      )}

      {/* Stats */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <StatsBar stats={stats} />
      </div>

      {/* Main layout */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Grid */}
          <div className="flex-1 min-w-0">
            <Grid
              grid={grid}
              brands={brands}
              selectedBrand={selectedBrand}
              onNeedRegister={() => setShowBrandModal(true)}
            />
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 rounded-2xl overflow-hidden border border-white/[0.07] bg-[#0a0f1e]">
            {/* Tabs */}
            <div className="flex border-b border-white/[0.07]">
              {(['leaderboard', 'howto'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSidebarTab(tab)}
                  className="flex-1 py-3.5 text-sm font-semibold transition-colors"
                  style={{
                    color: sidebarTab === tab ? '#fff' : 'rgba(255,255,255,0.3)',
                    borderBottom: sidebarTab === tab ? '2px solid #C0392B' : '2px solid transparent',
                  }}
                >
                  {tab === 'leaderboard' ? 'Leaderboard' : 'How It Works'}
                </button>
              ))}
            </div>

            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              {sidebarTab === 'leaderboard' ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-white">Territory Control</h2>
                    <button
                      onClick={() => setShowBrandModal(true)}
                      className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-[#C0392B]/15 text-[#C0392B] border border-[#C0392B]/25 hover:bg-[#C0392B]/25 transition-colors"
                    >
                      + Register
                    </button>
                  </div>
                  <Leaderboard grid={grid} brands={brands} selectedBrand={selectedBrand} />
                </>
              ) : (
                <HowItWorks />
              )}
            </div>
          </div>
        </div>
      </main>

      <BrandModal
        open={showBrandModal}
        onClose={() => setShowBrandModal(false)}
        onRegister={handleRegister}
      />
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: '⚔️',
      title: 'Claim Territory',
      desc: 'Register your brand and pay to claim squares on the 64×64 grid. Your first squares can go anywhere.',
    },
    {
      icon: '🗺️',
      title: 'Expand Your Empire',
      desc: 'After your first claim, you can only expand into squares adjacent to your existing territory.',
    },
    {
      icon: '⚡',
      title: 'Conquer Others',
      desc: 'Pay 1.5× what someone paid to conquer their squares. They get 30% back automatically.',
    },
    {
      icon: '♥',
      title: '35% to Charity',
      desc: 'Every conquest donates 35% to charity. The more brands fight, the more good gets done.',
    },
  ];

  return (
    <div className="space-y-5">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3">
          <span className="text-xl flex-shrink-0 mt-0.5 w-7 text-center">{step.icon}</span>
          <div>
            <h3 className="text-sm font-semibold text-white mb-0.5">{step.title}</h3>
            <p className="text-xs text-white/35 leading-relaxed">{step.desc}</p>
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 text-xs">
        <div className="font-semibold text-white/50 mb-2.5">Pricing breakdown</div>
        <div className="space-y-1.5">
          {[
            ['Empty square', '$1.00', 'text-white'],
            ['Owned square', '1.5× paid', 'text-white'],
            ['To previous owner', '30%', 'text-white'],
            ['To charity', '35%', 'text-emerald-400'],
            ['Platform', '35%', 'text-white'],
          ].map(([label, value, cls]) => (
            <div key={label} className="flex justify-between text-white/35">
              <span>{label}</span>
              <span className={cls}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
