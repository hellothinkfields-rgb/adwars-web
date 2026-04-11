import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

// Stripe requires the raw body for webhook verification
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const transactionId = session.metadata?.transaction_id;

  if (!transactionId) {
    return NextResponse.json({ error: 'No transaction_id in metadata' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Load pending transaction
  const { data: pending, error: pendingErr } = await supabase
    .from('pending_transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('status', 'pending')
    .single();

  if (pendingErr || !pending) {
    // Already processed or not found — safe to ignore (idempotency)
    return NextResponse.json({ received: true });
  }

  const { brand_id, brand_name, cells, total_amount, charity_amount, founder_amount } = pending;

  // Load brand color
  const { data: brandRow } = await supabase
    .from('brands')
    .select('color')
    .eq('id', brand_id)
    .single();

  const color = brandRow?.color ?? '#C0392B';
  const refundAmount = total_amount - charity_amount - founder_amount;

  // Calculate price per cell (distribute total evenly for simplicity; could be per-cell)
  const pricePerCell = Math.round((total_amount / cells.length) * 100) / 100;

  // Upsert grid cells
  const upsertRows = cells.map((cell_id: number) => ({
    cell_id,
    brand_id,
    brand_name,
    color,
    price_paid: pricePerCell,
    updated_at: new Date().toISOString(),
  }));

  const { error: upsertErr } = await supabase
    .from('grid_cells')
    .upsert(upsertRows, { onConflict: 'cell_id' });

  if (upsertErr) {
    console.error('Failed to upsert grid cells:', upsertErr);
    return NextResponse.json({ error: 'Grid update failed' }, { status: 500 });
  }

  // Mark pending transaction as completed
  await supabase
    .from('pending_transactions')
    .update({ status: 'completed', stripe_session_id: session.id })
    .eq('id', transactionId);

  // Record in transactions history
  await supabase.from('transactions').insert({
    id: transactionId,
    brand_id,
    brand_name,
    cells,
    cells_conquered: cells.length,
    total_paid: total_amount,
    charity_amount,
    founder_amount,
    refund_amount: refundAmount,
    stripe_session_id: session.id,
  });

  // Update global stats (increment totals)
  await supabase.rpc('increment_stats', {
    p_volume: total_amount,
    p_charity: charity_amount,
  });

  console.log(`✅ Conquest: ${brand_name} claimed ${cells.length} cells for $${total_amount}`);

  return NextResponse.json({ received: true });
}
