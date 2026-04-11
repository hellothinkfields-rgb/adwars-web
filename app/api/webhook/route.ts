import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

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
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    if (!metadata) {
      return NextResponse.json({ received: true });
    }

    const { brandName, brandDomain, brandColor, cellIndices } = metadata;

    if (!cellIndices) {
      return NextResponse.json({ received: true });
    }

    const indices = JSON.parse(cellIndices) as number[];
    const amountPaid = session.amount_total || 0;
    const perCell = Math.floor(amountPaid / indices.length);

    // Find or create brand
    let brandId: string;
    const { data: existingBrand } = await supabase
      .from('brands')
      .select('id')
      .eq('name', brandName)
      .single();

    if (existingBrand) {
      brandId = existingBrand.id;
    } else {
      const { data: newBrand, error: brandError } = await supabase
        .from('brands')
        .insert({
          name: brandName,
          domain: brandDomain,
          color: brandColor,
          total_spent: 0,
          cells_owned: 0,
        })
        .select('id')
        .single();

      if (brandError || !newBrand) {
        console.error('Error creating brand:', brandError);
        return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
      }

      brandId = newBrand.id;
    }

    // Get current owners of conquered cells
    const { data: currentCells } = await supabase
      .from('cells')
      .select('id, brand_id, price_paid')
      .in('id', indices);

    // Update cells to new owner
    const { error: cellError } = await supabase
      .from('cells')
      .upsert(
        indices.map((cellId) => ({
          id: cellId,
          brand_id: brandId,
          price_paid: perCell,
          conquered_at: new Date().toISOString(),
        }))
      );

    if (cellError) {
      console.error('Error updating cells:', cellError);
      return NextResponse.json({ error: 'Failed to update cells' }, { status: 500 });
    }

    // Update brand stats
    await supabase.rpc('update_brand_stats', { p_brand_id: brandId });
  }

  return NextResponse.json({ received: true });
}
