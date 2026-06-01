import { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabase';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const allFilled =
    email.length > 0 &&
    username.length > 0 &&
    displayName.length > 0 &&
    password.length > 0 &&
    confirm.length > 0;

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Konto erstellen</Text>
          <Text style={styles.subtitle}>Entdecke und teile AI-Setups</Text>

          <TextInput
            selectionColor="#2DD4BF"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={styles.input}
            accessibilityLabel="signup-email"
          />
          <TextInput
            selectionColor="#2DD4BF"
            placeholder="Username (3-20 Zeichen)"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            accessibilityLabel="signup-username"
          />
          <TextInput
            selectionColor="#2DD4BF"
            placeholder="Anzeigename"
            value={displayName}
            onChangeText={setDisplayName}
            style={styles.input}
            accessibilityLabel="signup-displayname"
          />
          <TextInput
            selectionColor="#2DD4BF"
            placeholder="Passwort (min. 8 Zeichen)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            accessibilityLabel="signup-password"
          />
          <TextInput
            selectionColor="#2DD4BF"
            placeholder="Passwort bestätigen"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            style={styles.input}
            accessibilityLabel="signup-confirm"
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, !allFilled && styles.buttonDisabled]}
            disabled={!allFilled || loading}
            onPress={handleSubmit}
            accessibilityLabel="signup-submit"
            accessibilityState={{ disabled: !allFilled || loading }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Registrieren</Text>
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
