'use client';

export default function OnboardingRefresh() {
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
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Session abgelaufen</h1>
      <p style={{ margin: 0, opacity: 0.7, maxWidth: 320 }}>
        Bitte zurück zur Setiq-App und „Zahlungsdaten verlinken" nochmal antippen.
      </p>
    </main>
  );
}
