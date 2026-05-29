import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { Setup } from '@/types/setup';

const { width, height } = Dimensions.get('window');

interface SetupCardProps {
  setup: Setup;
}

function formatPriceEur(cents: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export function SetupCard({ setup }: SetupCardProps) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: setup.videoThumbnail }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <View style={styles.creatorRow}>
          <Image source={{ uri: setup.creator.avatarUrl }} style={styles.avatar} />
          <Text style={styles.creatorName}>{setup.creator.displayName}</Text>
        </View>
        <Text style={styles.title}>{setup.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {setup.description}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPriceEur(setup.priceCents)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
    height,
    backgroundColor: '#000',
  },
  thumbnail: StyleSheet.absoluteFill,
  overlay: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 80,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#444',
  },
  creatorName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  description: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginBottom: 14,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    backgroundColor: '#fff',
    color: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    fontWeight: '700',
    fontSize: 14,
    overflow: 'hidden',
  },
});
