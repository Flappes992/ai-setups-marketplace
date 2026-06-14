import { useCallback, useEffect, useRef, useState } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Setup } from '@/types/setup';
import { useAuth } from '@/auth/useAuth';
import { usePurchase } from '@/hooks/usePurchase';
import { CommentsSection } from '@/components/CommentsSection';
import { ReviewSection } from '@/components/ReviewSection';
import { RoiCard } from '@/components/RoiCard';
import { BrainPackCard } from '@/components/BrainPackCard';
import { ClaudePackCard } from '@/components/ClaudePackCard';
import { TealGradient } from '@/components/TealGradient';
import { useToggleLike } from '@/hooks/useToggleLike';
import { useToggleSave } from '@/hooks/useToggleSave';
import { useComments } from '@/hooks/useComments';
import { useSetups } from '@/hooks/useSetups';
import { useFollow } from '@/hooks/useFollow';
import { useCreatorStats } from '@/hooks/useCreatorStats';
import { useConversations } from '@/hooks/useConversations';
import { useToast } from '@/components/Toast';
import { BRAND, useTheme } from '@/theme/ThemeProvider';
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
  focusComment?: boolean;
}

export function SetupDetailScreen({ setup, focusComment }: SetupDetailScreenProps) {
  const navigation = useNavigation<Nav>();
  const { palette } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [commentsY, setCommentsY] = useState(0);
  const commentInputRef = useRef<{ focus: () => void }>(null);

  useEffect(() => {
    if (!focusComment) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
      commentInputRef.current?.focus();
    }, 350);
    return () => clearTimeout(t);
  }, [focusComment, commentsY]);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    });
    return () => sub.remove();
  }, []);
  const { session } = useAuth();
  const { openOrCreate } = useConversations();
  const toast = useToast();
  const userId = session?.user?.id;
  const isOwner = userId === setup.creator.id;
  const { purchase, refetch } = usePurchase(setup.id, userId);
  const { count: likeCount } = useToggleLike(setup.id);
  const { count: saveCount } = useToggleSave(setup.id);
  const { comments } = useComments(setup.id);
  const { setups: allSetups } = useSetups();
  const { following, toggle: toggleFollow } = useFollow(setup.creator.id);
  const creatorStats = useCreatorStats(setup.creator.id);
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

  const startCheckout = useCallback(async () => {
    setBusy(true);
    try {
      // Käufer wird server-seitig aus dem Token abgeleitet — keine user_id in der URL.
      const res = await fetch(`${WEB_CHECKOUT_BASE}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ setup_id: setup.id }),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? 'Checkout fehlgeschlagen');
      await WebBrowser.openBrowserAsync(json.url);
      setPolling(true);
      await refetch();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unbekannter Fehler';
      Alert.alert('Fehler', msg);
    } finally {
      setBusy(false);
    }
  }, [session?.access_token, setup.id, refetch]);

  const handleBuy = useCallback(() => {
    if (!userId || !session?.access_token) {
      Alert.alert('Bitte erst einloggen');
      return;
    }
    // Apple-Pflicht (External Purchase, EU): Hinweis vor Weiterleitung zum externen Anbieter.
    Alert.alert(
      'Weiter zur Zahlung',
      'Der Kauf wird außerhalb des App Stores über unseren Zahlungsdienstleister Stripe ' +
        'abgewickelt. Apple ist nicht Vertragspartner und übernimmt für diesen Kauf keine ' +
        'Zahlungsabwicklung, Rückerstattung oder Support.\n\n' +
        'Mit „Weiter zu Stripe" stimmst du ausdrücklich zu, dass das Setup sofort ' +
        'bereitgestellt wird, und bestätigst, dass dein 14-tägiges Widerrufsrecht damit ' +
        'erlischt (§ 356 Abs. 5 BGB).',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Weiter zu Stripe', onPress: () => startCheckout() },
      ],
    );
  }, [userId, session?.access_token, startCheckout]);

  const handleNegotiate = useCallback(async () => {
    if (!userId) {
      Alert.alert('Bitte erst einloggen');
      return;
    }
    const cid = await openOrCreate(setup.creator.id);
    if (!cid) {
      toast.show('Konnte Chat nicht öffnen', 'error');
      return;
    }
    navigation.navigate('Conversation', {
      conversationId: cid,
      otherUserId: setup.creator.id,
      otherUsername: setup.creator.username,
      otherDisplayName: setup.creator.displayName,
      otherAvatarUrl: setup.creator.avatarUrl,
      initialText: `Hi! Ich interessiere mich für „${setup.title}" (gelistet für ${formatPriceEur(setup.priceCents)}). Da der Preis verhandelbar ist – ich würde dir ___ € anbieten. Passt das?`,
    });
  }, [userId, openOrCreate, setup, navigation, toast]);

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
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {hasVideo ? (
            <VideoView player={player} style={styles.hero} nativeControls contentFit="cover" />
          ) : (
            <Image source={{ uri: setup.videoThumbnail }} style={styles.hero} resizeMode="cover" />
          )}

          <View style={styles.body}>
            <Text style={[styles.title, { color: palette.text }]}>{setup.title}</Text>

            <View style={styles.creatorRow}>
              <TouchableOpacity
                style={styles.creatorTap}
                onPress={() =>
                  navigation.navigate('CreatorProfile', { creatorId: setup.creator.id })
                }
                accessibilityLabel={`open-creator-${setup.creator.username}`}
              >
                <Image source={{ uri: setup.creator.avatarUrl }} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.creatorName, { color: palette.text }]}>
                    {setup.creator.displayName}
                  </Text>
                  <Text style={[styles.creatorMeta, { color: palette.textSecondary }]}>
                    {creatorStats.reviewsCount > 0
                      ? `★ ${creatorStats.averageRating.toFixed(1)} (${creatorStats.reviewsCount})`
                      : '★ noch nicht bewertet'}{' '}
                    · {creatorStats.setupsCount}{' '}
                    {creatorStats.setupsCount === 1 ? 'Setup' : 'Setups'}
                  </Text>
                </View>
              </TouchableOpacity>
              {!isOwner && (
                <TouchableOpacity
                  onPress={toggleFollow}
                  style={[
                    styles.detailFollowBtn,
                    following && styles.detailFollowBtnActive,
                    following && { backgroundColor: palette.surface },
                  ]}
                  accessibilityLabel={following ? 'unfollow-detail' : 'follow-detail'}
                >
                  <Text
                    style={[
                      styles.detailFollowText,
                      following && styles.detailFollowTextActive,
                      following && { color: palette.textSecondary },
                    ]}
                  >
                    {following ? '✓ Folgst du' : '+ Folgen'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.statsRow}>
              <Stat icon="♥" value={likeCount} label="Likes" tint={BRAND.like} />
              <Stat icon="★" value={saveCount} label="Saves" tint={BRAND.teal} />
              <Stat icon="💬" value={comments.length} label="Kommentare" />
            </View>
          </View>

          {setup.assetSubtype === 'brainpack' && setup.brainManifest ? (
            <BrainPackCard manifest={setup.brainManifest} />
          ) : null}

          {setup.assetSubtype === 'claudepack' && setup.claudeManifest ? (
            <ClaudePackCard manifest={setup.claudeManifest} />
          ) : null}

          {setup.roiTimeSavedMinutes && setup.roiUseFrequency ? (
            <RoiCard
              minutesPerUse={setup.roiTimeSavedMinutes}
              frequency={setup.roiUseFrequency}
              priceCents={setup.priceCents}
            />
          ) : null}

          <View style={styles.body}>
            <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>
              Über das Setup
            </Text>
            <Text style={[styles.description, { color: palette.text }]}>{setup.description}</Text>

            <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>
              Über {setup.creator.displayName}
            </Text>
            <Text style={[styles.description, { color: palette.text }]}>{setup.creator.bio}</Text>

            <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>Tags</Text>
            <View style={styles.tagRow}>
              {setup.tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tag, { backgroundColor: palette.surface }]}
                  onPress={() => navigation.navigate('TagFeed', { tag })}
                  accessibilityLabel={`tag-${tag}`}
                >
                  <Text style={[styles.tagText, { color: palette.text }]}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>Asset-Typ</Text>
            <Text style={[styles.description, { color: palette.text }]}>
              {setup.assetType === 'clonable'
                ? 'Klonbares Template — sofort verfügbar nach Kauf'
                : 'PDF + Video-Tutorial Bundle'}
            </Text>

            {otherSetups.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>
                  Mehr von {setup.creator.displayName}
                </Text>
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
                      <Image
                        source={{ uri: s.videoThumbnail }}
                        style={[styles.otherThumb, { backgroundColor: palette.border }]}
                      />
                      <Text numberOfLines={2} style={[styles.otherTitle, { color: palette.text }]}>
                        {s.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
          </View>

          <View
            style={[
              styles.commentsBlock,
              { backgroundColor: palette.bgSecondary, borderTopColor: palette.border },
            ]}
          >
            <ReviewSection
              setupId={setup.id}
              purchaseId={purchase?.id}
              canReview={purchase?.status === 'completed'}
            />
          </View>

          <View
            style={[
              styles.commentsBlock,
              { backgroundColor: palette.bgSecondary, borderTopColor: palette.border },
            ]}
            onLayout={(e) => setCommentsY(e.nativeEvent.layout.y)}
          >
            <CommentsSection setupId={setup.id} inputRef={commentInputRef} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        style={[
          styles.purchaseBar,
          { backgroundColor: palette.bg, borderTopColor: palette.border },
        ]}
      >
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
          <>
            {setup.negotiable && (
              <TouchableOpacity
                onPress={handleNegotiate}
                style={[styles.negotiateBtn, { borderColor: palette.border }]}
                accessibilityLabel="negotiate-price"
              >
                <Text style={[styles.negotiateBtnText, { color: palette.text }]}>
                  💬 Preis vorschlagen
                </Text>
              </TouchableOpacity>
            )}
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
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.floatingBack}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityLabel="back"
      >
        <Text style={styles.floatingBackIcon}>‹</Text>
      </TouchableOpacity>
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
  const { palette } = useTheme();
  return (
    <View style={[styles.statBox, { backgroundColor: palette.bgSecondary }]}>
      <Text style={[styles.statIcon, tint ? { color: tint } : null]}>{icon}</Text>
      <Text style={[styles.statValue, { color: palette.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: palette.textSecondary }]}>{label}</Text>
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
  floatingBack: {
    position: 'absolute',
    top: 8,
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  floatingBackIcon: { color: '#fff', fontSize: 30, fontWeight: '600', lineHeight: 34, marginTop: -2 },
  body: { padding: 20 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 16, color: '#111' },
  creatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 8 },
  creatorTap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
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
  negotiateBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    marginBottom: 10,
  },
  negotiateBtnText: { fontSize: 15, fontWeight: '800' },
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
  detailFollowBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
  },
  detailFollowBtnActive: {
    backgroundColor: '#f0f0f0',
  },
  detailFollowText: { color: '#0b3b35', fontSize: 13, fontWeight: '700' },
  detailFollowTextActive: { color: '#666' },
});
