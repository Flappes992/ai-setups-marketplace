import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BRAND } from '@/theme/ThemeProvider';

interface Props {
  icon: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon, title, subtitle, ctaLabel, onCta }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {ctaLabel && onCta ? (
        <TouchableOpacity
          onPress={onCta}
          style={styles.cta}
          accessibilityLabel={`empty-cta-${ctaLabel}`}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  icon: { fontSize: 56, marginBottom: 14 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
    maxWidth: 280,
  },
  cta: {
    backgroundColor: BRAND.teal,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 22,
    shadowColor: BRAND.tealDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: { color: '#0b3b35', fontWeight: '800', fontSize: 14 },
});
