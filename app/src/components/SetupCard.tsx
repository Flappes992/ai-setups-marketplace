import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Pressable,
  Share,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Setup } from '@/types/setup';
import { useToggleLike } from '@/hooks/useToggleLike';
import { useToggleSave } from '@/hooks/useToggleSave';
import { BRAND } from '@/theme/ThemeProvider';

const { width, height } = Dimensions.get('window');

interface SetupCardProps {
  setup: Setup;
  onTagPress?: (tag: string) => void;
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

function isNewSetup(createdAt: string): boolean {
  const created = Date.parse(createdAt);
  if (Number.isNaN(created)) return false;
  return Date.now() - created < 24 * 60 * 60 * 1000;
}

function assetTypeLabel(t: string): { icon: string; label: string } {
  if (t === 'tutorial_bundle') return { icon: '📚', label: 'Bundle' };
  return { icon: '⚡', label: 'Setup' };
}

export function SetupCard({ setup, onTagPress }: SetupCardProps) {
  const { liked, count, toggle: toggleLike } = useToggleLike(setup.id);
  const { saved, toggle: toggleSave } = useToggleSave(setup.id);
  const likeScale = useRef(new Animated.Value(1)).current;
  const saveScale = useRef(new Animated.Value(1)).current;
  const countScale = useRef(new Animated.Value(1)).current;
  const heartBurst = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count !== prevCount.current) {
      Animated.sequence([
        Animated.spring(countScale, { toValue: 1.4, useNativeDriver: true, friction: 4 }),
        Animated.spring(countScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
      ]).start();
      prevCount.current = count;
    }
  }, [count, countScale]);

  function bounce(value: Animated.Value) {
    Animated.sequence([
      Animated.spring(value, { toValue: 1.35, useNativeDriver: true, friction: 4 }),
      Animated.spring(value, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
  }

  function showHeartBurst() {
    heartBurst.setValue(0);
    Animated.sequence([
      Animated.spring(heartBurst, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 90,
      }),
      Animated.timing(heartBurst, {
        toValue: 0,
        duration: 700,
        delay: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }

  async function handleLikeTap() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bounce(likeScale);
    await toggleLike();
  }

  async function handleSaveTap() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bounce(saveScale);
    await toggleSave();
  }

  function handleCardTap() {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      showHeartBurst();
      if (!liked) {
        bounce(likeScale);
        toggleLike();
      }
    }
    lastTap.current = now;
  }

  const heartBurstStyle = {
    opacity: heartBurst.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
    transform: [
      {
        scale: heartBurst.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 2.0],
        }),
      },
      {
        rotate: heartBurst.interpolate({
          inputRange: [0, 1],
          outputRange: ['-10deg', '0deg'],
        }),
      },
    ],
  };

  const isNew = isNewSetup(setup.createdAt);
  const typeMeta = assetTypeLabel(setup.assetType);

  return (
    <Pressable style={styles.container} onPress={handleCardTap}>
      <Image source={{ uri: setup.videoThumbnail }} style={styles.thumbnail} resizeMode="cover" />

      <View style={styles.bottomGradient} pointerEvents="none" />

      <View style={styles.topBadges} pointerEvents="none">
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEU</Text>
          </View>
        )}
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeIcon}>{typeMeta.icon}</Text>
          <Text style={styles.typeBadgeLabel}>{typeMeta.label}</Text>
        </View>
      </View>

      <Animated.View style={[styles.heartBurst, heartBurstStyle]} pointerEvents="none">
        <Text style={styles.heartBurstText}>♥</Text>
      </Animated.View>

      <View style={styles.actionRail}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLikeTap}
          accessibilityLabel={liked ? 'unlike' : 'like'}
        >
          <Animated.Text
            style={[
              styles.actionIcon,
              liked && styles.actionIconActive,
              { transform: [{ scale: likeScale }] },
            ]}
          >
            {liked ? '♥' : '♡'}
          </Animated.Text>
          <Animated.Text style={[styles.actionLabel, { transform: [{ scale: countScale }] }]}>
            {formatCount(count)}
          </Animated.Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSaveTap}
          accessibilityLabel={saved ? 'unsave' : 'save'}
        >
          <Animated.Text
            style={[
              styles.actionIcon,
              saved && styles.actionIconActiveSave,
              { transform: [{ scale: saveScale }] },
            ]}
          >
            {saved ? '★' : '☆'}
          </Animated.Text>
          <Text style={styles.actionLabel}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            try {
              await Share.share({
                message: `Schau dir „${setup.title}" auf Setiq an — von @${setup.creator.username}`,
                url: `https://setiq.net/setup/${setup.id}`,
              });
            } catch {
              // user cancelled
            }
          }}
          accessibilityLabel="share-setup"
        >
          <Text style={styles.actionIcon}>↗</Text>
          <Text style={styles.actionLabel}>Teilen</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.overlay}>
        <View style={styles.creatorRow}>
          <Image source={{ uri: setup.creator.avatarUrl }} style={styles.avatar} />
          <Text style={styles.creatorName}>@{setup.creator.username}</Text>
        </View>
        <Text style={styles.title}>{setup.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {setup.description}
        </Text>
        <View style={styles.tagRow}>
          {setup.tags.slice(0, 4).map((tag) => (
            <TouchableOpacity key={tag} onPress={() => onTagPress?.(tag)} style={styles.tagPill}>
              <Text style={styles.tagText}>#{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPriceEur(setup.priceCents)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { width, height, backgroundColor: '#000' },
  thumbnail: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 280,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heartBurst: {
    position: 'absolute',
    top: height / 2 - 80,
    left: width / 2 - 60,
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBurstText: {
    fontSize: 130,
    color: BRAND.like,
    textShadowColor: 'rgba(239,68,68,0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  overlay: { position: 'absolute', bottom: 100, left: 16, right: 96 },
  actionRail: { position: 'absolute', right: 12, bottom: 160, alignItems: 'center', gap: 18 },
  actionButton: { alignItems: 'center', padding: 2 },
  actionIcon: {
    color: '#fff',
    fontSize: 36,
    lineHeight: 40,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionIconActive: { color: BRAND.like },
  actionIconActiveSave: { color: BRAND.teal },
  actionLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  creatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#444',
    borderWidth: 2,
    borderColor: BRAND.teal,
  },
  creatorName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  description: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tagPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  price: {
    backgroundColor: BRAND.teal,
    color: '#0b3b35',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    fontWeight: '800',
    fontSize: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  topBadges: {
    position: 'absolute',
    top: 70,
    left: 14,
    flexDirection: 'row',
    gap: 6,
    zIndex: 5,
  },
  newBadge: {
    backgroundColor: BRAND.like,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  newBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  typeBadgeIcon: { fontSize: 11 },
  typeBadgeLabel: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
});
