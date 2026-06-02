import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface RequestBody {
  setup_id: string;
  buyer_user_id: string;
}

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!stripeKey || !supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey);
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const platformFeePercent = Number(process.env.PLATFORM_FEE_PERCENT ?? 15);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const body = (await req.json()) as RequestBody;
    if (!body.setup_id || !body.buyer_user_id) {
      return NextResponse.json({ error: 'Missing setup_id or buyer_user_id' }, { status: 400 });
    }

    const { data: setup, error: setupError } = await supabase
      .from('setups')
      .select(
        'id, title, price_cents, currency, creator_id, video_thumbnail, creator:profiles!setups_creator_id_fkey(stripe_account_id, stripe_charges_enabled)',
      )
      .eq('id', body.setup_id)
      .eq('status', 'live')
      .single();

    if (setupError || !setup) {
      return NextResponse.json({ error: 'Setup not found or not live' }, { status: 404 });
    }

    if (setup.creator_id === body.buyer_user_id) {
      return NextResponse.json({ error: 'Cannot buy your own setup' }, { status: 400 });
    }

    const creator = (setup as unknown as { creator: { stripe_account_id: string | null; stripe_charges_enabled: boolean } }).creator;
    if (!creator?.stripe_account_id || !creator.stripe_charges_enabled) {
      return NextResponse.json(
        {
          error:
            'Der Creator hat noch keine Zahlungsdaten verlinkt. Bitte zu einem späteren Zeitpunkt erneut versuchen.',
        },
        { status: 400 },
      );
    }

    const platformFee = Math.round((setup.price_cents * platformFeePercent) / 100);

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
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: { destination: creator.stripe_account_id },
      },
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel`,
      metadata: {
        setup_id: setup.id,
        buyer_user_id: body.buyer_user_id,
        creator_id: setup.creator_id,
        platform_fee_cents: platformFee.toString(),
        creator_stripe_account: creator.stripe_account_id,
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
