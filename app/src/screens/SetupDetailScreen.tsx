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
import { Setup } from '@/types/setup';
import { useAuth } from '@/auth/useAuth';
import { usePurchase } from '@/hooks/usePurchase';
import { CommentsSection } from '@/components/CommentsSection';

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
  const { session } = useAuth();
  const userId = session?.user?.id;
  const isOwner = userId === setup.creator.id;
  const { purchase, refetch } = usePurchase(setup.id, userId);
  const [busy, setBusy] = useState(false);
  const [polling, setPolling] = useState(false);

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

          <Text style={styles.sectionTitle}>Über das Setup</Text>
          <Text style={styles.description}>{setup.description}</Text>

          <Text style={styles.sectionTitle}>Über {setup.creator.displayName}</Text>
          <Text style={styles.description}>{setup.creator.bio}</Text>

          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagRow}>
            {setup.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Asset-Typ</Text>
          <Text style={styles.description}>
            {setup.assetType === 'clonable'
              ? 'Klonbares Template — sofort verfügbar nach Kauf'
              : 'PDF + Video-Tutorial Bundle'}
          </Text>
        </View>

        <View style={styles.divider} />

        <CommentsSection setupId={setup.id} />
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
            style={styles.purchaseButton}
            activeOpacity={0.85}
            disabled={busy}
            onPress={handleBuy}
            accessibilityLabel="open-checkout"
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.purchaseButtonText}>
                Setup holen · {formatPriceEur(setup.priceCents)}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 140 },
  divider: { height: 8, backgroundColor: '#fafafa', marginVertical: 4 },
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
});
