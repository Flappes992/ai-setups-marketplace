import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { useStripeAccount } from '@/hooks/useStripeAccount';
import { useToast } from '@/components/Toast';
import { BRAND } from '@/theme/ThemeProvider';

export function StripeConnectCard() {
  const { status, loading, refresh, startOnboarding } = useStripeAccount();
  const toast = useToast();
  const [opening, setOpening] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
      const sub = AppState.addEventListener('change', (s) => {
        if (s === 'active') refresh();
      });
      return () => sub.remove();
    }, [refresh]),
  );

  async function handleConnect() {
    setOpening(true);
    const result = await startOnboarding();
    setOpening(false);
    if (!result.url) {
      toast.show(result.error ?? 'Fehler beim Öffnen', 'error');
      return;
    }
    await WebBrowser.openBrowserAsync(result.url);
    setTimeout(() => refresh(), 800);
  }

  if (loading) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator color={BRAND.teal} />
      </View>
    );
  }

  const fullyActive = status.connected && status.chargesEnabled && status.payoutsEnabled;
  const partiallyActive = status.connected && !fullyActive;
  const notConnected = !status.connected;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View
          style={[
            styles.badge,
            fullyActive && styles.badgeActive,
            partiallyActive && styles.badgePending,
            notConnected && styles.badgeIdle,
          ]}
        >
          <Text style={styles.badgeText}>{fullyActive ? '✓' : partiallyActive ? '⏳' : '€'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {fullyActive
              ? 'Stripe verbunden'
              : partiallyActive
                ? 'Verifizierung läuft'
                : 'Zahlungen empfangen'}
          </Text>
          <Text style={styles.sub}>
            {fullyActive
              ? 'Käufe landen automatisch auf deinem Konto (abzüglich 15 % Setiq-Provision).'
              : partiallyActive
                ? 'Stripe prüft noch deine Daten. Du wirst informiert sobald aktiv.'
                : 'Verlinke ein Bankkonto via Stripe um deine Setups verkaufen zu können.'}
          </Text>
        </View>
      </View>

      {notConnected && (
        <TouchableOpacity
          onPress={handleConnect}
          style={styles.btn}
          disabled={opening}
          accessibilityLabel="connect-stripe"
        >
          {opening ? (
            <ActivityIndicator color="#0b3b35" />
          ) : (
            <Text style={styles.btnText}>+ Stripe verbinden</Text>
          )}
        </TouchableOpacity>
      )}

      {partiallyActive && (
        <TouchableOpacity
          onPress={handleConnect}
          style={[styles.btn, styles.btnAlt]}
          disabled={opening}
          accessibilityLabel="continue-onboarding"
        >
          {opening ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnAltText}>Verifikation fortsetzen →</Text>
          )}
        </TouchableOpacity>
      )}

      {fullyActive && status.accountId && (
        <View style={{ gap: 4 }}>
          <Text style={styles.accountId}>Account: {status.accountId.slice(0, 16)}…</Text>
          {status.accountId.startsWith('acct_mock_') && (
            <Text style={styles.mockBadge}>
              ⚠ MOCK-Modus aktiv — Zahlungen werden nicht echt gesplittet. Echten Stripe-Connect
              vor Launch aktivieren.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
    gap: 14,
  },
  headerRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  badge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIdle: { backgroundColor: '#f0f0f0' },
  badgePending: { backgroundColor: '#fbbf24' },
  badgeActive: { backgroundColor: BRAND.teal },
  badgeText: { fontSize: 18, fontWeight: '800', color: '#0b3b35' },
  title: { fontSize: 16, fontWeight: '800', color: '#111' },
  sub: { fontSize: 12, color: '#666', marginTop: 4, lineHeight: 16 },
  btn: {
    backgroundColor: BRAND.teal,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#0b3b35', fontWeight: '800', fontSize: 14 },
  btnAlt: {
    backgroundColor: '#181B22',
  },
  btnAltText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  accountId: { fontSize: 11, color: '#999', fontVariant: ['tabular-nums'] },
  mockBadge: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '700',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
});
