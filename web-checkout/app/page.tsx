'use client';

import { useEffect, useState } from 'react';

export default function CheckoutPage() {
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function start() {
      const params = new URLSearchParams(window.location.search);
      const setup_id = params.get('setup_id');
      const buyer_user_id = params.get('buyer_user_id');
      if (!setup_id || !buyer_user_id) {
        setStatus('error');
        setError('Missing parameters');
        return;
      }
      try {
        const res = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setup_id, buyer_user_id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to create session');
        setStatus('redirecting');
        window.location.href = data.url;
      } catch (e) {
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Unknown error');
      }
    }
    start();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="text-center max-w-md">
        {status === 'loading' && (
          <>
            <div className="animate-pulse text-gray-500 mb-2">Lade Checkout…</div>
            <div className="text-xs text-gray-400">Du wirst gleich zu Stripe weitergeleitet</div>
          </>
        )}
        {status === 'redirecting' && (
          <div className="text-gray-700">Weiterleitung zu Stripe…</div>
        )}
        {status === 'error' && (
          <>
            <div className="text-red-600 font-bold mb-2">Fehler</div>
            <div className="text-sm text-gray-600">{error}</div>
          </>
        )}
      </div>
    </div>
  );
}
