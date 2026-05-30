import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? 15);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

interface RequestBody {
  setup_id: string;
  buyer_user_id: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    if (!body.setup_id || !body.buyer_user_id) {
      return NextResponse.json({ error: 'Missing setup_id or buyer_user_id' }, { status: 400 });
    }

    const { data: setup, error: setupError } = await supabase
      .from('setups')
      .select('id, title, price_cents, currency, creator_id, video_thumbnail')
      .eq('id', body.setup_id)
      .eq('status', 'live')
      .single();

    if (setupError || !setup) {
      return NextResponse.json({ error: 'Setup not found or not live' }, { status: 404 });
    }

    if (setup.creator_id === body.buyer_user_id) {
      return NextResponse.json({ error: 'Cannot buy your own setup' }, { status: 400 });
    }

    const platformFee = Math.round((setup.price_cents * PLATFORM_FEE_PERCENT) / 100);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'paypal', 'klarna'],
      line_items: [
        {
          price_data: {
            currency: setup.currency.toLowerCase(),
            product_data: {
              name: setup.title,
              images: setup.video_thumbnail ? [setup.video_thumbnail] : undefined,
            },
            unit_amount: setup.price_cents,
          },
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/cancel`,
      metadata: {
        setup_id: setup.id,
        buyer_user_id: body.buyer_user_id,
        creator_id: setup.creator_id,
        platform_fee_cents: platformFee.toString(),
      },
    });

    await supabase.from('purchases').insert({
      user_id: body.buyer_user_id,
      setup_id: setup.id,
      amount_cents: setup.price_cents,
      platform_fee_cents: platformFee,
      stripe_session_id: session.id,
      status: 'pending',
    });

    return NextResponse.json({ url: session.url, session_id: session.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
