import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';
import { DbProfile } from '@/types/database';
import type { MainStackParamList } from '@/navigation/RootNavigator';

type ProfileNav = NativeStackNavigationProp<MainStackParamList, 'Profile'>;

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator />
        ) : profile ? (
          <>
            <Text style={styles.displayName}>{profile.display_name}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
            {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
            <View style={styles.statsRow}>
              <Stat label="Setups" value={profile.setups_count.toString()} />
              <Stat label="Rating" value={profile.rating_average.toFixed(1)} />
            </View>
          </>
        ) : (
          <Text style={styles.error}>Profil nicht gefunden</Text>
        )}

        <TouchableOpacity
          style={styles.mySetupsButton}
          onPress={() => navigation.navigate('MySetups')}
          accessibilityLabel="profile-my-setups"
        >
          <Text style={styles.mySetupsText}>Meine Setups</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.myPurchasesButton}
          onPress={() => navigation.navigate('MyPurchases')}
          accessibilityLabel="profile-my-purchases"
        >
          <Text style={styles.myPurchasesText}>Meine Käufe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityLabel="profile-logout"
        >
          <Text style={styles.logoutText}>Abmelden</Text>
        </TouchableOpacity>
      </View>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 24, alignItems: 'center', paddingTop: 60 },
  displayName: { fontSize: 28, fontWeight: '800', color: '#111' },
  username: { fontSize: 16, color: '#666', marginTop: 4 },
  bio: { fontSize: 14, color: '#444', marginTop: 16, textAlign: 'center', lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 40, marginTop: 30 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#111' },
  statLabel: { fontSize: 13, color: '#666', marginTop: 2 },
  error: { fontSize: 16, color: '#cc0000' },
  mySetupsButton: {
    marginTop: 'auto',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#111',
    marginBottom: 12,
  },
  mySetupsText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  myPurchasesButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    marginBottom: 12,
  },
  myPurchasesText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  logoutButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#cc0000' },
});
