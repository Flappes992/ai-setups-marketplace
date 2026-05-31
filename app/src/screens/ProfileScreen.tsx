import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';
import { DbProfile } from '@/types/database';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { useMySetups } from '@/hooks/useMySetups';
import { useSavedSetups } from '@/hooks/useSavedSetups';
import { useLikedSetups } from '@/hooks/useLikedSetups';
import { useMyPurchases } from '@/hooks/useMyPurchases';
import { SetupGrid } from '@/components/SetupGrid';

type ProfileNav = NativeStackNavigationProp<MainStackParamList, 'Tabs'>;

type TabKey = 'setups' | 'saved' | 'liked' | 'purchases';

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: 'setups', label: 'Setups', emoji: '⊞' },
  { key: 'saved', label: 'Saved', emoji: '★' },
  { key: 'liked', label: 'Likes', emoji: '♥' },
  { key: 'purchases', label: 'Käufe', emoji: '✓' },
];

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { session } = useAuth();
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('setups');

  const mySetups = useMySetups();
  const saved = useSavedSetups();
  const liked = useLikedSetups();
  const purchases = useMyPurchases();

  const loadProfile = useCallback(async () => {
    if (!session?.user.id) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    setProfile(data as DbProfile | null);
    setLoading(false);
  }, [session?.user.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerState}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerState}>
          <Text style={styles.errorText}>Profil nicht gefunden</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = profile.display_name
    .split(' ')
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const tabData = {
    setups: mySetups.setups,
    saved: saved.setups,
    liked: liked.setups,
    purchases: purchases.items.map((p) => p.setup),
  };

  const tabEmpty = {
    setups: 'Du hast noch keine Setups hochgeladen.',
    saved: 'Noch nichts gespeichert.',
    liked: 'Noch nichts geliked.',
    purchases: 'Du hast noch nichts gekauft.',
  };

  const stats = [
    { label: 'Setups', value: mySetups.setups.length },
    { label: 'Likes', value: liked.setups.length },
    { label: 'Saved', value: saved.setups.length },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <View style={{ width: 32 }} />
        <Text style={styles.handleTop}>@{profile.username}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          accessibilityLabel="open-settings"
        >
          <Text style={styles.gearIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{initials || 'U'}</Text>
            </View>
          )}
          <Text style={styles.displayName}>{profile.display_name}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
          {profile.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : (
            <Text style={styles.bioPlaceholder}>Noch keine Bio.</Text>
          )}

          <View style={styles.statsRow}>
            {stats.map((s, i) => (
              <View key={s.label} style={styles.statContainer}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
                {i < stats.length - 1 && <View style={styles.statSep} />}
              </View>
            ))}
          </View>

          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={[styles.cta, styles.ctaPrimary]}
              onPress={() => navigation.navigate('EditProfile')}
              accessibilityLabel="edit-profile"
            >
              <Text style={styles.ctaPrimaryText}>Profil bearbeiten</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cta, styles.ctaSecondary]}
              accessibilityLabel="share-profile"
            >
              <Text style={styles.ctaSecondaryText}>↗</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabsBar}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, activeTab === t.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(t.key)}
              accessibilityLabel={`profile-tab-${t.key}`}
            >
              <Text style={[styles.tabIcon, activeTab === t.key && styles.tabIconActive]}>
                {t.emoji}
              </Text>
              <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          <SetupGrid setups={tabData[activeTab]} emptyText={tabEmpty[activeTab]} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingBottom: 100 },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: '#cc0000' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  handleTop: { fontSize: 17, fontWeight: '800', color: '#111' },
  gearIcon: { fontSize: 26, color: '#111' },
  header: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarLetter: { fontSize: 36, fontWeight: '800', color: '#fff' },
  displayName: { fontSize: 22, fontWeight: '800', color: '#111' },
  username: { fontSize: 14, color: '#666', marginTop: 2 },
  bio: {
    fontSize: 14,
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  bioPlaceholder: {
    fontSize: 13,
    color: '#bbb',
    marginTop: 12,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    gap: 12,
  },
  statContainer: { flexDirection: 'row', alignItems: 'center' },
  statSep: { width: 1, height: 24, backgroundColor: '#e5e5e5', marginLeft: 12 },
  stat: { alignItems: 'center', minWidth: 64 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#111' },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ctaRow: { flexDirection: 'row', marginTop: 22, gap: 8, width: '100%' },
  cta: {
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimary: { flex: 1, backgroundColor: '#111' },
  ctaPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  ctaSecondary: {
    width: 46,
    backgroundColor: '#f5f5f5',
  },
  ctaSecondaryText: { color: '#111', fontSize: 18, fontWeight: '700' },
  tabsBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    marginTop: 18,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 2,
  },
  tabBtnActive: { borderBottomColor: '#111' },
  tabIcon: { fontSize: 18, color: '#999' },
  tabIconActive: { color: '#111' },
  tabLabel: { fontSize: 11, color: '#999', fontWeight: '700', textTransform: 'uppercase' },
  tabLabelActive: { color: '#111' },
  tabContent: { paddingTop: 4 },
});
