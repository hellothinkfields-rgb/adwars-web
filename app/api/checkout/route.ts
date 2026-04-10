import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase';
import { BASE_PRICE, CONQUEST_MULTIPLIER, CHARITY_PCT, FOUNDER_PCT } from '@/lib/types';
import { validateSelection } from '@/lib/grid-utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });

export async function POST(req: NextRequest) {
  const { brandId, brandName, cells } = await req.json();
  if (!brandId || !brandName || !cells?.length) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const supabase = createServiceClient();
  const { data: gridRows } = await supabase.from('grid_cells').select('cell_id, brand_name, price_paid');
  const grid: Record<number, { brand_name: string; price_paid: number }> = {};
  for (const row of gridRows ?? []) grid[row.cell_id] = { brand_name: row.brand_name, price_paid: row.price_paid };
  const mySet = new Set<number>();
  for (const [ci, cell] of Object.entries(grid)) if (cell.brand_name === brandName) mySet.add(Number(ci));
  const validCells = validateSelection(cells, mySet, grid as never, brandName);
  if (validCells.length === 0) return NextResponse.json({ error: 'No valid cells' }, { status: 400 });
  const totalAmount = validCells.reduce((sum, ci) => {
    const e = grid[ci];
    return sum + (!e ? BASE_PRICE : Math.max(BASE_PRICE, e.price_paid * CONQUEST_MULTIPLIER));
  }, 0);
  const charityAmount = Math.round(totalAmount * CHARITY_PCT * 100) / 100;
  const founderAmount = Math.round(totalAmount * FOUNDER_PCT * 100) / 100;
  const { data: pending, error: pendingErr } = await supabase.from('pending_transactions').insert({ brand_id: brandId, brand_name: brandName, cells: validCells, total_amount: totalAmount, charity_amount: charityAmount, founder_amount: founderAmount }).select().single();
  if (pendingErr || !pending) return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://adwars.live';
  const session = await stripe.checkout.sessions.create({ mode: 'payment', payment_method_types: ['card'], line_items: [{ price_data: { currency: 'usd', product_data: { name: `Ad Wars—Conquer ${validCells.length} square${validCells.length !== 1 ? 's' : ''}`, images: [`${appUrl}/og-image.png`] }, unit_amount: Math.round(totalAmount * 100) }, quantity: 1 }], metadata: { transaction_id: pending.id, brand_id: brandId, brand_name: brandName }, success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${appUrl}/?cancelled=1` });
  await supabase.from('pending_transactions').update({ stripe_session_id: session.id }).eq('id', pending.id);
  return NextResponse.json({ url: session.url });
}
