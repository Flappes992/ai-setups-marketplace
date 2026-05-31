import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Setup } from '@/types/setup';
import { useToggleLike } from '@/hooks/useToggleLike';
import { useToggleSave } from '@/hooks/useToggleSave';

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

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export function SetupCard({ setup }: SetupCardProps) {
  const { liked, count, toggle: toggleLike } = useToggleLike(setup.id);
  const { saved, toggle: toggleSave } = useToggleSave(setup.id);

  return (
    <View style={styles.container}>
      <Image source={{ uri: setup.videoThumbnail }} style={styles.thumbnail} resizeMode="cover" />

      <View style={styles.actionRail}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={toggleLike}
          accessibilityLabel={liked ? 'unlike' : 'like'}
        >
          <Text style={[styles.actionIcon, liked && styles.actionIconActive]}>
            {liked ? '♥' : '♡'}
          </Text>
          <Text style={styles.actionLabel}>{formatCount(count)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={toggleSave}
          accessibilityLabel={saved ? 'unsave' : 'save'}
        >
          <Text style={[styles.actionIcon, saved && styles.actionIconActiveBlue]}>
            {saved ? '★' : '☆'}
          </Text>
          <Text style={styles.actionLabel}>Save</Text>
        </TouchableOpacity>
      </View>

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
  thumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 100,
  },
  actionRail: {
    position: 'absolute',
    right: 12,
    bottom: 140,
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    alignItems: 'center',
    padding: 4,
  },
  actionIcon: {
    color: '#fff',
    fontSize: 38,
    lineHeight: 42,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionIconActive: {
    color: '#ef4444',
  },
  actionIconActiveBlue: {
    color: '#facc15',
  },
  actionLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
