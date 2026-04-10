import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  if (event.type !== 'checkout.session.completed') return NextResponse.json({ received: true });
  const session = event.data.object as Stripe.Checkout.Session;
  const transactionId = session.metadata?.transaction_id;
  if (!transactionId) return NextResponse.json({ error: 'No transaction_id' }, { status: 400 });
  const supabase = createServiceClient();
  const { data: pending, error: pendingErr } = await supabase.from('pending_transactions').select('*').eq('id', transactionId).eq('status', 'pending').single();
  if (pendingErr || !pending) return NextResponse.json({ received: true });
  const { brand_id, brand_name, cells, total_amount, charity_amount, founder_amount } = pending;
  const { data: brandRow } = await supabase.from('brands').select('color').eq('id', brand_id).single();
  const color = brandRow?.color ?? '#C0392B';
  const refundAmount = total_amount - charity_amount - founder_amount;
  const pricePerCell = Math.round((total_amount / cells.length) * 100) / 100;
  const upsertRows = cells.map((cell_id: number) => ({ cell_id, brand_id, brand_name, color, price_paid: pricePerCell, updated_at: new Date().toISOString() }));
  const { error: upsertErr } = await supabase.from('grid_cells').upsert(upsertRows, { onConflict: 'cell_id' });
  if (upsertErr) return NextResponse.json({ error: 'Grid update failed' }, { status: 500 });
  await supabase.from('pending_transactions').update({ status: 'completed', stripe_session_id: session.id }).eq('id', transactionId);
  await supabase.from('transactions').insert({ id: transactionId, brand_id, brand_name, cells, cells_conquered: cells.length, total_paid: total_amount, charity_amount, founder_amount, refund_amount: refundAmount, stripe_session_id: session.id });
  await supabase.rpc('increment_stats', { p_volume: total_amount, p_charity: charity_amount });
  return NextResponse.json({ received: true });
}
