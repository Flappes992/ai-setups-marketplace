import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { useConversations, ConversationItem } from '@/hooks/useConversations';
import { BRAND } from '@/theme/ThemeProvider';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Conversations'>;

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'jetzt';
  if (min < 60) return `vor ${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `vor ${d}d`;
  return new Date(iso).toLocaleDateString('de-DE');
}

export function ConversationsListScreen() {
  const navigation = useNavigation<Nav>();
  const { items, loading, refresh } = useConversations();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nachrichten</Text>
        <View style={{ width: 30 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={BRAND.teal} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>Noch keine Nachrichten</Text>
          <Text style={styles.emptySub}>
            Tap auf das ✉-Icon auf einem Creator-Profil um zu schreiben.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <Row item={item} onPress={() => navigation.navigate('Conversation', { conversationId: item.id, otherUserId: item.otherUserId, otherUsername: item.otherUsername, otherDisplayName: item.otherDisplayName, otherAvatarUrl: item.otherAvatarUrl })} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={BRAND.teal}
              colors={[BRAND.teal]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function Row({ item, onPress }: { item: ConversationItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      {item.otherAvatarUrl ? (
        <Image source={{ uri: item.otherAvatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarLetter}>{item.otherDisplayName.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.headRow}>
          <Text style={styles.name} numberOfLines={1}>{item.otherDisplayName}</Text>
          <Text style={styles.time}>{timeAgo(item.lastMessageAt)}</Text>
        </View>
        <View style={styles.subRow}>
          <Text style={styles.preview} numberOfLines={1}>
            {item.lastMessageBody ?? `Schreib @${item.otherUsername} eine Nachricht`}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backIcon: { fontSize: 30, color: '#111', width: 30, lineHeight: 32 },
  title: { fontSize: 17, fontWeight: '800', color: '#111' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 18 },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  avatarLetter: { color: '#fff', fontWeight: '800', fontSize: 20 },
  body: { flex: 1, gap: 4 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 15, fontWeight: '700', color: '#111', flex: 1, marginRight: 8 },
  time: { fontSize: 12, color: '#999' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  preview: { fontSize: 13, color: '#666', flex: 1 },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BRAND.teal,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { color: '#0b3b35', fontSize: 11, fontWeight: '900' },
});
