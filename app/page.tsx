'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Brand, GridState, Stats, CellData } from '@/lib/types';
import Grid from '@/components/Grid';
import Leaderboard from '@/components/Leaderboard';
import BrandModal from '@/components/BrandModal';
import StatsBar from '@/components/StatsBar';
import AuthModal from '@/components/AuthModal';
import type { User } from '@supabase/supabase-js';

const BRAND_STORAGE_KEY = 'adwars_brand_id';

export default function HomePage() {
  const [grid, setGrid] = useState<GridState>({});
  const [brands, setBrands] = useState<Brand[]>([]);
  const [stats, setStats] = useState<Stats>({ total_charity_donated: 0, total_volume: 0, total_transactions: 0 });
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'leaderboard' | 'howto'>('leaderboard');
  const [liveCount, setLiveCount] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadGrid = useCallback(async () => {
    const { data } = await supabase.from('grid_cells').select('cell_id, brand_id, brand_name, color, price_paid');
    if (data) {
      const state: GridState = {};
      for (const row of data) {
        state[row.cell_id] = { brand_id: row.brand_id, brand_name: row.brand_name, color: row.color, price_paid: row.price_paid } as CellData;
      }
      setGrid(state);
    }
  }, []);

  const loadBrands = useCallback(async () => {
    const { data } = await supabase.from('brands').select('*').order('created_at', { ascending: true });
    if (data) setBrands(data as Brand[]);
  }, []);

  const loadStats = useCallback(async () => {
    const { data } = await supabase.from('stats').select('*').single();
    if (data) setStats(data as Stats);
  }, []);

  useEffect(() => {
    loadGrid(); loadBrands(); loadStats();
  }, [loadGrid, loadBrands, loadStats]);

  // Restore brand from localStorage or user account
  useEffect(() => {
    if (brands.length === 0) return;
    // Try to restore from user account first
    if (user) {
      const userBrand = brands.find(b => b.user_id === user.id);
      if (userBrand) { setSelectedBrand(userBrand); return; }
    }
    // Fall back to localStorage
    const savedId = localStorage.getItem(BRAND_STORAGE_KEY);
    if (savedId) {
      const found = brands.find(b => b.id === savedId);
      if (found) setSelectedBrand(found);
    }
  }, [brands, user]);

  // Real-time subscriptions
  useEffect(() => {
    const presenceChannel = supabase.channel('presence');
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        setLiveCount(Object.keys(presenceChannel.presenceState()).length);
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') await presenceChannel.track({ online_at: new Date().toISOString() });
      });

    const gridChannel = supabase.channel('grid-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grid_cells' }, payload => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const row = payload.new as { cell_id: number; brand_id: string; brand_name: string; color: string; price_paid: number };
          setGrid(prev => ({ ...prev, [row.cell_id]: { brand_id: row.brand_id, brand_name: row.brand_name, color: row.color, price_paid: row.price_paid } }));
        }
        if (payload.eventType === 'DELETE') {
          setGrid(prev => { const next = { ...prev }; delete next[(payload.old as { cell_id: number }).cell_id]; return next; });
        }
      }).subscribe();

    const statsChannel = supabase.channel('stats-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stats' }, payload => setStats(payload.new as Stats))
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

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSelectedBrand(null);
    localStorage.removeItem(BRAND_STORAGE_KEY);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a1a' }}>

      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tight text-white">
              ⚔️ <span style={{ color: '#C0392B' }}>AD</span> WARS
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(192,57,43,0.2)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.3)' }}>
              LIVE
            </span>
          </div>
          <Link href="/charity" className="hidden sm:block text-xs font-medium transition-colors" style={{ color: '#8892a4' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#2ecc71')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8892a4')}
          >
            ♥ Charity
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: '#8892a4' }}>
            <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            {liveCount} watching
          </div>

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-xs truncate max-w-[120px]" style={{ color: '#8892a4' }}>{user.email}</span>
              <button onClick={handleSignOut} className="text-xs px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)', color: '#8892a4' }}>
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
              Log In
            </button>
          )}

          {/* Brand */}
          {selectedBrand ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold" style={{ background: selectedBrand.color + '22', border: `1px solid ${selectedBrand.color}44`, color: selectedBrand.color }}>
                <span className="w-2 h-2 rounded-full" style={{ background: selectedBrand.color }} />
                <span className="max-w-[100px] truncate">{selectedBrand.name}</span>
              </div>
              <button onClick={() => setShowBrandModal(true)} className="text-xs px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)', color: '#8892a4' }}>
                Switch
              </button>
            </div>
          ) : (
            <button onClick={() => setShowBrandModal(true)} className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90" style={{ background: '#C0392B' }}>
              Register Brand
            </button>
          )}
        </div>
      </header>

      {/* Banner */}
      {banner && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-xl pointer-events-none" style={{ background: '#C0392B' }}>
          {banner}
        </div>
      )}

      {/* Stats */}
      <div className="px-4 sm:px-6 pt-4 pb-2 flex-shrink-0">
        <StatsBar stats={stats} />
      </div>

      {/* Main — grid centered, sidebar right */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 px-4 sm:px-6 py-4 max-w-[1800px] mx-auto w-full">

        {/* Grid — takes all available space, centered */}
        <div className="flex-1 flex items-start justify-center min-w-0">
          <div className="w-full max-w-4xl">
            <Grid
              grid={grid}
              brands={brands}
              selectedBrand={selectedBrand}
              onNeedRegister={() => setShowBrandModal(true)}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-72 xl:w-80 flex-shrink-0 rounded-2xl overflow-hidden self-start" style={{ background: '#0e1628', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            {(['leaderboard', 'howto'] as const).map(tab => (
              <button key={tab} onClick={() => setSidebarTab(tab)}
                className="flex-1 py-3 text-sm font-semibold transition-colors"
                style={{ color: sidebarTab === tab ? '#fff' : '#8892a4', borderBottom: sidebarTab === tab ? '2px solid #C0392B' : '2px solid transparent' }}
              >
                {tab === 'leaderboard' ? 'Leaderboard' : 'How It Works'}
              </button>
            ))}
          </div>
          <div className="p-4 overflow-y-auto" style={{ maxHeight: '75vh' }}>
            {sidebarTab === 'leaderboard' ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white">Territory Control</h2>
                  <button onClick={() => setShowBrandModal(true)} className="text-xs px-2.5 py-1 rounded-lg font-semibold" style={{ background: 'rgba(192,57,43,0.2)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.3)' }}>
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
      </main>

      {/* Modals */}
      {showBrandModal && (
        <BrandModal
          onClose={() => setShowBrandModal(false)}
          onRegister={handleRegister}
          userId={user?.id}
        />
      )}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}

