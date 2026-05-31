import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';
import { DbProfile } from '@/types/database';
import type { MainStackParamList } from '@/navigation/RootNavigator';

type ProfileNav = NativeStackNavigationProp<MainStackParamList, 'Tabs'>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { session } = useAuth();
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setProfile(data as DbProfile | null);
      setLoading(false);
    }
    loadProfile();
  }, [session]);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{initials || 'U'}</Text>
          </View>
          <Text style={styles.displayName}>{profile.display_name}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          <View style={styles.statsRow}>
            <Stat label="Setups" value={profile.setups_count.toString()} />
            <View style={styles.statSep} />
            <Stat label="Rating" value={profile.rating_average.toFixed(1)} />
          </View>
        </View>

        <View style={styles.grid}>
          <Card
            emoji="📤"
            label="Meine Setups"
            sub="Eigene hochgeladene Setups"
            onPress={() => navigation.navigate('MySetups')}
            color="#111"
            textColor="#fff"
          />
          <Card
            emoji="💼"
            label="Meine Käufe"
            sub="Was du gekauft hast"
            onPress={() => navigation.navigate('MyPurchases')}
            color="#16a34a"
            textColor="#fff"
          />
          <Card
            emoji="★"
            label="Gespeichert"
            sub="Lesezeichen für später"
            onPress={() => navigation.navigate('Saved')}
            color="#facc15"
            textColor="#111"
          />
          <Card
            emoji="♥"
            label="Likes"
            sub="Setups die du geliked hast"
            onPress={() => navigation.navigate('Liked')}
            color="#ef4444"
            textColor="#fff"
          />
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityLabel="profile-logout"
        >
          <Text style={styles.logoutText}>Abmelden</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Card({
  emoji,
  label,
  sub,
  onPress,
  color,
  textColor,
}: {
  emoji: string;
  label: string;
  sub: string;
  onPress: () => void;
  color: string;
  textColor: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={`profile-card-${label}`}
    >
      <Text style={styles.cardEmoji}>{emoji}</Text>
      <View>
        <Text style={[styles.cardLabel, { color: textColor }]}>{label}</Text>
        <Text style={[styles.cardSub, { color: textColor, opacity: 0.8 }]}>{sub}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingBottom: 32 },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: '#cc0000' },
  header: { alignItems: 'center', padding: 24, paddingBottom: 20 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarLetter: { fontSize: 30, fontWeight: '800', color: '#fff' },
  displayName: { fontSize: 24, fontWeight: '800', color: '#111' },
  username: { fontSize: 15, color: '#666', marginTop: 2 },
  bio: { fontSize: 14, color: '#444', marginTop: 12, textAlign: 'center', lineHeight: 20 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    gap: 28,
  },
  statSep: { width: 1, height: 28, backgroundColor: '#e5e5e5' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#111' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2, textTransform: 'uppercase' },
  grid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    minHeight: 110,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardEmoji: { fontSize: 24 },
  cardLabel: { fontSize: 15, fontWeight: '800' },
  cardSub: { fontSize: 12, marginTop: 2 },
  logoutButton: {
    marginTop: 32,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#cc0000' },
});
