export interface Brand {
  id: string;
  name: string;
  color: string;
  domain: string | null;
  created_at: string;
}

export interface CellData {
  brand_id: string;
  brand_name: string;
  color: string;
  price_paid: number;
}

export interface GridState {
  [cellId: number]: CellData;
}

export interface Transaction {
  id: string;
  brand_name: string;
  cells_conquered: number;
  total_paid: number;
  charity_amount: number;
  created_at: string;
}

export interface Stats {
  total_charity_donated: number;
  total_volume: number;
  total_transactions: number;
}

export const COLS = 64;
export const ROWS = 64;
export const TOTAL_CELLS = COLS * ROWS; // 4096
export const CELL_SIZE = 9;
export const GAP = 1;
export const STEP = CELL_SIZE + GAP; // 10px per cell
export const CANVAS_SIZE = COLS * STEP; // 640px

// Revenue split
export const REFUND_PCT = 0.30;   // 30% back to conquered brand
export const CHARITY_PCT = 0.35;  // 35% to charity
export const FOUNDER_PCT = 0.35;  // 35% to founder

export const BASE_PRICE = 1.00;       // $ per empty cell
export const CONQUEST_MULTIPLIER = 1.5; // owned cell costs 1.5× what was paid
