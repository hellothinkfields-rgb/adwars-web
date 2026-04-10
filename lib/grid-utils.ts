import { COLS, ROWS, TOTAL_CELLS, GridState, BASE_PRICE, CONQUEST_MULTIPLIER } from './types';

export function neighbors4(ci: number): number[] {
  const col = ci % COLS;
  const row = Math.floor(ci / COLS);
  const ns: number[] = [];
  if (row > 0) ns.push(ci - COLS);
  if (row < ROWS - 1) ns.push(ci + COLS);
  if (col > 0) ns.push(ci - 1);
  if (col < COLS - 1) ns.push(ci + 1);
  return ns;
}

export function getBrushCells(pivot: number, size: number): number[] {
  const col = pivot % COLS;
  const row = Math.floor(pivot / COLS);
  const half = Math.floor(size / 2);
  const r0 = Math.max(0, Math.min(row - half, ROWS - size));
  const c0 = Math.max(0, Math.min(col - half, COLS - size));
  const cells: number[] = [];
  for (let r = r0; r < r0 + size && r < ROWS; r++)
    for (let c = c0; c < c0 + size && c < COLS; c++)
      cells.push(r * COLS + c);
  return cells;
}

export function validateSelection(selCells: number[], mySet: Set<number>, grid: GridState, brandName: string): number[] {
  const noTerritory = mySet.size === 0;
  const touchesTerr = noTerritory || selCells.some(ci => neighbors4(ci).some(ni => mySet.has(ni)));
  if (!touchesTerr) return [];
  return selCells.filter(ci => {
    if (mySet.has(ci)) return false;
    const cell = grid[ci];
    return !cell || cell.brand_name !== brandName;
  });
}

export function calculateConquestPrice(cells: number[], grid: GridState): number {
  return cells.reduce((total, ci) => {
    const e = grid[ci];
    return total + (!e ? BASE_PRICE : Math.max(BASE_PRICE, e.price_paid * CONQUEST_MULTIPLIER));
  }, 0);
}

export function findConnectedComponents(grid: GridState) {
  const visited = new Set<number>();
  const comps: Array<{ brandName: string; color: string; cells: number[] }> = [];
  for (let ci = 0; ci < TOTAL_CELLS; ci++) {
    if (visited.has(ci) || !grid[ci]) continue;
    const { brand_name, color } = grid[ci];
    const comp: number[] = [];
    const q = [ci];
    while (q.length) {
      const cur = q.shift()!;
      if (visited.has(cur)) continue;
      const cell = grid[cur];
      if (!cell || cell.brand_name !== brand_name) continue;
      visited.add(cur); comp.push(cur);
      for (const n of neighbors4(cur)) q.push(n);
    }
    if (comp.length > 0) comps.push({ brandName: brand_name, color, cells: comp });
  }
  return comps;
}

export function getBoundingBox(cells: number[], step: number) {
  let minCol = COLS, maxCol = -1, minRow = ROWS, maxRow = -1;
  for (const ci of cells) {
    const col = ci % COLS, row = Math.floor(ci / COLS);
    if (col < minCol) minCol = col;
    if (col > maxCol) maxCol = col;
    if (row < minRow) minRow = row;
    if (row > maxRow) maxRow = row;
  }
  return { x: minCol * step, y: minRow * step, w: (maxCol - minCol + 1) * step, h: (maxRow - minRow + 1) * step };
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);
}

export function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#111111' : '#ffffff';
}
