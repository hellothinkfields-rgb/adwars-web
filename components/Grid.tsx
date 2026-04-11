'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  COLS, ROWS, CELL_SIZE, GAP, STEP, CANVAS_SIZE,
  GridState, Brand,
} from '@/lib/types';
import {
  neighbors4, getBrushCells, validateSelection,
  calculateConquestPrice, findConnectedComponents,
  getBoundingBox, formatUSD,
} from '@/lib/grid-utils';

interface Props {
  grid: GridState;
  brands: Brand[];
  selectedBrand: Brand | null;
  onNeedRegister: () => void;
}

type BrushSize = 1 | 2 | 3 | 5;

export default function Grid({ grid, brands, selectedBrand, onNeedRegister }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<number>>(new Set());
  const [brushSize, setBrushSize] = useState<BrushSize>(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [logoImgs, setLogoImgs] = useState<Map<string, HTMLImageElement>>(new Map());
  const [loading, setLoading] = useState(false);
  const [conquestPrice, setConquestPrice] = useState(0);

  // Build set of cells owned by selected brand
  const mySet = useMemo(() => {
    if (!selectedBrand) return new Set<number>();
    const s = new Set<number>();
    for (const [ci, cell] of Object.entries(grid)) {
      if (cell.brand_name === selectedBrand.name) s.add(Number(ci));
    }
    return s;
  }, [grid, selectedBrand]);

  // Preload logos for all brands with domains
  useEffect(() => {
    const newMap = new Map(logoImgs);
    let changed = false;
    for (const brand of brands) {
      if (brand.domain && !newMap.has(brand.domain)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = `https://logo.clearbit.com/${brand.domain}`;
        img.onload = () => setLogoImgs(m => new Map(m).set(brand.domain!, img));
        newMap.set(brand.domain, img);
        changed = true;
      }
    }
    if (changed) setLogoImgs(newMap);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands]);

  // Also preload logos from grid data (for brands loaded from DB)
  useEffect(() => {
    const domains = new Set<string>();
    for (const brand of brands) {
      if (brand.domain) domains.add(brand.domain);
    }
    // nothing extra needed — covered above
  }, [brands]);

  // Recalculate conquest price when selection changes
  useEffect(() => {
    if (selectedCells.size === 0) { setConquestPrice(0); return; }
    setConquestPrice(calculateConquestPrice(Array.from(selectedCells), grid));
  }, [selectedCells, grid]);

  function cellFromEvent(e: React.MouseEvent<HTMLCanvasElement>): number | null {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const scale = CANVAS_SIZE / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    const col = Math.floor(x / STEP);
    const row = Math.floor(y / STEP);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
    // Check if click is inside cell (not on gap)
    if ((x % STEP) >= CELL_SIZE || (y % STEP) >= CELL_SIZE) return null;
    return row * COLS + col;
  }

  function getRectSelection(start: number, end: number): number[] {
    const sc = start % COLS, sr = Math.floor(start / COLS);
    const ec = end % COLS, er = Math.floor(end / COLS);
    const cells: number[] = [];
    for (let r = Math.min(sr, er); r <= Math.max(sr, er); r++)
      for (let c = Math.min(sc, ec); c <= Math.max(sc, ec); c++)
        cells.push(r * COLS + c);
    return cells;
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const ci = cellFromEvent(e);
    setHoveredCell(ci);

    if (isDragging && dragStart !== null && ci !== null) {
      const rect = getRectSelection(dragStart, ci);
      const valid = validateSelection(rect, mySet, grid, selectedBrand?.name ?? '');
      setSelectedCells(new Set(valid));
    }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const ci = cellFromEvent(e);
    if (ci === null) return;

    if (e.shiftKey) {
      // Shift+click: rectangle drag mode
      setIsDragging(true);
      setDragStart(ci);
    } else {
      // Normal click: brush mode
      const brushCells = getBrushCells(ci, brushSize);
      const valid = validateSelection(brushCells, mySet, grid, selectedBrand?.name ?? '');
      if (valid.length > 0) {
        setSelectedCells(prev => {
          const next = new Set(prev);
          // Toggle: if all are selected, deselect; else add
          const allSelected = valid.every(c => next.has(c));
          if (allSelected) valid.forEach(c => next.delete(c));
          else valid.forEach(c => next.add(c));
          return next;
        });
      }
    }
  }

  function handleMouseUp() {
    setIsDragging(false);
    setDragStart(null);
  }

  function handleMouseLeave() {
    setHoveredCell(null);
    setIsDragging(false);
  }

  // ─── Canvas rendering ───────────────────────────────────────────────────────

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid lines (subtle)
    ctx.fillStyle = '#111128';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * STEP;
        const y = r * STEP;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }

    // Draw claimed cells
    for (const [ciStr, cell] of Object.entries(grid)) {
      const ci = Number(ciStr);
      const col = ci % COLS;
      const row = Math.floor(ci / COLS);
      ctx.fillStyle = cell.color;
      ctx.fillRect(col * STEP, row * STEP, CELL_SIZE, CELL_SIZE);
    }

    // Draw my territory border
    for (const ci of mySet) {
      const col = ci % COLS;
      const row = Math.floor(ci / COLS);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(col * STEP + 0.5, row * STEP + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
    }

    // Draw selected cells
    for (const ci of selectedCells) {
      const col = ci % COLS;
      const row = Math.floor(ci / COLS);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(col * STEP, row * STEP, CELL_SIZE, CELL_SIZE);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(col * STEP + 0.75, row * STEP + 0.75, CELL_SIZE - 1.5, CELL_SIZE - 1.5);
    }

    // Draw brush preview on hover
    if (hoveredCell !== null && !isDragging) {
      const brushCells = getBrushCells(hoveredCell, brushSize);
      const noTerritory = mySet.size === 0;
      const touchesTerr = noTerritory || brushCells.some(bi =>
        neighbors4(bi).some(ni => mySet.has(ni))
      );

      for (const bi of brushCells) {
        const col = bi % COLS;
        const row = Math.floor(bi / COLS);
        if (mySet.has(bi)) {
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
        } else if (touchesTerr) {
          ctx.fillStyle = grid[bi] ? 'rgba(192,57,43,0.5)' : 'rgba(29,185,84,0.5)';
        } else {
          ctx.fillStyle = 'rgba(255,100,100,0.15)';
        }
        ctx.fillRect(col * STEP, row * STEP, CELL_SIZE, CELL_SIZE);

        ctx.strokeStyle = touchesTerr
          ? (mySet.has(bi) ? 'rgba(255,255,255,0.4)' : (grid[bi] ? '#C0392B' : '#1DB954'))
          : 'rgba(255,80,80,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(col * STEP + 0.5, row * STEP + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
      }

      // Outer dashed border around brush
      if (brushCells.length > 0) {
        const bb = getBoundingBox(brushCells, STEP);
        ctx.strokeStyle = touchesTerr ? 'rgba(255,255,255,0.8)' : 'rgba(255,80,80,0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(bb.x + 1, bb.y + 1, bb.w - 2, bb.h - 2);
        ctx.setLineDash([]);
      }
    }

    // Draw drag rectangle preview
    if (isDragging && dragStart !== null && hoveredCell !== null) {
      const rect = getRectSelection(dragStart, hoveredCell);
      const bb = getBoundingBox(rect, STEP);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(bb.x + 1, bb.y + 1, bb.w - 2, bb.h - 2);
      ctx.setLineDash([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, mySet, selectedCells, hoveredCell, brushSize, isDragging, dragStart]);

  useEffect(() => {
    drawFrame();
  }, [drawFrame]);

  // Logo overlays (positioned absolutely over canvas)
  const logoOverlays = useMemo(() => {
    const components = findConnectedComponents(grid);
    const domainMap = new Map<string, string | null>();
    for (const b of brands) domainMap.set(b.name, b.domain);

    return components.map((comp, idx) => {
      const domain = domainMap.get(comp.brandName);
      const img = domain ? logoImgs.get(domain) : null;
      if (!img || !img.complete || img.naturalWidth === 0) return null;

      const bb = getBoundingBox(comp.cells, STEP);
      const size = Math.min(bb.w - 4, bb.h - 4, 48);
      if (size < 12) return null;

      // Scale from canvas coords to container coords
      // We'll use percentage since the canvas is responsive
      const scalePct = 100 / CANVAS_SIZE;

      return (
        <img
          key={`logo-${comp.brandName}-${idx}`}
          src={img.src}
          alt={comp.brandName}
          style={{
            position: 'absolute',
            left: `${(bb.x + bb.w / 2 - size / 2) * scalePct}%`,
            top: `${(bb.y + bb.h / 2 - size / 2) * scalePct}%`,
            width: `${size * scalePct}%`,
            height: `${size * scalePct}%`,
            objectFit: 'contain',
            pointerEvents: 'none',
            imageRendering: 'auto',
            filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))',
          }}
        />
      );
    }).filter(Boolean);
  }, [grid, brands, logoImgs]);

  // ─── Conquest handler ───────────────────────────────────────────────────────

  async function handleConquer() {
    if (!selectedBrand) { onNeedRegister(); return; }
    if (selectedCells.size === 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: selectedBrand.id,
          brandName: selectedBrand.name,
          cells: Array.from(selectedCells),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      alert('Failed to start checkout. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const validSelected = useMemo(
    () => validateSelection(Array.from(selectedCells), mySet, grid, selectedBrand?.name ?? ''),
    [selectedCells, mySet, grid, selectedBrand]
  );

  return (
    <div className="flex flex-col gap-4">

      {/* Brush controls */}
      <div className="flex items-center gap-2.5 flex-wrap px-3 py-2.5 rounded-xl border border-white/[0.07] bg-[#0a0f1e]">
        <span className="text-xs font-medium text-white/35 flex-shrink-0">Brush size</span>
        <div className="flex gap-1.5">
          {([1, 2, 3, 5] as BrushSize[]).map(s => (
            <button
              key={s}
              onClick={() => setBrushSize(s)}
              className="w-10 h-7 rounded-md text-xs font-bold transition-all"
              style={{
                background: brushSize === s ? (selectedBrand?.color ?? '#C0392B') : 'rgba(255,255,255,0.06)',
                color: brushSize === s ? '#fff' : 'rgba(255,255,255,0.35)',
              }}
            >
              {s}×{s}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-white/20 hidden sm:block">
          Shift+drag to rectangle-select
        </span>
        {selectedCells.size > 0 && (
          <button
            onClick={() => setSelectedCells(new Set())}
            className="ml-auto text-xs px-2.5 py-1 rounded-md bg-white/[0.05] text-white/35 hover:text-white/60 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Canvas wrapper */}
      <div
        ref={containerRef}
        className="relative w-full rounded-xl overflow-hidden border border-white/[0.07]"
        style={{ aspectRatio: '1', maxWidth: CANVAS_SIZE }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="w-full h-full cursor-crosshair"
          style={{ imageRendering: 'pixelated' }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {logoOverlays}
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredCell !== null && grid[hoveredCell] && (
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40">
          <span
            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ background: grid[hoveredCell].color }}
          />
          <span>
            <span className="text-white font-semibold">{grid[hoveredCell].brand_name}</span>
            {' · '}paid {formatUSD(grid[hoveredCell].price_paid)}
            {' · '}conquer for{' '}
            <span className="text-[#C0392B] font-semibold">
              {formatUSD(Math.max(1, grid[hoveredCell].price_paid * 1.5))}
            </span>
          </span>
        </div>
      )}

      {/* Conquest bar */}
      {selectedCells.size > 0 && (
        <div className="rounded-xl border border-white/[0.09] bg-[#0a0f1e] p-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <div className="text-2xl font-black text-white tabular-nums">
                {formatUSD(conquestPrice)}
              </div>
              <div className="text-xs text-white/35 mt-0.5">
                {validSelected.length} square{validSelected.length !== 1 ? 's' : ''} selected
              </div>
            </div>
            <button
              onClick={handleConquer}
              disabled={loading || validSelected.length === 0}
              className="px-6 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-40 flex-shrink-0 shadow-lg"
              style={{
                background: selectedBrand?.color ?? '#C0392B',
                boxShadow: `0 4px 20px ${(selectedBrand?.color ?? '#C0392B')}40`,
              }}
            >
              {loading ? 'Redirecting…' : selectedBrand ? '⚔️ Conquer' : 'Register & Conquer'}
            </button>
          </div>
          <div className="flex gap-3 text-[11px] text-white/25 border-t border-white/[0.06] pt-3">
            <span>30% refunded to owners</span>
            <span>·</span>
            <span className="text-emerald-400/60">35% to charity</span>
            <span>·</span>
            <span>35% platform</span>
          </div>
        </div>
      )}
    </div>
  );
}
