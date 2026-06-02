import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface RequestBody {
  user_id: string;
}

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    if (!stripeKey || !supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const body = (await req.json()) as RequestBody;
    if (!body.user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const stripe = new Stripe(stripeKey);
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, stripe_account_id')
      .eq('id', body.user_id)
      .single();
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: authUser } = await supabase.auth.admin.getUserById(body.user_id);
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
