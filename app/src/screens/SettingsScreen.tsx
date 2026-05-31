import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Settings'>;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);

  async function handleLogout() {
    Alert.alert('Abmelden', 'Wirklich abmelden?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Abmelden',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Account löschen',
      'Das ist endgültig. Alle deine Setups, Käufe und Daten werden gelöscht.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Endgültig löschen',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Noch nicht implementiert', 'Lösch-Funktion folgt in Phase 5.');
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="back">
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Einstellungen</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Section title="Account">
          <Row
            label="Email"
            value={session?.user.email ?? '—'}
            onPress={() => {
              Alert.alert('Email ändern', 'Folgt in Phase 5');
            }}
          />
          <Row
            label="Passwort ändern"
            onPress={() => Alert.alert('Passwort', 'Folgt in Phase 5')}
          />
          <Row label="Profil bearbeiten" onPress={() => navigation.navigate('EditProfile')} />
        </Section>

        <Section title="Privatsphäre & Sicherheit">
          <ToggleRow
            label="Privater Account"
            sub="Nur Follower sehen deine Setups"
            value={privateAccount}
            onChange={setPrivateAccount}
          />
          <Row
            label="Blockierte Accounts"
            onPress={() => Alert.alert('Blockiert', 'Folgt in Phase 5')}
          />
          <Row label="Datenexport" onPress={() => Alert.alert('Datenexport', 'Folgt in Phase 5')} />
        </Section>

        <Section title="Benachrichtigungen">
          <ToggleRow
            label="Push-Benachrichtigungen"
            sub="Likes, Kommentare, Käufe"
            value={pushNotifs}
            onChange={setPushNotifs}
          />
          <ToggleRow
            label="Email-Benachrichtigungen"
            sub="Wöchentlicher Digest, wichtige Updates"
            value={emailNotifs}
            onChange={setEmailNotifs}
          />
        </Section>

        <Section title="Auszahlungen">
          <Row
            label="Stripe-Konto verbinden"
            sub="Damit Käufer dich bezahlen können"
            onPress={() => Alert.alert('Stripe Connect', 'Folgt in Phase 4.5')}
          />
          <Row
            label="Auszahlungs-Historie"
            onPress={() => Alert.alert('Historie', 'Folgt in Phase 4.5')}
          />
        </Section>

        <Section title="Über Setiq">
          <Row label="Version" value="0.1.0 (Phase 4)" />
          <Row label="AGB" onPress={() => Linking.openURL('https://setiq.net/agb')} />
          <Row
            label="Datenschutz"
            onPress={() => Linking.openURL('https://setiq.net/datenschutz')}
          />
          <Row label="Impressum" onPress={() => Linking.openURL('https://setiq.net/impressum')} />
          <Row label="Support" onPress={() => Linking.openURL('mailto:hi@setiq.net')} />
        </Section>

        <View style={styles.dangerZone}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Abmelden</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>Account löschen</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  sub,
  onPress,
}: {
  label: string;
  value?: string;
  sub?: string;
  onPress?: () => void;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {onPress && <Text style={styles.rowChevron}>›</Text>}
    </Wrapper>
  );
}

function ToggleRow({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backIcon: { fontSize: 30, color: '#111', width: 28, lineHeight: 32 },
  title: { fontSize: 17, fontWeight: '800', color: '#111' },
  scroll: { paddingBottom: 40 },
  section: { marginTop: 22 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionBody: {
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  rowLeft: { flex: 1 },
  rowLabel: { fontSize: 15, color: '#111', fontWeight: '500' },
  rowSub: { fontSize: 12, color: '#888', marginTop: 2 },
  rowValue: { fontSize: 14, color: '#666', marginLeft: 8 },
  rowChevron: { fontSize: 22, color: '#bbb', marginLeft: 6 },
  dangerZone: { paddingHorizontal: 20, marginTop: 30, gap: 10 },
  logoutBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: '#cc0000', fontSize: 15, fontWeight: '700' },
  deleteBtn: { paddingVertical: 14, alignItems: 'center' },
  deleteText: { color: '#bbb', fontSize: 12, fontWeight: '600' },
});
