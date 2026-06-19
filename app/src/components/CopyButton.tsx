import { useState } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { BRAND } from '@/theme/ThemeProvider';
import { useToast } from '@/components/Toast';

interface Props {
  /** Text to copy, or a lazy getter (built only on press — good for large prompts). */
  value: string | (() => string);
  label?: string;
  copiedLabel?: string;
  toastText?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function CopyButton({
  value,
  label = '📋 Kopieren',
  copiedLabel = '✓ Kopiert',
  toastText = 'In die Zwischenablage kopiert',
  style,
  accessibilityLabel = 'copy-button',
}: Props) {
  const toast = useToast();
  const [state, setState] = useState<'idle' | 'busy' | 'copied'>('idle');

  async function handleCopy() {
    if (state === 'busy') return;
    setState('busy');
    try {
      const text = typeof value === 'function' ? value() : value;
      await Clipboard.setStringAsync(text);
      toast.show(toastText, 'success');
      setState('copied');
      setTimeout(() => setState('idle'), 1800);
    } catch {
      toast.show('Kopieren fehlgeschlagen', 'error');
      setState('idle');
    }
  }

  return (
    <TouchableOpacity
      style={[styles.btn, style]}
      onPress={handleCopy}
      activeOpacity={0.85}
      accessibilityLabel={accessibilityLabel}
    >
      {state === 'busy' ? (
        <ActivityIndicator color="#04201c" size="small" />
      ) : (
        <Text style={styles.text}>{state === 'copied' ? copiedLabel : label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: BRAND.teal,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: '#04201c', fontSize: 15, fontWeight: '800' },
});
