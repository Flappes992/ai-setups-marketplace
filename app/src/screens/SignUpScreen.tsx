import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/theme/ThemeProvider';
import { LEGAL_URLS } from '@/config/legal';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function SignUpScreen() {
  const { palette } = useTheme();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const allFilled =
    email.length > 0 &&
    username.length > 0 &&
    displayName.length > 0 &&
    password.length > 0 &&
    confirm.length > 0 &&
    acceptedTerms;

  async function handleSubmit() {
    setError(null);
    if (!isValidEmail(email)) {
      setError('Bitte gib eine gültige Email-Adresse ein');
      return;
    }
    if (username.length < 3 || username.length > 20) {
      setError('Username muss zwischen 3 und 20 Zeichen lang sein');
      return;
    }
    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben');
      return;
    }
    if (password !== confirm) {
      setError('Passwörter stimmen nicht überein');
      return;
    }
    if (!acceptedTerms) {
      setError('Bitte akzeptiere AGB und Datenschutzerklärung');
      return;
    }
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, display_name: displayName } },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backRow}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="back"
          >
            <Text style={[styles.backRowIcon, { color: palette.text }]}>‹ Zurück</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: palette.text }]}>Konto erstellen</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>Entdecke und teile AI-Setups</Text>

          <TextInput
            selectionColor="#2DD4BF"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={[styles.input, { backgroundColor: palette.surface, color: palette.text }]}
            accessibilityLabel="signup-email"
          />
          <TextInput
            selectionColor="#2DD4BF"
            placeholder="Username (3-20 Zeichen)"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { backgroundColor: palette.surface, color: palette.text }]}
            accessibilityLabel="signup-username"
          />
          <TextInput
            selectionColor="#2DD4BF"
            placeholder="Anzeigename"
            value={displayName}
            onChangeText={setDisplayName}
            style={[styles.input, { backgroundColor: palette.surface, color: palette.text }]}
            accessibilityLabel="signup-displayname"
          />
          <TextInput
            selectionColor="#2DD4BF"
            placeholder="Passwort (min. 8 Zeichen)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[styles.input, { backgroundColor: palette.surface, color: palette.text }]}
            accessibilityLabel="signup-password"
          />
          <TextInput
            selectionColor="#2DD4BF"
            placeholder="Passwort bestätigen"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            style={[styles.input, { backgroundColor: palette.surface, color: palette.text }]}
            accessibilityLabel="signup-confirm"
          />

          <TouchableOpacity
            style={styles.consentRow}
            onPress={() => setAcceptedTerms((v) => !v)}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptedTerms }}
            accessibilityLabel="signup-accept-terms"
          >
            <View style={[styles.checkbox, { borderColor: palette.border }, acceptedTerms && styles.checkboxChecked]}>
              {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.consentText, { color: palette.textSecondary }]}>
              Ich akzeptiere die{' '}
              <Text style={styles.link} onPress={() => Linking.openURL(LEGAL_URLS.agb)}>
                AGB
              </Text>{' '}
              und die{' '}
              <Text style={styles.link} onPress={() => Linking.openURL(LEGAL_URLS.datenschutz)}>
                Datenschutzerklärung
              </Text>
              . Setiq duldet keine anstößigen Inhalte oder missbräuchliches Verhalten.
            </Text>
          </TouchableOpacity>

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: palette.text }, !allFilled && [styles.buttonDisabled, { backgroundColor: palette.border }]]}
            disabled={!allFilled || loading}
            onPress={handleSubmit}
            accessibilityLabel="signup-submit"
            accessibilityState={{ disabled: !allFilled || loading }}
          >
            {loading ? (
              <ActivityIndicator color={palette.bg} />
            ) : (
              <Text style={[styles.buttonText, { color: palette.bg }]}>Registrieren</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24, gap: 12 },
  backRow: { alignSelf: 'flex-start', marginBottom: 4 },
  backRowIcon: { fontSize: 16, fontWeight: '600' },
  title: { fontSize: 30, fontWeight: '800', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 20 },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111',
  },
  error: { color: '#cc0000', fontSize: 14, marginTop: 6 },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: '#2DD4BF', borderColor: '#2DD4BF' },
  checkmark: { color: '#fff', fontSize: 15, fontWeight: '800', lineHeight: 18 },
  consentText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 19 },
  link: { color: '#2DD4BF', fontWeight: '700' },
  button: {
    backgroundColor: '#111',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { backgroundColor: '#999' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
