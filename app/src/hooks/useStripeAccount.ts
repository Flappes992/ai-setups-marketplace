import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';

const WEB_CHECKOUT_BASE = 'https://web-checkout-sicci-s-projects.vercel.app';

export interface StripeStatus {
  connected: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  accountId: string | null;
}

interface Result {
  status: StripeStatus;
  loading: boolean;
  refresh: () => Promise<void>;
  startOnboarding: () => Promise<{ url: string | null; error?: string }>;
}

export function useStripeAccount(): Result {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const [status, setStatus] = useState<StripeStatus>({
    connected: false,
    chargesEnabled: false,
    payoutsEnabled: false,
    accountId: null,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!myId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled')
      .eq('id', myId)
      .single();
    const p = profile as
      | {
          stripe_account_id: string | null;
          stripe_charges_enabled: boolean;
          stripe_payouts_enabled: boolean;
        }
      | null;

    if (p?.stripe_account_id) {
      try {
        const res = await fetch(`${WEB_CHECKOUT_BASE}/api/stripe/account-status`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
        });
        const json = await res.json();
        setStatus({
          connected: !!json.connected,
          chargesEnabled: !!json.charges_enabled,
          payoutsEnabled: !!json.payouts_enabled,
          accountId: json.account_id ?? p.stripe_account_id,
        });
      } catch {
        setStatus({
          connected: true,
          chargesEnabled: p.stripe_charges_enabled,
          payoutsEnabled: p.stripe_payouts_enabled,
          accountId: p.stripe_account_id,
        });
      }
    } else {
      setStatus({
        connected: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        accountId: null,
      });
    }
    setLoading(false);
  }, [myId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startOnboarding = useCallback(async (): Promise<{ url: string | null; error?: string }> => {
    if (!myId) return { url: null, error: 'Nicht eingeloggt' };
    try {
      const res = await fetch(`${WEB_CHECKOUT_BASE}/api/stripe/connect-onboarding`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
      });
      const json = await res.json();
      if (!res.ok) return { url: null, error: json.error ?? 'Fehler' };
      return { url: json.url };
    } catch (e) {
      return { url: null, error: e instanceof Error ? e.message : 'Fehler' };
    }
  }, [myId]);

  return { status, loading, refresh, startOnboarding };
}
