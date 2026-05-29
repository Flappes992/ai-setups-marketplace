import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabase';

export function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filled = email.length > 0 && password.length > 0;

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Anmelden</Text>
          <Text style={styles.subtitle}>Willkommen zurück</Text>

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={styles.input}
            accessibilityLabel="signin-email"
          />
          <TextInput
            placeholder="Passwort"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            accessibilityLabel="signin-password"
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, !filled && styles.buttonDisabled]}
            disabled={!filled || loading}
            onPress={handleSubmit}
            accessibilityLabel="signin-submit"
            accessibilityState={{ disabled: !filled || loading }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Einloggen</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 24, gap: 12, justifyContent: 'center' },
  title: { fontSize: 30, fontWeight: '800', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 24 },
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
