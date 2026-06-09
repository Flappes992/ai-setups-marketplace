import { View, Text, StyleSheet } from 'react-native';
import { BRAND } from '@/theme/ThemeProvider';

interface Props {
  minutesPerUse: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'one_time';
  priceCents: number;
}

const TIMES_PER_MONTH: Record<string, number> = {
  daily: 30,
  weekly: 4.3,
  monthly: 1,
  one_time: 0,
};

function formatHours(mins: number): string {
  if (mins < 60) return `${Math.round(mins)} Min`;
  const h = mins / 60;
  if (h < 10) return `${h.toFixed(1).replace('.0', '')} Std`;
  return `${Math.round(h)} Std`;
}

function avgHourlyRate(): number {
  // realistic AI-power-user / freelancer rate, used only for display
  return 35;
}

export function RoiCard({ minutesPerUse, frequency, priceCents }: Props) {
  if (!minutesPerUse || minutesPerUse <= 0) return null;
  const perMonth = TIMES_PER_MONTH[frequency];
  if (perMonth === 0) {
    return (
      <View style={styles.wrap}>
        <View style={styles.head}>
          <Text style={styles.emoji}>⚡</Text>
          <Text style={styles.title}>Time-Saver</Text>
        </View>
        <Text style={styles.body}>
          Spart dir <Text style={styles.bold}>{formatHours(minutesPerUse)}</Text> einmalig.
        </Text>
      </View>
    );
  }
  const minPerMonth = minutesPerUse * perMonth;
  const valueEur = (minPerMonth / 60) * avgHourlyRate();
  const priceEur = priceCents / 100;
  const breakEvenMonths = priceEur > 0 ? priceEur / Math.max(valueEur, 0.01) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.emoji}>📊</Text>
        <Text style={styles.title}>Dein ROI</Text>
      </View>
      <View style={styles.statsRow}>
        <Stat label="Zeit/Monat" value={formatHours(minPerMonth)} />
        <Sep />
        <Stat label="Wert" value={`~${Math.round(valueEur)} €`} sub="à 35 €/Std" />
        <Sep />
        <Stat
          label="Break-Even"
          value={
            priceEur === 0
              ? 'sofort'
              : breakEvenMonths < 0.05
                ? '< 1 Tag'
                : breakEvenMonths < 1
                  ? `${Math.round(breakEvenMonths * 30)} Tage`
                  : `${breakEvenMonths.toFixed(1).replace('.0', '')} Mo.`
          }
        />
      </View>
      <Text style={styles.foot}>
        Bei {minutesPerUse} Min pro Nutzung × {labelFreq(frequency)}
      </Text>
    </View>
  );
}

function labelFreq(f: string): string {
  if (f === 'daily') return 'täglich';
  if (f === 'weekly') return 'wöchentlich';
  if (f === 'monthly') return 'monatlich';
  return 'einmal';
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

function Sep() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  wrap: {
    margin: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#181B22',
    gap: 12,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emoji: { fontSize: 18 },
  title: { color: BRAND.tealLight, fontSize: 14, fontWeight: '800', letterSpacing: 0.4 },
  body: { color: '#fff', fontSize: 14, lineHeight: 20 },
  bold: { fontWeight: '800', color: BRAND.tealLight },
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  sep: { width: 1, height: 30, backgroundColor: '#2C333D' },
  statValue: { color: '#fff', fontSize: 17, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  statSub: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 1 },
  foot: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontStyle: 'italic' },
});
