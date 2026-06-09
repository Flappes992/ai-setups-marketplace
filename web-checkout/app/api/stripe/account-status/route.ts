import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServiceClient, getAuthedUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const supabase = getServiceClient();
    if (!stripeKey || !supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    // Auth: User-ID kommt aus dem verifizierten Token, NICHT aus dem Body (kein IDOR).
    const userId = await getAuthedUserId(req, supabase);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mockMode = process.env.STRIPE_CONNECT_MOCK === 'true';
    const stripe = new Stripe(stripeKey);

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', userId)
      .single();
    const accountId = (profile as { stripe_account_id: string | null } | null)?.stripe_account_id;
    if (!accountId) {
      return NextResponse.json({
        connected: false,
        charges_enabled: false,
        payouts_enabled: false,
      });
    }

    if (mockMode || accountId.startsWith('acct_mock_')) {
      await supabase
        .from('profiles')
        .update({
          stripe_charges_enabled: true,
          stripe_payouts_enabled: true,
          stripe_onboarded_at: new Date().toISOString(),
        })
        .eq('id', userId);
      return NextResponse.json({
        connected: true,
        account_id: accountId,
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        requirements_due: [],
        mock: true,
      });
    }

    const account = await stripe.accounts.retrieve(accountId);
    const chargesEnabled = !!account.charges_enabled;
    const payoutsEnabled = !!account.payouts_enabled;
    const detailsSubmitted = !!account.details_submitted;

    await supabase
      .from('profiles')
      .update({
        stripe_charges_enabled: chargesEnabled,
        stripe_payouts_enabled: payoutsEnabled,
        stripe_onboarded_at: detailsSubmitted ? new Date().toISOString() : null,
      })
      .eq('id', userId);

    return NextResponse.json({
      connected: true,
      account_id: accountId,
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      details_submitted: detailsSubmitted,
      requirements_due: account.requirements?.currently_due ?? [],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
