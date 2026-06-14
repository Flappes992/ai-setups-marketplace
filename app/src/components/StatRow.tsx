import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

/* Geteilte Stat-Reihe für Profile- & CreatorProfile-Screen.
   Zentriert, gleichmäßige Abstände (Separator mit beidseitigem margin) —
   eine Quelle, damit die beiden Profile-Screens nicht auseinanderdriften. */

export interface StatItem {
  label: string;
  value: string | number;
  onPress?: () => void;
}

export function StatRow({ stats }: { stats: StatItem[] }) {
  const { palette } = useTheme();
  return (
    <View style={styles.row}>
      {stats.map((s, i) => {
        const Wrap = s.onPress ? TouchableOpacity : View;
        return (
          <View key={s.label} style={styles.container}>
            <Wrap
              style={styles.stat}
              onPress={s.onPress}
              accessibilityLabel={s.onPress ? `stat-${s.label}` : undefined}
            >
              <Text style={[styles.value, { color: palette.text }]} numberOfLines={1}>
                {s.value}
              </Text>
              <Text style={[styles.label, { color: palette.textSecondary }]}>{s.label}</Text>
            </Wrap>
            {i < stats.length - 1 && (
              <View style={[styles.sep, { backgroundColor: palette.border }]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  container: { flexDirection: 'row', alignItems: 'center' },
  stat: { alignItems: 'center', minWidth: 64 },
  value: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 11, marginTop: 2 },
  sep: { width: 1, height: 24, marginHorizontal: 12 },
});
