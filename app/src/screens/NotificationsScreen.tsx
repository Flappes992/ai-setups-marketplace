import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useNotifications, NotificationItem } from '@/hooks/useNotifications';
import { useToast } from '@/components/Toast';
import { BRAND, useTheme } from '@/theme/ThemeProvider';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Notifications'>;

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `vor ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `vor ${min} Min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `vor ${d}d`;
  return new Date(iso).toLocaleDateString('de-DE');
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function buildLine(n: NotificationItem): { icon: string; title: string; sub: string } {
  const handle = `@${n.actorUsername}`;
  switch (n.type) {
    case 'follow':
      return { icon: '⬡', title: 'Neuer Follower', sub: `${handle} folgt dir jetzt` };
    case 'like':
      return {
        icon: '♥',
        title: 'Neuer Like',
        sub: `${handle} hat „${n.setupTitle ?? 'dein Setup'}" geliked`,
      };
    case 'comment':
      return {
        icon: '💬',
        title: 'Neuer Kommentar',
        sub: `${handle}: „${(n.body ?? '').slice(0, 80)}${(n.body ?? '').length > 80 ? '…' : ''}"`,
      };
    case 'purchase':
      return {
        icon: '💰',
        title: 'Neuer Kauf',
        sub: `${handle} hat „${n.setupTitle ?? 'dein Setup'}" gekauft${n.amountCents ? ` (+${formatPrice(Math.round(n.amountCents * 0.85))})` : ''}`,
      };
  }
}

export function NotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const { palette } = useTheme();
  const { markSeen } = useUnreadNotifications();
  const { items, loading, refetch } = useNotifications();
  const toast = useToast();
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    import('@react-native-async-storage/async-storage').then(({ default: AS }) => {
      AS.getItem('setiq.notifications.lastSeenAt').then(setLastSeenAt);
    });
  }, []);

  useEffect(() => {
    markSeen();
  }, [markSeen]);

  async function handleMarkRead() {
    await markSeen();
    setLastSeenAt(new Date().toISOString());
    toast.show('Alles gelesen', 'success');
  }

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  function isUnread(n: NotificationItem): boolean {
    if (!lastSeenAt) return true;
    return Date.parse(n.createdAt) > Date.parse(lastSeenAt);
  }

  function onItemPress(n: NotificationItem) {
    if (n.setupId) {
      // best-effort: nav to setup detail via creator profile lookup
      navigation.navigate('CreatorProfile', { creatorId: n.actorId });
    } else {
      navigation.navigate('CreatorProfile', { creatorId: n.actorId });
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
      <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="back">
          <Text style={[styles.backIcon, { color: palette.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>Aktivität</Text>
        <TouchableOpacity onPress={handleMarkRead} accessibilityLabel="mark-all-read">
          <Text style={styles.markRead}>Alle gelesen</Text>
        </TouchableOpacity>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.empty}>
          <ActivityIndicator color={BRAND.teal} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={BRAND.teal}
            />
          }
          renderItem={({ item }) => {
            const line = buildLine(item);
            const unread = isUnread(item);
            return (
              <TouchableOpacity
                onPress={() => onItemPress(item)}
                style={[styles.row, { borderBottomColor: palette.border }, unread && styles.rowUnread]}
                accessibilityLabel={`notif-${item.id}`}
              >
                {item.actorAvatarUrl ? (
                  <Image source={{ uri: item.actorAvatarUrl }} style={[styles.avatar, { backgroundColor: palette.border }]} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarLetter}>
                      {item.actorDisplayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={[styles.iconBadge, { backgroundColor: palette.bg, borderColor: palette.bg }]}>
                  <Text style={styles.iconBadgeText}>{line.icon}</Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={[styles.rowTitle, { color: palette.text }]}>{line.title}</Text>
                  <Text style={[styles.rowSub, { color: palette.textSecondary }]} numberOfLines={2}>
                    {line.sub}
                  </Text>
                  <Text style={[styles.rowTime, { color: palette.textSecondary }]}>{timeAgo(item.createdAt)}</Text>
                </View>
                {unread && <View style={styles.dot} />}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={[styles.emptyText, { color: palette.text }]}>Noch keine Aktivität.</Text>
              <Text style={[styles.emptySub, { color: palette.textSecondary }]}>
                Sobald jemand dir folgt, liked, kommentiert oder kauft, taucht es hier auf.
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backIcon: { fontSize: 30, color: '#111', width: 28, lineHeight: 32 },
  title: { fontSize: 17, fontWeight: '800', color: '#111' },
  markRead: { fontSize: 13, color: BRAND.tealDark, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  rowUnread: { backgroundColor: 'rgba(45,212,191,0.06)' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eee' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  avatarLetter: { color: '#fff', fontWeight: '800', fontSize: 18 },
  iconBadge: {
    position: 'absolute',
    left: 48,
    top: 38,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  iconBadgeText: { fontSize: 12 },
  rowBody: { flex: 1, gap: 2, marginLeft: 4 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  rowSub: { fontSize: 13, color: '#444' },
  rowTime: { fontSize: 12, color: '#999', marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND.teal },
  empty: { paddingTop: 60, paddingHorizontal: 32, alignItems: 'center' },
  emptyEmoji: { fontSize: 50, marginBottom: 14 },
  emptyText: { color: '#111', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
