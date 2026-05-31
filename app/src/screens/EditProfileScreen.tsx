import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';
import { DbProfile } from '@/types/database';
import { uploadAvatar } from '@/services/avatarUpload';
import { useToast } from '@/components/Toast';

type Nav = NativeStackNavigationProp<MainStackParamList, 'EditProfile'>;

export function EditProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const toast = useToast();

  useEffect(() => {
    async function load() {
      if (!session?.user.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (data) {
        const p = data as DbProfile;
        setProfile(p);
        setDisplayName(p.display_name);
        setUsername(p.username);
        setBio(p.bio ?? '');
        setAvatarUrl(p.avatar_url);
      }
      setLoading(false);
    }
    load();
  }, [session?.user.id]);

  async function handlePickAvatar() {
    if (!session?.user.id) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Fotozugriff nötig', 'Erlaube Setiq Zugriff auf deine Fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    setPickingAvatar(true);
    try {
      const url = await uploadAvatar(result.assets[0].uri, session.user.id);
      setAvatarUrl(url);
      toast.show('Avatar aktualisiert', 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload fehlgeschlagen';
      toast.show(msg, 'error');
    } finally {
      setPickingAvatar(false);
    }
  }

  async function handleSave() {
    if (!session?.user.id) return;
    if (displayName.trim().length < 2) {
      Alert.alert('Name zu kurz', 'Mindestens 2 Zeichen');
      return;
    }
    if (username.trim().length < 3 || username.trim().length > 20) {
      Alert.alert('Username', 'Muss zwischen 3 und 20 Zeichen lang sein');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      })
      .eq('id', session.user.id);
    setSaving(false);
    if (error) {
      Alert.alert('Fehler', error.message);
      return;
    }
    toast.show('Profil gespeichert', 'success');
    navigation.goBack();
  }

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerState}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  const initials = displayName
    .split(' ')
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="back">
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profil bearbeiten</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} accessibilityLabel="save-profile">
          {saving ? <ActivityIndicator /> : <Text style={styles.saveBtn}>Speichern</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={handlePickAvatar}
              disabled={pickingAvatar}
              accessibilityLabel="pick-avatar"
              style={styles.avatarWrap}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>{initials || 'U'}</Text>
                </View>
              )}
              <View style={styles.avatarBadge}>
                {pickingAvatar ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.avatarBadgeText}>📷</Text>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarChange} onPress={handlePickAvatar}>
              <Text style={styles.avatarChangeText}>Avatar ändern</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formSection}>
            <Label text="Anzeigename" />
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.input}
              placeholder="Dein Name"
              maxLength={40}
              accessibilityLabel="edit-displayname"
            />

            <Label text="Username" />
            <TextInput
              value={username}
              onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              style={styles.input}
              autoCapitalize="none"
              placeholder="username"
              maxLength={20}
              accessibilityLabel="edit-username"
            />
            <Text style={styles.hint}>3-20 Zeichen, Buchstaben + Zahlen + _</Text>

            <Label text="Bio" />
            <TextInput
              value={bio}
              onChangeText={setBio}
              style={[styles.input, styles.textarea]}
              placeholder="Was machst du? AI-Stack, Tools, Use-Cases…"
              multiline
              maxLength={160}
              accessibilityLabel="edit-bio"
            />
            <Text style={styles.hint}>{bio.length}/160</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backIcon: { fontSize: 30, color: '#111', width: 28, lineHeight: 32 },
  title: { fontSize: 17, fontWeight: '800', color: '#111' },
  saveBtn: { fontSize: 15, fontWeight: '700', color: '#facc15' },
  scroll: { paddingBottom: 32 },
  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#eee' },
  avatarLetter: { color: '#fff', fontSize: 38, fontWeight: '800' },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#facc15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarBadgeText: { fontSize: 14 },
  avatarChange: { marginTop: 12 },
  avatarChangeText: { color: '#666', fontSize: 13, fontWeight: '600' },
  formSection: { paddingHorizontal: 20, gap: 0 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111',
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: '#aaa', marginTop: 6 },
});