function HowItWorks() {
  return (
    <div className="space-y-4 text-sm" style={{ color: '#8892a4' }}>
      {[
        { icon: '⚔️', title: 'Claim Territory', body: 'Register your brand and pay to claim squares on the 64×64 grid. First squares go anywhere.' },
        { icon: '🗺️', title: 'Expand Your Empire', body: 'After your first claim, you can only expand into squares adjacent to your existing territory.' },
        { icon: '⚡', title: 'Conquer Others', body: 'Pay 1.5× what someone paid to take their squares. They get 30% back automatically.' },
        { icon: '♥', title: '35% to Charity', body: 'Every conquest donates 35% to charity. Fight more, give more.' },
      ].map(s => (
        <div key={s.title}>
          <h3 className="text-white font-semibold mb-1">{s.icon} {s.title}</h3>
          <p>{s.body}</p>
        </div>
      ))}
      <div>
        <h3 className="text-white font-semibold mb-1">💰 Pricing</h3>
        <ul className="space-y-0.5 text-xs">
          <li>Empty square: <span className="text-white">$1.00</span></li>
          <li>Owned square: <span className="text-white">1.5× what was paid</span></li>
          <li>On conquest: 30% refund · <span style={{ color: '#2ecc71' }}>35% charity</span> · 35% platform</li>
        </ul>
      </div>
      <div className="pt-2">
        <Link href="/charity" className="text-xs font-semibold" style={{ color: '#2ecc71' }}>
          View charity dashboard →
        </Link>
      </div>
    </div>
  );
}
