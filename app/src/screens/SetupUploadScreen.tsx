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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AssetType } from '@/types/database';

export function SetupUploadScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [priceEur, setPriceEur] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('clonable');
  const [assetUrl, setAssetUrl] = useState('');

  const tagsArray = tagsInput
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);

  const priceCents = Math.round(parseFloat(priceEur.replace(',', '.')) * 100) || 0;

  const valid =
    title.trim().length >= 3 &&
    description.trim().length >= 20 &&
    tagsArray.length >= 1 &&
    priceCents >= 500 &&
    (assetType === 'clonable' ? assetUrl.startsWith('https://') : true);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Neues Setup</Text>

          <Section label="Video">
            <View style={styles.videoPlaceholder}>
              <Text style={styles.placeholderText}>Video-Picker kommt in Task 2</Text>
            </View>
          </Section>

          <Section label="Titel">
            <TextInput
              placeholder="z.B. Cold-Email Automation mit Claude"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              accessibilityLabel="upload-title"
              maxLength={80}
            />
            <Text style={styles.hint}>{title.length}/80</Text>
          </Section>

          <Section label="Beschreibung">
            <TextInput
              placeholder="Was macht dein Setup besonders?"
              value={description}
              onChangeText={setDescription}
              multiline
              style={[styles.input, styles.textarea]}
              accessibilityLabel="upload-description"
              maxLength={500}
            />
            <Text style={styles.hint}>{description.length}/500 (min. 20)</Text>
          </Section>

          <Section label="Tags (Komma-getrennt)">
            <TextInput
              placeholder="z.B. claude, n8n, automation"
              value={tagsInput}
              onChangeText={setTagsInput}
              autoCapitalize="none"
              style={styles.input}
              accessibilityLabel="upload-tags"
            />
            {tagsArray.length > 0 && (
              <View style={styles.tagPreview}>
                {tagsArray.map((t) => (
                  <View key={t} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>#{t}</Text>
                  </View>
                ))}
              </View>
            )}
          </Section>

          <Section label="Asset-Typ">
            <View style={styles.switchRow}>
              <TouchableOpacity
                onPress={() => setAssetType('clonable')}
                style={[styles.switchOption, assetType === 'clonable' && styles.switchActive]}
                accessibilityLabel="upload-type-clonable"
              >
                <Text
                  style={[styles.switchText, assetType === 'clonable' && styles.switchTextActive]}
                >
                  Klonbares Template
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAssetType('tutorial_bundle')}
                style={[
                  styles.switchOption,
                  assetType === 'tutorial_bundle' && styles.switchActive,
                ]}
                accessibilityLabel="upload-type-bundle"
              >
                <Text
                  style={[
                    styles.switchText,
                    assetType === 'tutorial_bundle' && styles.switchTextActive,
                  ]}
                >
                  PDF + Video Bundle
                </Text>
              </TouchableOpacity>
            </View>
          </Section>

          {assetType === 'clonable' ? (
            <Section label="Klonbarer Link (https://...)">
              <TextInput
                placeholder="https://chat.openai.com/g/g-XXXX"
                value={assetUrl}
                onChangeText={setAssetUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={styles.input}
                accessibilityLabel="upload-asset-url"
              />
            </Section>
          ) : (
            <Section label="Asset-Files">
              <View style={styles.videoPlaceholder}>
                <Text style={styles.placeholderText}>PDF + Video Upload kommt in Task 4</Text>
              </View>
            </Section>
          )}

          <Section label="Preis (€)">
            <TextInput
              placeholder="z.B. 29.00"
              value={priceEur}
              onChangeText={setPriceEur}
              keyboardType="decimal-pad"
              style={styles.input}
              accessibilityLabel="upload-price"
            />
            <Text style={styles.hint}>Mindestpreis: 5,00 €</Text>
          </Section>

          <TouchableOpacity
            style={[styles.submit, !valid && styles.submitDisabled]}
            disabled={!valid}
            accessibilityLabel="upload-submit"
            accessibilityState={{ disabled: !valid }}
          >
            <Text style={styles.submitText}>Veröffentlichen</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Mit dem Veröffentlichen bestätigst du, dass du Rechteinhaber des Inhalts bist.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, gap: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#111', marginBottom: 12 },
  section: { marginBottom: 18 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  hint: { fontSize: 12, color: '#888', marginTop: 4 },
  videoPlaceholder: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: { color: '#999', fontSize: 14 },
  tagPreview: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tagChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagChipText: { fontSize: 12, color: '#333' },
  switchRow: { flexDirection: 'row', gap: 8 },
  switchOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  switchActive: { backgroundColor: '#111' },
  switchText: { color: '#444', fontWeight: '600', fontSize: 13 },
  switchTextActive: { color: '#fff' },
  submit: {
    backgroundColor: '#111',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitDisabled: { backgroundColor: '#999' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disclaimer: { fontSize: 12, color: '#888', marginTop: 12, textAlign: 'center' },
});
