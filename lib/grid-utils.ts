import { COLS, ROWS, TOTAL_CELLS, GridState, BASE_PRICE, CONQUEST_MULTIPLIER } from './types';

/** 4-directional neighbours of a cell (clamped to grid bounds) */
export function neighbors4(ci: number): number[] {
  const col = ci % COLS;
  const row = Math.floor(ci / COLS);
  const ns: number[] = [];
  if (row > 0)        ns.push(ci - COLS);
  if (row < ROWS - 1) ns.push(ci + COLS);
  if (col > 0)        ns.push(ci - 1);
  if (col < COLS - 1) ns.push(ci + 1);
  return ns;
}

/** Return the set of cells covered by a brush of given size centred on pivot */
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

/** Find all cells reachable from `start` within `selection` (BFS) */
export function connectedInSelection(start: number, selection: Set<number>): Set<number> {
  const visited = new Set<number>();
  const queue = [start];
  while (queue.length) {
    const ci = queue.shift()!;
    if (visited.has(ci)) continue;
    visited.add(ci);
    for (const n of neighbors4(ci)) {
      if (selection.has(n) && !visited.has(n)) queue.push(n);
    }
  }
  return visited;
}

/**
 * Validate a proposed selection for a brand.
 * Returns the subset of cells that are actually conquerable
 * (not already owned by brand, and the group touches the brand's territory).
 */
export function validateSelection(
  selCells: number[],
  mySet: Set<number>,
  grid: GridState,
  brandName: string
): number[] {
  const noTerritory = mySet.size === 0;
  const selSet = new Set(selCells);

  // Does the selection touch my territory?
  const touchesTerr = noTerritory || selCells.some(ci =>
    neighbors4(ci).some(ni => mySet.has(ni))
  );

  if (!touchesTerr) return [];

  return selCells.filter(ci => {
    if (mySet.has(ci)) return false;
    const cell = grid[ci];
    return !cell || cell.brand_name !== brandName;
  });
}

/** Calculate the price to conquer a set of cells */
export function calculateConquestPrice(cells: number[], grid: GridState): number {
  return cells.reduce((total, ci) => {
    const existing = grid[ci];
    if (!existing) return total + BASE_PRICE;
    return total + Math.max(BASE_PRICE, existing.price_paid * CONQUEST_MULTIPLIER);
  }, 0);
}

/**
 * Find all connected components for logo rendering.
 * Returns array of { brandName, color, cells[] } groups.
 */
export function findConnectedComponents(grid: GridState): Array<{
  brandName: string;
  color: string;
  cells: number[];
}> {
  const visited = new Set<number>();
  const components: Array<{ brandName: string; color: string; cells: number[] }> = [];

  for (let ci = 0; ci < TOTAL_CELLS; ci++) {
    if (visited.has(ci) || !grid[ci]) continue;
    const { brand_name, color } = grid[ci];
    const component: number[] = [];
    const queue = [ci];
    while (queue.length) {
      const cur = queue.shift()!;
      if (visited.has(cur)) continue;
      const cell = grid[cur];
      if (!cell || cell.brand_name !== brand_name) continue;
      visited.add(cur);
      component.push(cur);
      for (const n of neighbors4(cur)) queue.push(n);
    }
    if (component.length > 0) {
      components.push({ brandName: brand_name, color, cells: component });
    }
  }

  return components;
}

/** Get bounding box of a set of cells in canvas coordinates */
export function getBoundingBox(
  cells: number[],
  step: number
): { x: number; y: number; w: number; h: number } {
  let minCol = COLS, maxCol = -1, minRow = ROWS, maxRow = -1;
  for (const ci of cells) {
    const col = ci % COLS;
    const row = Math.floor(ci / COLS);
    if (col < minCol) minCol = col;
    if (col > maxCol) maxCol = col;
    if (row < minRow) minRow = row;
    if (row > maxRow) maxRow = row;
  }
  return {
    x: minCol * step,
    y: minRow * step,
    w: (maxCol - minCol + 1) * step,
    h: (maxRow - minRow + 1) * step,
  };
}

/** Format a dollar amount */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Get contrast text colour for a hex background */
export function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#111111' : '#ffffff';
}
