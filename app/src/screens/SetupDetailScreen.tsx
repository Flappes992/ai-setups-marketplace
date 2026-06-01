import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Setup } from '@/types/setup';
import { useAuth } from '@/auth/useAuth';
import { usePurchase } from '@/hooks/usePurchase';
import { CommentsSection } from '@/components/CommentsSection';
import { TealGradient } from '@/components/TealGradient';
import { useToggleLike } from '@/hooks/useToggleLike';
import { useToggleSave } from '@/hooks/useToggleSave';
import { useComments } from '@/hooks/useComments';
import { useSetups } from '@/hooks/useSetups';
import { BRAND } from '@/theme/ThemeProvider';
import type { MainStackParamList } from '@/navigation/RootNavigator';

type Nav = NativeStackNavigationProp<MainStackParamList, 'SetupDetail'>;

const WEB_CHECKOUT_BASE = 'https://web-checkout-sicci-s-projects.vercel.app';

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
}

function formatPriceEur(cents: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

interface SetupDetailScreenProps {
  setup: Setup;
}

export function SetupDetailScreen({ setup }: SetupDetailScreenProps) {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const isOwner = userId === setup.creator.id;
  const { purchase, refetch } = usePurchase(setup.id, userId);
  const { count: likeCount } = useToggleLike(setup.id);
  const { count: saveCount } = useToggleSave(setup.id);
  const { comments } = useComments(setup.id);
  const { setups: allSetups } = useSetups();
  const [busy, setBusy] = useState(false);
  const [polling, setPolling] = useState(false);

  const otherSetups = allSetups
    .filter((s) => s.creator.id === setup.creator.id && s.id !== setup.id)
    .slice(0, 6);

  const heroUrl = setup.videoUrl || setup.videoThumbnail;
  const hasVideo = isVideoUrl(heroUrl);
  const player = useVideoPlayer(hasVideo ? heroUrl : '', (p) => {
    p.loop = true;
    p.muted = false;
  });

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(() => refetch(), 2500);
    const timeout = setTimeout(() => setPolling(false), 30000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [polling, refetch]);

  useEffect(() => {
    if (polling && purchase?.status === 'completed') {
      setPolling(false);
    }
  }, [polling, purchase?.status]);

  const handleBuy = useCallback(async () => {
    if (!userId) {
      Alert.alert('Bitte erst einloggen');
      return;
    }
    setBusy(true);
    try {
      const url = `${WEB_CHECKOUT_BASE}/?setup_id=${encodeURIComponent(
        setup.id,
      )}&buyer_user_id=${encodeURIComponent(userId)}`;
      await WebBrowser.openBrowserAsync(url);
      setPolling(true);
      await refetch();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unbekannter Fehler';
      Alert.alert('Fehler', msg);
    } finally {
      setBusy(false);
    }
  }, [userId, setup.id, refetch]);

  const handleOpenAsset = useCallback(async () => {
    if (!setup.assetUrl) {
      Alert.alert('Asset-Link fehlt');
      return;
    }
    await Linking.openURL(setup.assetUrl);
  }, [setup.assetUrl]);

  const buttonState = (() => {
    if (isOwner) return 'owner' as const;
    if (purchase?.status === 'completed') return 'owned' as const;
    if (polling || purchase?.status === 'pending') return 'pending' as const;
    return 'buy' as const;
  })();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {hasVideo ? (
          <VideoView player={player} style={styles.hero} nativeControls contentFit="cover" />
        ) : (
          <Image source={{ uri: setup.videoThumbnail }} style={styles.hero} resizeMode="cover" />
        )}

        <View style={styles.body}>
          <Text style={styles.title}>{setup.title}</Text>

          <View style={styles.creatorRow}>
            <Image source={{ uri: setup.creator.avatarUrl }} style={styles.avatar} />
            <View>
              <Text style={styles.creatorName}>{setup.creator.displayName}</Text>
              <Text style={styles.creatorMeta}>
                ★ {setup.creator.ratingAverage.toFixed(1)} · {setup.creator.setupsCount} Setups
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <Stat icon="♥" value={likeCount} label="Likes" tint={BRAND.like} />
            <Stat icon="★" value={saveCount} label="Saves" tint={BRAND.teal} />
            <Stat icon="💬" value={comments.length} label="Kommentare" />
          </View>

          <Text style={styles.sectionTitle}>Über das Setup</Text>
          <Text style={styles.description}>{setup.description}</Text>

          <Text style={styles.sectionTitle}>Über {setup.creator.displayName}</Text>
          <Text style={styles.description}>{setup.creator.bio}</Text>

          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagRow}>
            {setup.tags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={styles.tag}
                onPress={() => navigation.navigate('TagFeed', { tag })}
                accessibilityLabel={`tag-${tag}`}
              >
                <Text style={styles.tagText}>#{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Asset-Typ</Text>
          <Text style={styles.description}>
            {setup.assetType === 'clonable'
              ? 'Klonbares Template — sofort verfügbar nach Kauf'
              : 'PDF + Video-Tutorial Bundle'}
          </Text>

          {otherSetups.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Mehr von {setup.creator.displayName}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carousel}
              >
                {otherSetups.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.otherCard}
                    onPress={() => navigation.push('SetupDetail', { setup: s })}
                    accessibilityLabel={`other-setup-${s.id}`}
                  >
                    <Image source={{ uri: s.videoThumbnail }} style={styles.otherThumb} />
                    <Text numberOfLines={2} style={styles.otherTitle}>
                      {s.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>

        <View style={styles.commentsBlock}>
          <CommentsSection setupId={setup.id} />
        </View>
      </ScrollView>

      <View style={styles.purchaseBar}>
        {buttonState === 'owner' && (
          <View style={[styles.purchaseButton, styles.disabledButton]}>
            <Text style={styles.purchaseButtonText}>Eigenes Setup</Text>
          </View>
        )}
        {buttonState === 'owned' && (
          <TouchableOpacity
            style={[styles.purchaseButton, styles.ownedButton]}
            onPress={handleOpenAsset}
            accessibilityLabel="open-asset"
          >
            <Text style={styles.purchaseButtonText}>
              {setup.assetType === 'clonable' ? 'Template öffnen' : 'Bundle herunterladen'}
            </Text>
          </TouchableOpacity>
        )}
        {buttonState === 'pending' && (
          <View style={[styles.purchaseButton, styles.disabledButton]}>
            <ActivityIndicator color="#fff" />
            <Text style={[styles.purchaseButtonText, { marginLeft: 10 }]}>Bezahlung läuft…</Text>
          </View>
        )}
        {buttonState === 'buy' && (
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={busy}
            onPress={handleBuy}
            accessibilityLabel="open-checkout"
            style={styles.purchaseShadow}
          >
            <TealGradient style={styles.purchaseGradient}>
              {busy ? (
                <ActivityIndicator color="#0b3b35" />
              ) : (
                <Text style={styles.purchaseGradientText}>
                  Setup holen · {formatPriceEur(setup.priceCents)}
                </Text>
              )}
            </TealGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function Stat({
  icon,
  value,
  label,
  tint,
}: {
  icon: string;
  value: number;
  label: string;
  tint?: string;
}) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statIcon, tint ? { color: tint } : null]}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 160 },
  commentsBlock: {
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
  },
  hero: { width: '100%', height: 300, backgroundColor: '#222' },
  body: { padding: 20 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 16, color: '#111' },
  creatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#ccc',
  },
  creatorName: { fontSize: 16, fontWeight: '600', color: '#111' },
  creatorMeta: { fontSize: 13, color: '#666', marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 8,
  },
  description: { fontSize: 15, color: '#333', lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tagText: { fontSize: 13, color: '#444' },
  purchaseBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  purchaseButton: {
    flexDirection: 'row',
    backgroundColor: '#111',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownedButton: { backgroundColor: '#16a34a' },
  disabledButton: { backgroundColor: '#999' },
  purchaseButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  purchaseShadow: {
    borderRadius: 14,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  purchaseGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseGradientText: { color: '#0b3b35', fontSize: 16, fontWeight: '800' },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: { fontSize: 20, marginBottom: 2 },
  statValue: { fontSize: 17, fontWeight: '800', color: '#111' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  carousel: { gap: 10, paddingVertical: 4, paddingRight: 16 },
  otherCard: { width: 130 },
  otherThumb: {
    width: 130,
    height: 180,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  otherTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111',
    marginTop: 6,
    lineHeight: 16,
  },
});
