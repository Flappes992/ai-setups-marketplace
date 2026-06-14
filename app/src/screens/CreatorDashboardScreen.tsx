import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMySetups } from '@/hooks/useMySetups';
import { useCreatorSales } from '@/hooks/useCreatorSales';
import { useCreatorStats } from '@/hooks/useCreatorStats';
import { useStripeAccount } from '@/hooks/useStripeAccount';
import { useAuth } from '@/auth/useAuth';
import { BRAND, useTheme } from '@/theme/ThemeProvider';

function eur(cents: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export function CreatorDashboardScreen() {
  const navigation = useNavigation();
  const { palette } = useTheme();
  const { session } = useAuth();
  const { setups, loading: setupsLoading } = useMySetups();
  const { revenueCents, salesCount, loading: salesLoading } = useCreatorSales();
  const stats = useCreatorStats(session?.user?.id);
  const stripe = useStripeAccount();
  const payoutsEnabled = stripe.status.payoutsEnabled;

  const cards: { label: string; value: string; accent?: boolean }[] = [
    { label: 'Umsatz', value: eur(revenueCents), accent: true },
    { label: 'Verkäufe', value: String(salesCount) },
    { label: 'Setups', value: String(setups.length) },
    { label: 'Reviews', value: String(stats.reviewsCount ?? 0) },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
      <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.backIcon, { color: palette.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>Creator-Dashboard</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {cards.map((c) => (
            <View
              key={c.label}
              style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
            >
              <Text style={[styles.cardValue, { color: c.accent ? BRAND.teal : palette.text }]} numberOfLines={1}>
                {salesLoading && (c.label === 'Umsatz' || c.label === 'Verkäufe') ? '…' : c.value}
              </Text>
              <Text style={[styles.cardLabel, { color: palette.textSecondary }]}>{c.label}</Text>
            </View>
          ))}
        </View>

        {/* Auszahlungs-Status */}
        <View style={[styles.payoutBox, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <Text style={[styles.payoutTitle, { color: palette.text }]}>Auszahlung</Text>
          <Text style={[styles.payoutSub, { color: payoutsEnabled ? BRAND.teal : palette.textSecondary }]}>
            {payoutsEnabled
              ? '✓ Stripe verbunden — Auszahlungen aktiv'
              : 'Noch nicht startklar — verbinde Stripe in den Einstellungen, um Auszahlungen zu erhalten.'}
          </Text>
        </View>

        {/* Setup-Liste */}
        <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>Deine Setups</Text>
        {setupsLoading ? (
          <ActivityIndicator color={BRAND.teal} style={{ marginTop: 20 }} />
        ) : setups.length === 0 ? (
          <Text style={[styles.empty, { color: palette.textSecondary }]}>
            Noch keine Setups hochgeladen. Tipp aufs Plus, um dein erstes zu posten.
          </Text>
        ) : (
          setups.map((s) => (
            <View
              key={s.id}
              style={[styles.row, { borderBottomColor: palette.border }]}
            >
              <Text style={[styles.rowTitle, { color: palette.text }]} numberOfLines={1}>
                {s.title}
              </Text>
              <Text style={[styles.rowPrice, { color: palette.textSecondary }]}>
                {s.negotiable ? `${eur(s.priceCents)} (VB)` : eur(s.priceCents)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  backIcon: { fontSize: 30, width: 30, lineHeight: 32 },
  title: { fontSize: 17, fontWeight: '800', flex: 1, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 48 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  card: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  cardValue: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  cardLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  payoutBox: { marginTop: 16, borderWidth: 1, borderRadius: 14, padding: 16 },
  payoutTitle: { fontSize: 14, fontWeight: '800' },
  payoutSub: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
  },
  empty: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  rowTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  rowPrice: { fontSize: 13 },
});
