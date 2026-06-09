import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServiceClient, getAuthedUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const supabase = getServiceClient();
    if (!stripeKey || !supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    // Auth: User-ID aus verifiziertem Token, NICHT aus dem Body (sonst IDOR:
    // jeder könnte für fremde Accounts einen Onboarding-/Payout-Link erzeugen).
    const userId = await getAuthedUserId(req, supabase);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mockMode = process.env.STRIPE_CONNECT_MOCK === 'true';

    const stripe = new Stripe(stripeKey);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, stripe_account_id')
      .eq('id', userId)
      .single();
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (mockMode) {
      const mockId = `acct_mock_${profile.id.slice(0, 8)}`;
      await supabase
        .from('profiles')
        .update({
          stripe_account_id: mockId,
          stripe_charges_enabled: true,
          stripe_payouts_enabled: true,
          stripe_onboarded_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
      return NextResponse.json({
        url: `${appUrl}/onboarding/done?user_id=${profile.id}&mock=1`,
        account_id: mockId,
      });
    }

    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const email = authUser?.user?.email;

    let accountId = profile.stripe_account_id as string | null;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'DE',
        email: email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          setiq_user_id: profile.id,
          setiq_username: profile.username ?? '',
        },
      });
      accountId = account.id;
      await supabase
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', profile.id);
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/onboarding/refresh?user_id=${profile.id}`,
      return_url: `${appUrl}/onboarding/done?user_id=${profile.id}`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: link.url, account_id: accountId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
