import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendPushToUser } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeKey || !webhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid signature';
    return NextResponse.json({ error: `Webhook signature verification failed: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await supabase
          .from('purchases')
          .update({
            status: 'completed',
            stripe_payment_intent_id:
              typeof session.payment_intent === 'string' ? session.payment_intent : null,
            completed_at: new Date().toISOString(),
          })
          .eq('stripe_session_id', session.id);

        // Push an den Creator: dein Setup wurde verkauft (best-effort)
        try {
          const { data: purchase } = await supabase
            .from('purchases')
            .select('setup:setups!inner(title, creator_id)')
            .eq('stripe_session_id', session.id)
            .single();
          const setup = (purchase?.setup ?? null) as
            | { title: string; creator_id: string }
            | null;
          if (setup?.creator_id) {
            await sendPushToUser(supabase, setup.creator_id, {
              title: 'Verkauft 🎉',
              body: `Dein Setup „${setup.title}" wurde gekauft.`,
              data: { type: 'sale' },
            });
          }
        } catch {
          // Push darf den Webhook nie kippen
        }
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await supabase
          .from('purchases')
          .update({ status: 'failed' })
          .eq('stripe_session_id', session.id);
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        if (typeof charge.payment_intent === 'string') {
          await supabase
            .from('purchases')
            .update({ status: 'refunded' })
            .eq('stripe_payment_intent_id', charge.payment_intent);
        }
        break;
      }
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown handler error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
