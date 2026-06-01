import { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AssetType } from '@/types/database';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { useAuth } from '@/auth/useAuth';
import { supabase } from '@/services/supabase';
import { uploadFileToStorage } from '@/services/storage';
import { useSetups } from '@/hooks/useSetups';

const DRAFT_KEY = 'setiq.upload.draft.v1';
interface UploadDraft {
  title: string;
  description: string;
  tagsInput: string;
  priceEur: string;
  assetType: AssetType;
  assetUrl: string;
}

type UploadNav = NativeStackNavigationProp<MainStackParamList, 'SetupUpload'>;

export function SetupUploadScreen() {
  const navigation = useNavigation<UploadNav>();
  const { session } = useAuth();
  const { setups: allSetups } = useSetups();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [priceEur, setPriceEur] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('clonable');
  const [assetUrl, setAssetUrl] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [bundleUri, setBundleUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const draftLoaded = useRef(false);

  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of allSetups) for (const t of s.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map((e) => e[0])
      .slice(0, 12);
  }, [allSetups]);

  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY)
      .then((raw) => {
        if (!raw) {
          draftLoaded.current = true;
          return;
        }
        try {
          const d = JSON.parse(raw) as UploadDraft;
          if (d.title) setTitle(d.title);
          if (d.description) setDescription(d.description);
          if (d.tagsInput) setTagsInput(d.tagsInput);
          if (d.priceEur) setPriceEur(d.priceEur);
          if (d.assetType) setAssetType(d.assetType);
          if (d.assetUrl) setAssetUrl(d.assetUrl);
        } catch {
          // ignore
        }
        draftLoaded.current = true;
      })
      .catch(() => {
        draftLoaded.current = true;
      });
  }, []);

  useEffect(() => {
    if (!draftLoaded.current) return;
    const draft: UploadDraft = { title, description, tagsInput, priceEur, assetType, assetUrl };
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft)).catch(() => {});
  }, [title, description, tagsInput, priceEur, assetType, assetUrl]);

  function addTagSuggestion(tag: string) {
    const existing = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (existing.includes(tag)) return;
    const next = [...existing, tag].join(', ');
    setTagsInput(next);
  }

  const videoPlayer = useVideoPlayer(videoUri ?? '', (player) => {
    player.loop = true;
    player.muted = true;
  });

  const tagsArray = tagsInput
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);

  const priceCents = Math.round(parseFloat(priceEur.replace(',', '.')) * 100) || 0;

  const valid =
    !!videoUri &&
    title.trim().length >= 3 &&
    description.trim().length >= 20 &&
    tagsArray.length >= 1 &&
    priceCents >= 500 &&
    (assetType === 'clonable' ? assetUrl.startsWith('https://') : !!bundleUri);

  async function pickVideo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'videos',
      videoMaxDuration: 60,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  }

  async function pickBundle() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'video/*'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      setBundleUri(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    if (!session?.user?.id || !videoUri) return;
    setSubmitting(true);
    try {
      const videoUpload = await uploadFileToStorage(
        'setup-videos',
        videoUri,
        session.user.id,
        'mp4',
      );

      const { uri: thumbnailLocalUri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 1000,
        quality: 0.7,
      });
      const thumbnailUpload = await uploadFileToStorage(
        'setup-videos',
        thumbnailLocalUri,
        session.user.id,
        'jpg' as 'mp4',
      );

      let finalAssetUrl: string;
      if (assetType === 'tutorial_bundle') {
        if (!bundleUri) throw new Error('Bundle-Datei fehlt');
        const assetUpload = await uploadFileToStorage(
          'setup-assets',
          bundleUri,
          session.user.id,
          'pdf',
        );
        finalAssetUrl = assetUpload.publicUrl;
      } else {
        finalAssetUrl = assetUrl;
      }

      const { error: insertError } = await supabase.from('setups').insert({
        creator_id: session.user.id,
        title: title.trim(),
        description: description.trim(),
        video_url: videoUpload.publicUrl,
        video_thumbnail: thumbnailUpload.publicUrl,
        asset_type: assetType,
        asset_url: finalAssetUrl,
        price_cents: priceCents,
        currency: 'EUR',
        tags: tagsArray,
        status: 'live',
      });
      if (insertError) throw new Error(insertError.message);

      await AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
      Alert.alert('Live!', 'Dein Setup ist veröffentlicht.', [
        { text: 'OK', onPress: () => navigation.popToTop() },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unbekannter Fehler';
      Alert.alert('Fehler', msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Neues Setup</Text>

          <Section label="Video">
            {videoUri ? (
              <View>
                <VideoView
                  player={videoPlayer}
                  style={styles.videoPreview}
                  nativeControls={false}
                  contentFit="cover"
                />
                <TouchableOpacity onPress={pickVideo} style={styles.secondaryButton}>
                  <Text style={styles.secondaryText}>Anderes Video wählen</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickVideo}
                style={styles.pickerArea}
                accessibilityLabel="upload-video-pick"
              >
                <Text style={styles.pickerText}>Video aus Gallery wählen</Text>
                <Text style={styles.pickerHint}>max. 60 Sek vertikal</Text>
              </TouchableOpacity>
            )}
          </Section>

          <Section label="Titel">
            <TextInput
              selectionColor="#2DD4BF"
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
              selectionColor="#2DD4BF"
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
              selectionColor="#2DD4BF"
              placeholder="z.B. claude, n8n, automation"
              value={tagsInput}
              onChangeText={setTagsInput}
              autoCapitalize="none"
              style={styles.input}
              accessibilityLabel="upload-tags"
            />
            {topTags.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestRow}
                keyboardShouldPersistTaps="handled"
              >
                {topTags
                  .filter((t) => !tagsArray.includes(t))
                  .map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => addTagSuggestion(t)}
                      style={styles.suggestChip}
                      accessibilityLabel={`suggest-${t}`}
                    >
                      <Text style={styles.suggestText}>+ #{t}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            )}
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
                selectionColor="#2DD4BF"
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
            <Section label="Bundle-Datei (PDF oder Video)">
              <TouchableOpacity
                onPress={pickBundle}
                style={styles.pickerArea}
                accessibilityLabel="upload-pick-bundle"
              >
                <Text style={styles.pickerText}>
                  {bundleUri ? 'Datei gewählt — ändern' : 'PDF oder Video wählen'}
                </Text>
              </TouchableOpacity>
            </Section>
          )}

          <Section label="Preis (€)">
            <TextInput
              selectionColor="#2DD4BF"
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
            disabled={!valid || submitting}
            onPress={handleSubmit}
            accessibilityLabel="upload-submit"
            accessibilityState={{ disabled: !valid || submitting }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Veröffentlichen</Text>
            )}
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
  pickerArea: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  pickerText: { color: '#111', fontSize: 15, fontWeight: '600' },
  pickerHint: { color: '#888', fontSize: 12, marginTop: 4 },
  videoPreview: {
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 360,
    borderRadius: 12,
    backgroundColor: '#000',
  },
  secondaryButton: { marginTop: 8, alignItems: 'center' },
  secondaryText: { color: '#666', fontSize: 14 },
  suggestRow: { gap: 6, paddingVertical: 8, paddingRight: 8 },
  suggestChip: {
    backgroundColor: 'rgba(45,212,191,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  suggestText: { fontSize: 12, color: '#0b3b35', fontWeight: '700' },
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
