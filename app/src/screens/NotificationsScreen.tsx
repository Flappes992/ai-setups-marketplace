import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Notifications'>;

interface NotificationItem {
  id: string;
  icon: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const SAMPLE: NotificationItem[] = [
  {
    id: '1',
    icon: '♥',
    title: 'Neuer Like',
    body: '@maya_workflows hat dein Setup geliked',
    time: 'vor 5 Min',
    read: false,
  },
  {
    id: '2',
    icon: '💼',
    title: 'Neuer Kauf',
    body: 'Jemand hat dein Cold-Email-Setup gekauft (+24,65 €)',
    time: 'vor 2h',
    read: false,
  },
  {
    id: '3',
    icon: '💬',
    title: 'Neuer Kommentar',
    body: '@lukas_ai: „Krass — funktioniert das auch auf Deutsch?"',
    time: 'vor 1d',
    read: true,
  },
  {
    id: '4',
    icon: '⬡',
    title: 'Neuer Follower',
    body: '@finn_codes folgt dir jetzt',
    time: 'vor 3d',
    read: true,
  },
];

export function NotificationsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="back">
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Aktivität</Text>
        <TouchableOpacity accessibilityLabel="mark-all-read">
          <Text style={styles.markRead}>Alle gelesen</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={SAMPLE}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.row, !item.read && styles.rowUnread]}>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowSub} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={styles.rowTime}>{item.time}</Text>
            </View>
            {!item.read && <View style={styles.dot} />}
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Noch keine Aktivität.</Text>
          </View>
        )}
      />
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
  markRead: { fontSize: 13, color: '#666', fontWeight: '600' },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  rowUnread: { backgroundColor: '#fffdf2' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  rowSub: { fontSize: 13, color: '#444' },
  rowTime: { fontSize: 12, color: '#999', marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2DD4BF' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#999' },
});
