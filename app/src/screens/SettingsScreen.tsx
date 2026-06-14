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
import { useTheme } from '@/theme/ThemeProvider';
import { useToast } from '@/components/Toast';
import { TierCard } from '@/components/TierCard';
import { StripeConnectCard } from '@/components/StripeConnectCard';
import { LEGAL_URLS, SUPPORT_EMAIL } from '@/config/legal';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Settings'>;

const WEB_CHECKOUT_BASE = 'https://web-checkout-sicci-s-projects.vercel.app';

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const { mode, setMode, palette } = useTheme();
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [autoplayVideos, setAutoplayVideos] = useState(true);

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
    if (deleting) return;
    Alert.alert(
      'Account löschen',
      'Dein Profil, deine Setups und Aktivitäten werden gelöscht bzw. anonymisiert. ' +
        'Aus steuerlichen Gründen bleiben abgeschlossene Zahlungsbelege anonymisiert erhalten. ' +
        'Das kann nicht rückgängig gemacht werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Endgültig löschen',
          style: 'destructive',
          onPress: async () => {
            const token = session?.access_token;
            if (!token) {
              Alert.alert('Fehler', 'Keine aktive Sitzung. Bitte neu anmelden.');
              return;
            }
            setDeleting(true);
            try {
              const res = await fetch(`${WEB_CHECKOUT_BASE}/api/delete-account`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) {
                const data = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(data.error ?? `HTTP ${res.status}`);
              }
              toast.show('Account gelöscht');
              await supabase.auth.signOut();
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'Unbekannter Fehler';
              Alert.alert('Löschen fehlgeschlagen', msg);
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: palette.bgSecondary }]}
      edges={['top', 'bottom']}
    >
      <View
        style={[styles.topBar, { backgroundColor: palette.bg, borderBottomColor: palette.border }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="back" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.backIcon, { color: palette.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>Einstellungen</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Section title="Mein Rang" palette={palette}>
          <TierCard />
        </Section>

        <Section title="Account" palette={palette}>
          <Row
            label="Email"
            value={session?.user.email ?? '—'}
            palette={palette}
            onPress={() => {
              Alert.alert('Email ändern', 'Folgt in Phase 5');
            }}
          />
          <Row
            label="Passwort ändern"
            palette={palette}
            onPress={() => Alert.alert('Passwort', 'Folgt in Phase 5')}
          />
          <Row
            label="Profil bearbeiten"
            palette={palette}
            onPress={() => navigation.navigate('EditProfile')}
          />
        </Section>

        <Section title="Privatsphäre & Sicherheit" palette={palette}>
          <View style={[styles.row, styles.rowDisabled, { borderBottomColor: palette.border }]}>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowLabel, styles.textMuted, { color: palette.textSecondary }]}>
                Privater Account
              </Text>
              <Text style={[styles.rowSub, { color: palette.textSecondary }]}>Bald verfügbar</Text>
            </View>
            <Switch value={false} disabled />
          </View>
          <Row
            label="Blockierte Accounts"
            palette={palette}
            onPress={() => navigation.navigate('BlockedList')}
          />
          <Row
            label="Datenexport"
            palette={palette}
            onPress={() => Alert.alert('Datenexport', 'Folgt in Phase 5')}
          />
        </Section>

        <Section title="Darstellung" palette={palette}>
          <View style={[styles.row, { borderBottomColor: palette.border }]}>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowLabel, { color: palette.text }]}>Theme</Text>
              <Text style={[styles.rowSub, { color: palette.textSecondary }]}>
                System, Hell, Dunkel
              </Text>
            </View>
            <View style={styles.themeSelector}>
              {(['system', 'light', 'dark'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => {
                    setMode(m);
                    toast.show(`Theme: ${m}`, 'success');
                  }}
                  style={[
                    styles.themeChip,
                    { backgroundColor: palette.surface },
                    mode === m && [styles.themeChipActive, { backgroundColor: palette.text }],
                  ]}
                >
                  <Text
                    style={[
                      styles.themeChipText,
                      { color: palette.textSecondary },
                      mode === m && [styles.themeChipTextActive, { color: palette.bg }],
                    ]}
                  >
                    {m === 'system' ? 'Auto' : m === 'light' ? 'Hell' : 'Dunkel'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <ToggleRow
            label="Videos automatisch abspielen"
            sub="Spart Daten wenn aus"
            value={autoplayVideos}
            onChange={setAutoplayVideos}
            palette={palette}
          />
          <ToggleRow
            label="Daten-Spar-Modus"
            sub="Niedrige Video-Qualität"
            value={dataSaver}
            onChange={setDataSaver}
            palette={palette}
          />
        </Section>

        <Section title="Benachrichtigungen" palette={palette}>
          <ToggleRow
            label="Push-Benachrichtigungen"
            sub="Likes, Kommentare, Käufe"
            value={pushNotifs}
            onChange={setPushNotifs}
            palette={palette}
          />
          <ToggleRow
            label="Email-Benachrichtigungen"
            sub="Wöchentlicher Digest, wichtige Updates"
            value={emailNotifs}
            onChange={setEmailNotifs}
            palette={palette}
          />
        </Section>

        <Section title="Zahlungen" palette={palette}>
          <StripeConnectCard />
        </Section>

        <Section title="Speicher" palette={palette}>
          <Row
            label="Cache löschen"
            sub="Lokal gespeicherte Daten zurücksetzen"
            palette={palette}
            onPress={() => {
              toast.show('Cache gelöscht', 'success');
            }}
          />
          <Row
            label="Heruntergeladene Setups"
            value="0 MB"
            palette={palette}
            onPress={() => Alert.alert('Downloads', 'Folgt in Phase 5')}
          />
        </Section>

        <Section title="Über setiq" palette={palette}>
          <Row label="Version" value="0.1.0 (Phase 4)" palette={palette} />
          <Row label="AGB" palette={palette} onPress={() => Linking.openURL(LEGAL_URLS.agb)} />
          <Row
            label="Datenschutz"
            palette={palette}
            onPress={() => Linking.openURL(LEGAL_URLS.datenschutz)}
          />
          <Row
            label="Impressum"
            palette={palette}
            onPress={() => Linking.openURL(LEGAL_URLS.impressum)}
          />
          <Row
            label="Support"
            palette={palette}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          />
        </Section>

        <View style={styles.dangerZone}>
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: palette.bg, borderColor: palette.border }]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Abmelden</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDeleteAccount}
            disabled={deleting}
          >
            <Text style={[styles.deleteText, { color: palette.textSecondary }]}>
              {deleting ? 'Lösche…' : 'Account löschen'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type Palette = ReturnType<typeof useTheme>['palette'];

function Section({
  title,
  children,
  palette,
}: {
  title: string;
  children: React.ReactNode;
  palette: Palette;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionBody, { backgroundColor: palette.bg, borderColor: palette.border }]}>
        {children}
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  sub,
  onPress,
  palette,
}: {
  label: string;
  value?: string;
  sub?: string;
  onPress?: () => void;
  palette: Palette;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[styles.row, { borderBottomColor: palette.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <Text style={[styles.rowLabel, { color: palette.text }]}>{label}</Text>
        {sub && <Text style={[styles.rowSub, { color: palette.textSecondary }]}>{sub}</Text>}
      </View>
      {value && <Text style={[styles.rowValue, { color: palette.textSecondary }]}>{value}</Text>}
      {onPress && <Text style={[styles.rowChevron, { color: palette.textSecondary }]}>›</Text>}
    </Wrapper>
  );
}

function ToggleRow({
  label,
  sub,
  value,
  onChange,
  palette,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  palette: Palette;
}) {
  return (
    <View style={[styles.row, { borderBottomColor: palette.border }]}>
      <View style={styles.rowLeft}>
        <Text style={[styles.rowLabel, { color: palette.text }]}>{label}</Text>
        {sub && <Text style={[styles.rowSub, { color: palette.textSecondary }]}>{sub}</Text>}
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
  rowDisabled: { opacity: 0.5 },
  textMuted: { color: '#888' },
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
  themeSelector: { flexDirection: 'row', gap: 4 },
  themeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  themeChipActive: { backgroundColor: '#111' },
  themeChipText: { fontSize: 12, color: '#666', fontWeight: '600' },
  themeChipTextActive: { color: '#fff' },
});
