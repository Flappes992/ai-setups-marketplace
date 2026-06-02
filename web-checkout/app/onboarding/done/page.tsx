'use client';

import { useEffect } from 'react';

export default function OnboardingDone() {
  useEffect(() => {
    // Try to send user back to the Setiq app via custom scheme
    if (typeof window !== 'undefined') {
      const t = setTimeout(() => {
        window.location.href = 'setiq://settings?stripe=done';
      }, 1200);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        background: '#181B22',
        color: '#fff',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 84,
          height: 84,
          borderRadius: 42,
          background: '#2DD4BF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 42,
          color: '#0b3b35',
        }}
      >
        ✓
      </div>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Zahlungsdaten gespeichert</h1>
      <p style={{ margin: 0, opacity: 0.7, maxWidth: 320 }}>
        Du wirst gleich zur Setiq-App zurückgeleitet. Falls nicht, kannst du diesen Tab schließen
        und die App öffnen.
      </p>
    </main>
  );
}
