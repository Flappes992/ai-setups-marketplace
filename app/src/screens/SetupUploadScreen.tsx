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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type {
  AssetType,
  BrainVaultType,
  ClaudeCommand,
  ClaudeAgent,
  ClaudeTargetEnv,
} from '@/types/database';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { useAuth } from '@/auth/useAuth';
import { supabase } from '@/services/supabase';
import { uploadFileToStorage } from '@/services/storage';
import { useSetups } from '@/hooks/useSetups';
import { useMyTier } from '@/hooks/useMyTier';
import { evaluateAchievementsFor } from '@/hooks/useAchievements';
import { CreatorUploadGuide } from '@/components/CreatorUploadGuide';
import { BRAND, useTheme } from '@/theme/ThemeProvider';

const DRAFT_KEY = 'setiq.upload.draft.v1';

type TipKey =
  | 'setup-art'
  | 'title'
  | 'description'
  | 'tags'
  | 'asset-type'
  | 'asset-url'
  | 'bundle-file'
  | 'brainpack-file'
  | 'vault-type'
  | 'note-count'
  | 'folder-tree'
  | 'cp-targets'
  | 'cp-persona'
  | 'cp-commands'
  | 'cp-agents'
  | 'price'
  | 'roi';

const FIELD_TIPS: Record<TipKey, { title: string; what: string; why: string }> = {
  'setup-art': {
    title: 'Setup-Art',
    what: 'Drei verschiedene Pakete: Standard (Klonbare Templates oder PDF-Bundles), BrainPack (Vault-Knowledge), ClaudePack (Personas + Commands + Subagents).',
    why: 'Die richtige Wahl bestimmt wie dein Setup im Marketplace präsentiert wird — Käufer filtern danach und sehen passende Vorschau-Karten. Falsch eingeordnet = niemand findet es.',
  },
  title: {
    title: 'Titel',
    what: 'Max 80 Zeichen. Der erste und manchmal einzige Text den Käufer im Feed lesen.',
    why: 'Konkret + Nutzen schlägt clever. „Cold-Email Closer GPT" konvertiert 2–3× besser als „Mein AI-Tool". Im Feed entscheiden die ersten 5 Worte ob jemand stoppt oder weiterswipt.',
  },
  description: {
    title: 'Beschreibung',
    what: 'Min 20, max 500 Zeichen. Erscheint auf der Detail-Seite unter dem Video.',
    why: 'Beantworte „was kriege ich nach dem Kauf?" — nicht „was kann das Setup?". Käufer entscheidet hier ob er den Kauf-Button drückt. Klare Liste schlägt Marketing-Bla.',
  },
  tags: {
    title: 'Tags',
    what: 'Komma-getrennte Stichwörter. Mind. 1, am besten 3-5.',
    why: 'Tags steuern wo dein Setup auftaucht: in der Suche, im Concierge-Empfehlungssystem, in Trending. Ohne passende Tags wirst du nur gefunden wenn jemand exakt deinen Titel sucht.',
  },
  'asset-type': {
    title: 'Asset-Typ',
    what: 'Klonbares Template = ein Link (z.B. Custom-GPT-URL). PDF/Video-Bundle = du lädst die Datei hoch.',
    why: 'Klonbar = sofort einsetzbar nach Kauf, niedrigere Support-Last. Bundles haben höhere Preis-Akzeptanz aber mehr Käufer-Fragen.',
  },
  'asset-url': {
    title: 'Klonbarer Link',
    what: 'Die URL die der Käufer nach Kauf bekommt — z.B. ein Custom-GPT-Link, ein Notion-Template-Share-Link oder ein Make-Szenario-Klon-Link.',
    why: 'Stelle sicher dass der Link öffentlich „klonbar" ist (nicht privat). Falscher Link = sofort Refund + 1-Stern-Review.',
  },
  'bundle-file': {
    title: 'Bundle-Datei',
    what: 'PDF (Tutorials, Frameworks) oder Video (Walkthroughs, Demos).',
    why: 'Bundles können €19–99 verkaufen — höhere Margen. Aber: Mehrwert muss über dem Video deutlich sein. Wir hosten die Datei für dich.',
  },
  'brainpack-file': {
    title: 'BrainPack-Datei',
    what: 'Dein Vault als .zip — Obsidian-Ordner, Logseq-Graph, etc. Ohne persönliche Notizen, nur die Struktur + Templates.',
    why: 'Käufer bekommen sofort einen einsatzfähigen Knowledge-Vault den sie an Claude/Cursor andocken. Hohe Wertwahrnehmung, da Käufer-Zeitersparnis schnell sichtbar.',
  },
  'vault-type': {
    title: 'Vault-Typ',
    what: 'Welches Tool wurde verwendet — Obsidian, Logseq oder ein anderes Markdown-Tool.',
    why: 'Käufer filtern nach Tool. Wer kein Obsidian benutzt, kauft kein Obsidian-Vault. Klare Angabe → richtige Käufer → weniger Refunds.',
  },
  'note-count': {
    title: 'Anzahl Notizen',
    what: 'Wie viele Notizen sind im Vault enthalten.',
    why: 'Käufer wollen wissen ob sie ein „leeres Template" oder ein „kuratiertes Wissens-System" kaufen. 50+ Notizen rechtfertigen höhere Preise (€50+).',
  },
  'folder-tree': {
    title: 'Ordner-Tree',
    what: 'Die Hauptordner-Struktur als Textliste (eine Zeile pro Ordner).',
    why: 'Schafft Vertrauen: Käufer sieht VOR Kauf wie der Vault aufgebaut ist. Black-Box-Käufe konvertieren schlecht; Transparenz = Conversion.',
  },
  'cp-targets': {
    title: 'Funktioniert in',
    what: 'Wo dein Pack einsetzbar ist: Claude Code (CLI), Claude.ai Projects (Web), Claude Desktop.',
    why: 'Käufer wählen je nach Tool. Multi-Target erhöht die Käuferzahl. Falsch deklariert = Refund-Risiko.',
  },
  'cp-persona': {
    title: 'Persona',
    what: 'System-Prompt der Claudes Verhalten prägt. Project-Scope = nur in einem Projekt, Global = in jeder Claude-Session.',
    why: 'Eine gute Persona spart Käufern wochenlanges Prompt-Engineering. Sie wirkt jedes Mal wenn Claude antwortet — der höchste Hebel-Effekt überhaupt.',
  },
  'cp-commands': {
    title: 'Slash-Commands',
    what: 'Benutzerdefinierte Kürzel wie /standup, /review-pr. Trigger + Markdown-Body. Max 5 pro Pack.',
    why: 'Slash-Commands automatisieren wiederkehrende Aufgaben. Käufer denken in „Minuten gespart pro Tag" — gut gebaute Commands zahlen sich täglich zurück.',
  },
  'cp-agents': {
    title: 'Subagents',
    what: 'Spezialisierte Agents mit eigenem Auftrag (z.B. code-reviewer, seo-writer). Max 3 pro Pack.',
    why: 'Subagents = parallel arbeitende Spezialisten. Wer einen guten code-reviewer hat, schraubt seine PR-Quality dauerhaft hoch. Hohe Recurring-Value-Wahrnehmung.',
  },
  price: {
    title: 'Preis',
    what: 'In Euro, Komma als Dezimaltrenner. Mindestpreis 5,00 € (Creator+ darf auch 0 €).',
    why: 'Sweet-Spot für ersten Verkauf: 9–19 €. Zu billig = Käufer zweifeln an Qualität. Zu teuer = niemand riskiert. Nach 5 Verkäufen iterierst du nach oben.',
  },
  roi: {
    title: 'ROI für Käufer',
    what: 'Wie viele Minuten dein Setup pro Nutzung spart und wie oft es genutzt wird.',
    why: 'Auf der Detail-Seite wird daraus „Du sparst X Std/Monat" angezeigt — extrem starker Conversion-Trigger. Setups mit ROI-Angabe konvertieren laut interner Daten ~30 % besser.',
  },
};
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
  const { palette } = useTheme();
  const { session } = useAuth();
  const { setups: allSetups } = useSetups();
  const { tier } = useMyTier();
  const isPlusCreator = tier === 'creator_plus';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [priceEur, setPriceEur] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('clonable');
  const [assetUrl, setAssetUrl] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [bundleUri, setBundleUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [roiMinutes, setRoiMinutes] = useState('');
  const [roiFrequency, setRoiFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'one_time' | null>(
    null,
  );
  const [mode, setMode] = useState<'standard' | 'skill' | 'brainpack' | 'claudepack'>('standard');
  const [brainpackUri, setBrainpackUri] = useState<string | null>(null);
  const [bpVaultType, setBpVaultType] = useState<BrainVaultType>('obsidian');
  const [bpNoteCount, setBpNoteCount] = useState('');
  const [bpTreeInput, setBpTreeInput] = useState('');
  // ClaudePack state
  const [cpPersonaTitle, setCpPersonaTitle] = useState('');
  const [cpPersonaBody, setCpPersonaBody] = useState('');
  const [cpPersonaScope, setCpPersonaScope] = useState<'project' | 'global'>('project');
  const [cpCommands, setCpCommands] = useState<ClaudeCommand[]>([
    { trigger: '', summary: '', body: '' },
  ]);
  const [cpAgents, setCpAgents] = useState<ClaudeAgent[]>([]);
  const [cpTargets, setCpTargets] = useState<ClaudeTargetEnv[]>([
    'claude-code',
    'claude-projects',
  ]);
  const [guideOpen, setGuideOpen] = useState(false);
  const [activeTip, setActiveTip] = useState<TipKey | null>(null);
  const [videoTipVisible, setVideoTipVisible] = useState(false);
  const videoTipShown = useRef(false);
  const [negotiable, setNegotiable] = useState(false);
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

  const tagsArray = (() => {
    const explicit = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
    if (mode === 'brainpack') {
      const auto = ['brainpack', `vault-${bpVaultType}`];
      for (const t of auto) if (!explicit.includes(t)) explicit.push(t);
    }
    if (mode === 'claudepack') {
      const auto = ['claudepack', 'claude'];
      for (const t of cpTargets) auto.push(t);
      for (const t of auto) if (!explicit.includes(t)) explicit.push(t);
    }
    if (mode === 'skill') {
      if (!explicit.includes('skill')) explicit.push('skill');
    }
    return explicit;
  })();

  const priceCents = Math.round(parseFloat(priceEur.replace(',', '.')) * 100) || 0;

  const minPrice = 500;
  const bpNoteCountNum = Number(bpNoteCount) || 0;
  const validBrainpack = !!brainpackUri && bpNoteCountNum >= 1;

  const validCommands = cpCommands.filter(
    (c) => c.trigger.trim().length > 0 && c.body.trim().length > 0,
  );
  const validAgents = cpAgents.filter(
    (a) => a.name.trim().length > 0 && a.body.trim().length > 0,
  );
  const hasPersona = cpPersonaBody.trim().length >= 20 && cpPersonaTitle.trim().length > 0;
  const validClaudepack =
    cpTargets.length > 0 && (hasPersona || validCommands.length > 0 || validAgents.length > 0);

  function updateCommand(i: number, patch: Partial<ClaudeCommand>) {
    setCpCommands((arr) => arr.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function addCommand() {
    if (cpCommands.length >= 5) return;
    setCpCommands((arr) => [...arr, { trigger: '', summary: '', body: '' }]);
  }
  function removeCommand(i: number) {
    setCpCommands((arr) => arr.filter((_, idx) => idx !== i));
  }
  function updateAgent(i: number, patch: Partial<ClaudeAgent>) {
    setCpAgents((arr) => arr.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }
  function addAgent() {
    if (cpAgents.length >= 3) return;
    setCpAgents((arr) => [...arr, { name: '', summary: '', body: '' }]);
  }
  function removeAgent(i: number) {
    setCpAgents((arr) => arr.filter((_, idx) => idx !== i));
  }
  function toggleTarget(t: ClaudeTargetEnv) {
    setCpTargets((arr) => (arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]));
  }
  const validStandard =
    assetType === 'clonable' ? assetUrl.startsWith('https://') : !!bundleUri;
  const valid =
    !!videoUri &&
    title.trim().length >= 3 &&
    description.trim().length >= 20 &&
    tagsArray.length >= 1 &&
    priceCents >= minPrice &&
    (mode === 'brainpack'
      ? validBrainpack
      : mode === 'claudepack'
        ? validClaudepack
        : validStandard);

  async function pickVideo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'videos',
      videoMaxDuration: 60,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
      // Einmaliger Vertrauens-Nudge beim ersten Video
      if (!videoTipShown.current) {
        videoTipShown.current = true;
        setVideoTipVisible(true);
      }
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

  async function pickBrainpack() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/zip', 'application/x-zip-compressed', '*/*'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      setBrainpackUri(result.assets[0].uri);
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
      let finalAssetType: AssetType = assetType;
      let assetSubtype: 'brainpack' | 'claudepack' | 'skill' | null = null;
      let brainManifest: object | null = null;
      let claudeManifest: object | null = null;

      if (mode === 'claudepack') {
        finalAssetUrl = '';
        finalAssetType = 'clonable';
        assetSubtype = 'claudepack';
        const packId = title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 48) || `pack-${Date.now()}`;
        claudeManifest = {
          id: packId,
          manifest_version: 1,
          target_envs: cpTargets,
          personas: hasPersona
            ? [
                {
                  title: cpPersonaTitle.trim(),
                  scope: cpPersonaScope,
                  body: cpPersonaBody.trim(),
                },
              ]
            : [],
          commands: validCommands.map((c) => ({
            trigger: c.trigger.trim().startsWith('/') ? c.trigger.trim() : '/' + c.trigger.trim(),
            summary: c.summary.trim(),
            body: c.body.trim(),
          })),
          agents: validAgents.map((a) => ({
            name: a.name.trim(),
            summary: a.summary.trim(),
            body: a.body.trim(),
          })),
        };
      } else if (mode === 'brainpack') {
        if (!brainpackUri) throw new Error('BrainPack-Datei fehlt');
        const bpUpload = await uploadFileToStorage(
          'setup-assets',
          brainpackUri,
          session.user.id,
          'zip' as 'pdf',
        );
        finalAssetUrl = bpUpload.publicUrl;
        finalAssetType = 'clonable';
        assetSubtype = 'brainpack';
        brainManifest = {
          vault_type: bpVaultType,
          structure: 'custom',
          note_count: bpNoteCountNum,
          folder_tree_preview: bpTreeInput
            .split('\n')
            .map((s) => s.replace(/\t/g, '  '))
            .filter((s) => s.trim().length > 0)
            .slice(0, 50),
        };
      } else if (assetType === 'tutorial_bundle') {
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

      // Skill nutzt die Standard-Asset-Eingabe (Datei/Link), wird aber als Skill markiert
      if (mode === 'skill') assetSubtype = 'skill';

      const { error: insertError } = await supabase.from('setups').insert({
        creator_id: session.user.id,
        title: title.trim(),
        description: description.trim(),
        video_url: videoUpload.publicUrl,
        video_thumbnail: thumbnailUpload.publicUrl,
        asset_type: finalAssetType,
        asset_url: finalAssetUrl,
        price_cents: priceCents,
        negotiable: isPlusCreator ? negotiable : false,
        currency: 'EUR',
        tags: tagsArray,
        status: 'live',
        roi_time_saved_minutes: roiMinutes ? Number(roiMinutes) : null,
        roi_use_frequency: roiFrequency,
        asset_subtype: assetSubtype,
        brain_manifest: brainManifest,
        claude_manifest: claudeManifest,
      });
      if (insertError) throw new Error(insertError.message);

      await AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
      evaluateAchievementsFor(session.user.id);
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

  const switchOptionTheme = { backgroundColor: palette.surface };
  // Aktiver Toggle = Teal-Pill (statt palette.text/weiß → war im Dark Mode weiß-auf-weiß)
  const switchActiveTheme = { backgroundColor: palette.accent };
  const switchTextTheme = { color: palette.textSecondary };
  const inputTheme = { backgroundColor: palette.surface, color: palette.text };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <CreatorUploadGuide forceVisible={guideOpen} onClose={() => setGuideOpen(false)} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="close-upload"
            >
              <Text style={[styles.closeBtnText, { color: palette.text }]}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: palette.text }]}>Neues Setup</Text>
            <TouchableOpacity
              onPress={() => setGuideOpen(true)}
              style={styles.helpBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="show-upload-guide"
            >
              <Text style={styles.helpBtnText}>?</Text>
            </TouchableOpacity>
          </View>

          <Section label="Setup-Art" onTipPress={() => setActiveTip('setup-art')}>
            <View style={styles.switchRow}>
              <TouchableOpacity
                onPress={() => setMode('standard')}
                style={[
                  styles.switchOption,
                  switchOptionTheme,
                  mode === 'standard' && styles.switchActive,
                  mode === 'standard' && switchActiveTheme,
                ]}
                accessibilityLabel="mode-standard"
              >
                <Text
                  style={[
                    styles.switchText,
                    switchTextTheme,
                    mode === 'standard' && styles.switchTextActive,
                  ]}
                >
                  Standard
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMode('skill')}
                style={[
                  styles.switchOption,
                  switchOptionTheme,
                  mode === 'skill' && styles.switchActive,
                  mode === 'skill' && switchActiveTheme,
                ]}
                accessibilityLabel="mode-skill"
              >
                <Text
                  style={[
                    styles.switchText,
                    switchTextTheme,
                    mode === 'skill' && styles.switchTextActive,
                  ]}
                >
                  🧩 Skill
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMode('brainpack')}
                style={[
                  styles.switchOption,
                  switchOptionTheme,
                  mode === 'brainpack' && styles.switchActive,
                  mode === 'brainpack' && switchActiveTheme,
                ]}
                accessibilityLabel="mode-brainpack"
              >
                <Text
                  style={[
                    styles.switchText,
                    switchTextTheme,
                    mode === 'brainpack' && styles.switchTextActive,
                  ]}
                >
                  🧠 BrainPack
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMode('claudepack')}
                style={[
                  styles.switchOption,
                  switchOptionTheme,
                  mode === 'claudepack' && styles.switchActive,
                  mode === 'claudepack' && switchActiveTheme,
                ]}
                accessibilityLabel="mode-claudepack"
              >
                <Text
                  style={[
                    styles.switchText,
                    switchTextTheme,
                    mode === 'claudepack' && styles.switchTextActive,
                  ]}
                >
                  🪐 ClaudePack
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.hint, { color: palette.textSecondary }]}>
              {mode === 'brainpack'
                ? 'Komplettes Vault (Obsidian / Logseq / …) für AI-Kontext'
                : mode === 'claudepack'
                  ? 'Persona + Slash-Commands + Subagents für Claude'
                  : mode === 'skill'
                    ? 'Eine Fähigkeit, die du für Claude/Agents gebaut hast – als Datei oder klonbarer Link'
                    : 'Custom GPT, Prompt-Stack, n8n-Workflow, Tutorial-Bundle'}
            </Text>
          </Section>

          <Section label="Video (wird im Feed angezeigt)">
            {videoUri ? (
              <View>
                <VideoView
                  player={videoPlayer}
                  style={styles.videoPreview}
                  nativeControls={false}
                  contentFit="cover"
                />
                <TouchableOpacity onPress={pickVideo} style={styles.secondaryButton}>
                  <Text style={[styles.secondaryText, { color: palette.textSecondary }]}>
                    Anderes Video wählen
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickVideo}
                style={[styles.pickerArea, { backgroundColor: palette.surface, borderColor: palette.border }]}
                accessibilityLabel="upload-video-pick"
              >
                <Text style={[styles.pickerText, { color: palette.text }]}>
                  Video aus Gallery wählen
                </Text>
                <Text style={[styles.pickerHint, { color: palette.textSecondary }]}>
                  max. 60 Sek vertikal
                </Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.videoHint, { color: palette.textSecondary }]}>
              Präsentiere dein Value kurz und knapp mit einem Video.
            </Text>
          </Section>

          <Section label="Titel" onTipPress={() => setActiveTip('title')}>
            <TextInput
              selectionColor="#2DD4BF"
              placeholder="z.B. Cold-Email Automation mit Claude"
              placeholderTextColor={palette.textSecondary}
              value={title}
              onChangeText={setTitle}
              style={[styles.input, inputTheme]}
              accessibilityLabel="upload-title"
              maxLength={80}
            />
            <Text style={[styles.hint, { color: palette.textSecondary }]}>{title.length}/80</Text>
          </Section>

          <Section label="Beschreibung" onTipPress={() => setActiveTip('description')}>
            <TextInput
              selectionColor="#2DD4BF"
              placeholder="Was macht dein Setup besonders?"
              placeholderTextColor={palette.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              style={[styles.input, styles.textarea, inputTheme]}
              accessibilityLabel="upload-description"
              maxLength={500}
            />
            <Text style={[styles.hint, { color: palette.textSecondary }]}>
              {description.length}/500 (min. 20)
            </Text>
          </Section>

          <Section label="Tags (Komma-getrennt)" onTipPress={() => setActiveTip('tags')}>
            <TextInput
              selectionColor="#2DD4BF"
              placeholder="z.B. claude, n8n, automation"
              placeholderTextColor={palette.textSecondary}
              value={tagsInput}
              onChangeText={setTagsInput}
              autoCapitalize="none"
              style={[styles.input, inputTheme]}
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
                  <View key={t} style={[styles.tagChip, { backgroundColor: palette.surface }]}>
                    <Text style={[styles.tagChipText, { color: palette.text }]}>#{t}</Text>
                  </View>
                ))}
              </View>
            )}
          </Section>

          {(mode === 'standard' || mode === 'skill') && (
            <>
              <Section label="Asset-Typ" onTipPress={() => setActiveTip('asset-type')}>
                <View style={styles.switchRow}>
                  <TouchableOpacity
                    onPress={() => setAssetType('clonable')}
                    style={[
                      styles.switchOption,
                      switchOptionTheme,
                      assetType === 'clonable' && styles.switchActive,
                      assetType === 'clonable' && switchActiveTheme,
                    ]}
                    accessibilityLabel="upload-type-clonable"
                  >
                    <Text
                      style={[
                        styles.switchText,
                        switchTextTheme,
                        assetType === 'clonable' && styles.switchTextActive,
                      ]}
                    >
                      Klonbares Template
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setAssetType('tutorial_bundle')}
                    style={[
                      styles.switchOption,
                      switchOptionTheme,
                      assetType === 'tutorial_bundle' && styles.switchActive,
                      assetType === 'tutorial_bundle' && switchActiveTheme,
                    ]}
                    accessibilityLabel="upload-type-bundle"
                  >
                    <Text
                      style={[
                        styles.switchText,
                        switchTextTheme,
                        assetType === 'tutorial_bundle' && styles.switchTextActive,
                      ]}
                    >
                      PDF + Video Bundle
                    </Text>
                  </TouchableOpacity>
                </View>
              </Section>

              {assetType === 'clonable' ? (
                <Section
                  label="Klonbarer Link (https://...)"
                  onTipPress={() => setActiveTip('asset-url')}
                >
                  <TextInput
                    selectionColor="#2DD4BF"
                    placeholder="https://chat.openai.com/g/g-XXXX"
                    placeholderTextColor={palette.textSecondary}
                    value={assetUrl}
                    onChangeText={setAssetUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    style={[styles.input, inputTheme]}
                    accessibilityLabel="upload-asset-url"
                  />
                </Section>
              ) : (
                <Section
                  label="Bundle-Datei (PDF oder Video)"
                  onTipPress={() => setActiveTip('bundle-file')}
                >
                  <TouchableOpacity
                    onPress={pickBundle}
                    style={[styles.pickerArea, { backgroundColor: palette.surface, borderColor: palette.border }]}
                    accessibilityLabel="upload-pick-bundle"
                  >
                    <Text style={[styles.pickerText, { color: palette.text }]}>
                      {bundleUri ? 'Datei gewählt — ändern' : 'PDF oder Video wählen'}
                    </Text>
                  </TouchableOpacity>
                </Section>
              )}
            </>
          )}

          {mode === 'brainpack' && (
            <>
              <Section
                label="BrainPack-Datei (.zip)"
                onTipPress={() => setActiveTip('brainpack-file')}
              >
                <TouchableOpacity
                  onPress={pickBrainpack}
                  style={[styles.pickerArea, { backgroundColor: palette.surface, borderColor: palette.border }]}
                  accessibilityLabel="upload-pick-brainpack"
                >
                  <Text style={[styles.pickerText, { color: palette.text }]}>
                    {brainpackUri ? 'BrainPack gewählt — ändern' : 'Vault-Ordner als .zip wählen'}
                  </Text>
                  <Text style={[styles.pickerHint, { color: palette.textSecondary }]}>
                    Pack dein Vault als .zip (ohne persönliche Notizen)
                  </Text>
                </TouchableOpacity>
              </Section>

              <Section label="Vault-Typ" onTipPress={() => setActiveTip('vault-type')}>
                <View style={styles.switchRow}>
                  {(
                    [
                      ['obsidian', 'Obsidian'],
                      ['logseq', 'Logseq'],
                      ['custom', 'Andere'],
                    ] as const
                  ).map(([val, label]) => (
                    <TouchableOpacity
                      key={val}
                      onPress={() => setBpVaultType(val)}
                      style={[
                        styles.switchOption,
                        switchOptionTheme,
                        bpVaultType === val && styles.switchActive,
                        bpVaultType === val && switchActiveTheme,
                      ]}
                      accessibilityLabel={`bp-vault-${val}`}
                    >
                      <Text
                        style={[
                          styles.switchText,
                          switchTextTheme,
                          bpVaultType === val && styles.switchTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Section>

              <Section label="Anzahl Notizen" onTipPress={() => setActiveTip('note-count')}>
                <TextInput
                  selectionColor="#2DD4BF"
                  placeholder="z.B. 84"
                  placeholderTextColor={palette.textSecondary}
                  value={bpNoteCount}
                  onChangeText={setBpNoteCount}
                  keyboardType="number-pad"
                  style={[styles.input, inputTheme]}
                  accessibilityLabel="bp-note-count"
                />
              </Section>

              <Section
                label="Ordner-Tree-Preview (optional, eine pro Zeile)"
                onTipPress={() => setActiveTip('folder-tree')}
              >
                <TextInput
                  selectionColor="#2DD4BF"
                  placeholder={'00 Inbox\n01 Projects\n02 Areas\n03 Resources\n04 Archive'}
                  placeholderTextColor={palette.textSecondary}
                  value={bpTreeInput}
                  onChangeText={setBpTreeInput}
                  multiline
                  style={[styles.input, styles.textarea, inputTheme]}
                  autoCapitalize="none"
                  accessibilityLabel="bp-tree"
                />
              </Section>
            </>
          )}

          {mode === 'claudepack' && (
            <>
              <Section
                label="Funktioniert in (mind. 1)"
                onTipPress={() => setActiveTip('cp-targets')}
              >
                <View style={styles.switchRow}>
                  {(
                    [
                      ['claude-code', 'Claude Code'],
                      ['claude-projects', 'Projects'],
                      ['claude-desktop', 'Desktop'],
                    ] as const
                  ).map(([val, label]) => (
                    <TouchableOpacity
                      key={val}
                      onPress={() => toggleTarget(val)}
                      style={[
                        styles.switchOption,
                        switchOptionTheme,
                        cpTargets.includes(val) && styles.switchActive,
                        cpTargets.includes(val) && switchActiveTheme,
                      ]}
                      accessibilityLabel={`cp-target-${val}`}
                    >
                      <Text
                        style={[
                          styles.switchText,
                          switchTextTheme,
                          cpTargets.includes(val) && styles.switchTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Section>

              <Section label="🧑 Persona (optional)" onTipPress={() => setActiveTip('cp-persona')}>
                <TextInput
                  selectionColor="#2DD4BF"
                  placeholder={'Persona-Name, z.B. „Cold-Email Closer"'}
                  placeholderTextColor={palette.textSecondary}
                  value={cpPersonaTitle}
                  onChangeText={setCpPersonaTitle}
                  style={[styles.input, inputTheme]}
                  accessibilityLabel="cp-persona-title"
                  maxLength={60}
                />
                <View style={[styles.switchRow, { marginTop: 6 }]}>
                  {(
                    [
                      ['project', 'Projekt-Scope'],
                      ['global', 'Global (CLAUDE.md)'],
                    ] as const
                  ).map(([val, label]) => (
                    <TouchableOpacity
                      key={val}
                      onPress={() => setCpPersonaScope(val)}
                      style={[
                        styles.switchOption,
                        switchOptionTheme,
                        cpPersonaScope === val && styles.switchActive,
                        cpPersonaScope === val && switchActiveTheme,
                      ]}
                      accessibilityLabel={`cp-persona-scope-${val}`}
                    >
                      <Text
                        style={[
                          styles.switchText,
                          switchTextTheme,
                          cpPersonaScope === val && styles.switchTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  selectionColor="#2DD4BF"
                  placeholder={'Du bist ein erfahrener … (mind. 20 Zeichen wenn ausgefüllt)'}
                  placeholderTextColor={palette.textSecondary}
                  value={cpPersonaBody}
                  onChangeText={setCpPersonaBody}
                  multiline
                  style={[styles.input, styles.textarea, inputTheme, { marginTop: 6 }]}
                  accessibilityLabel="cp-persona-body"
                />
              </Section>

              <Section
                label={`⚡ Slash-Commands (${cpCommands.length}/5)`}
                onTipPress={() => setActiveTip('cp-commands')}
              >
                {cpCommands.map((c, i) => (
                  <View key={i} style={[styles.cpItemBox, { backgroundColor: palette.bgSecondary }]}>
                    <View style={styles.cpItemHeader}>
                      <Text style={[styles.cpItemLabel, { color: palette.textSecondary }]}>
                        Command {i + 1}
                      </Text>
                      {cpCommands.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removeCommand(i)}
                          accessibilityLabel={`cp-cmd-remove-${i}`}
                        >
                          <Text style={styles.cpRemoveText}>entfernen</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <TextInput
                      selectionColor="#2DD4BF"
                      placeholder="Trigger, z.B. /standup"
                      placeholderTextColor={palette.textSecondary}
                      value={c.trigger}
                      onChangeText={(t) => updateCommand(i, { trigger: t })}
                      autoCapitalize="none"
                      style={[styles.input, inputTheme]}
                      accessibilityLabel={`cp-cmd-trigger-${i}`}
                    />
                    <TextInput
                      selectionColor="#2DD4BF"
                      placeholder="Kurzbeschreibung"
                      placeholderTextColor={palette.textSecondary}
                      value={c.summary}
                      onChangeText={(t) => updateCommand(i, { summary: t })}
                      style={[styles.input, inputTheme, { marginTop: 6 }]}
                      accessibilityLabel={`cp-cmd-summary-${i}`}
                    />
                    <TextInput
                      selectionColor="#2DD4BF"
                      placeholder={'Command-Body als Markdown\n\nz.B. "Du bist ein Standup-Bot. Fasse meinen Tag zusammen…"'}
                      placeholderTextColor={palette.textSecondary}
                      value={c.body}
                      onChangeText={(t) => updateCommand(i, { body: t })}
                      multiline
                      style={[styles.input, styles.textarea, inputTheme, { marginTop: 6 }]}
                      accessibilityLabel={`cp-cmd-body-${i}`}
                    />
                  </View>
                ))}
                {cpCommands.length < 5 && (
                  <TouchableOpacity
                    onPress={addCommand}
                    style={[styles.cpAddBtn, { borderColor: palette.border }]}
                    accessibilityLabel="cp-cmd-add"
                  >
                    <Text style={[styles.cpAddText, { color: palette.textSecondary }]}>
                      + Command hinzufügen
                    </Text>
                  </TouchableOpacity>
                )}
              </Section>

              <Section
                label={`🤖 Subagents (${cpAgents.length}/3)`}
                onTipPress={() => setActiveTip('cp-agents')}
              >
                {cpAgents.map((a, i) => (
                  <View key={i} style={[styles.cpItemBox, { backgroundColor: palette.bgSecondary }]}>
                    <View style={styles.cpItemHeader}>
                      <Text style={[styles.cpItemLabel, { color: palette.textSecondary }]}>
                        Agent {i + 1}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeAgent(i)}
                        accessibilityLabel={`cp-agent-remove-${i}`}
                      >
                        <Text style={styles.cpRemoveText}>entfernen</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      selectionColor="#2DD4BF"
                      placeholder="Name, z.B. code-reviewer"
                      placeholderTextColor={palette.textSecondary}
                      value={a.name}
                      onChangeText={(t) => updateAgent(i, { name: t })}
                      autoCapitalize="none"
                      style={[styles.input, inputTheme]}
                      accessibilityLabel={`cp-agent-name-${i}`}
                    />
                    <TextInput
                      selectionColor="#2DD4BF"
                      placeholder="Kurzbeschreibung"
                      placeholderTextColor={palette.textSecondary}
                      value={a.summary}
                      onChangeText={(t) => updateAgent(i, { summary: t })}
                      style={[styles.input, inputTheme, { marginTop: 6 }]}
                      accessibilityLabel={`cp-agent-summary-${i}`}
                    />
                    <TextInput
                      selectionColor="#2DD4BF"
                      placeholder={'Agent-Body als Markdown (System-Prompt + Anweisungen)'}
                      placeholderTextColor={palette.textSecondary}
                      value={a.body}
                      onChangeText={(t) => updateAgent(i, { body: t })}
                      multiline
                      style={[styles.input, styles.textarea, inputTheme, { marginTop: 6 }]}
                      accessibilityLabel={`cp-agent-body-${i}`}
                    />
                  </View>
                ))}
                {cpAgents.length < 3 && (
                  <TouchableOpacity
                    onPress={addAgent}
                    style={[styles.cpAddBtn, { borderColor: palette.border }]}
                    accessibilityLabel="cp-agent-add"
                  >
                    <Text style={[styles.cpAddText, { color: palette.textSecondary }]}>
                      + Subagent hinzufügen
                    </Text>
                  </TouchableOpacity>
                )}
              </Section>
            </>
          )}

          <Section label="Preis (€)" onTipPress={() => setActiveTip('price')}>
            <TextInput
              selectionColor="#2DD4BF"
              placeholder="z.B. 29.00"
              placeholderTextColor={palette.textSecondary}
              value={priceEur}
              onChangeText={setPriceEur}
              keyboardType="decimal-pad"
              style={[styles.input, inputTheme]}
              accessibilityLabel="upload-price"
            />
            <Text style={[styles.hint, { color: palette.textSecondary }]}>
              Mindestpreis: 5,00 €
            </Text>
            {isPlusCreator && (
              <TouchableOpacity
                onPress={() => setNegotiable((v) => !v)}
                style={[
                  styles.negotiableToggle,
                  { borderColor: palette.border },
                  negotiable && {
                    borderColor: palette.accent,
                    backgroundColor: 'rgba(45,212,191,0.08)',
                  },
                ]}
                accessibilityLabel="toggle-negotiable"
              >
                <View
                  style={[
                    styles.negotiableCheck,
                    { borderColor: palette.border },
                    negotiable && { backgroundColor: palette.accent, borderColor: palette.accent },
                  ]}
                >
                  {negotiable && <Text style={styles.negotiableCheckMark}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.negotiableTitle, { color: palette.text }]}>
                    💎 Preis verhandelbar
                  </Text>
                  <Text style={[styles.negotiableSub, { color: palette.textSecondary }]}>
                    Creator+: Käufer können dir ein Angebot machen — so erkennst du echtes
                    Kaufinteresse.
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </Section>

          <Section
            label="ROI für Käufer (optional, aber Conversion-Booster)"
            onTipPress={() => setActiveTip('roi')}
          >
            <TextInput
              selectionColor="#2DD4BF"
              placeholder="Minuten gespart pro Nutzung (z.B. 15)"
              placeholderTextColor={palette.textSecondary}
              value={roiMinutes}
              onChangeText={setRoiMinutes}
              keyboardType="number-pad"
              style={[styles.input, inputTheme]}
              accessibilityLabel="upload-roi-minutes"
            />
            <View style={[styles.switchRow, { marginTop: 8 }]}>
              {(
                [
                  ['daily', 'Täglich'],
                  ['weekly', 'Wöchentlich'],
                  ['monthly', 'Monatlich'],
                  ['one_time', 'Einmalig'],
                ] as const
              ).map(([val, label]) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setRoiFrequency(val)}
                  style={[
                    styles.switchOption,
                    switchOptionTheme,
                    roiFrequency === val && styles.switchActive,
                    roiFrequency === val && switchActiveTheme,
                  ]}
                  accessibilityLabel={`upload-roi-${val}`}
                >
                  <Text
                    style={[
                      styles.switchText,
                      switchTextTheme,
                      roiFrequency === val && styles.switchTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.hint, { color: palette.textSecondary }]}>
              Käufer sehen damit „Du sparst X Std/Monat" — krasser Sales-Trigger.
            </Text>
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

          <Text style={[styles.disclaimer, { color: palette.textSecondary }]}>
            Mit dem Veröffentlichen bestätigst du, dass du Rechteinhaber des Inhalts bist.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={activeTip !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveTip(null)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.tipBackdrop}
          activeOpacity={1}
          onPress={() => setActiveTip(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.tipSheet}>
            {activeTip && (
              <>
                <Text style={styles.tipModalTitle}>{FIELD_TIPS[activeTip].title}</Text>
                <Text style={styles.tipModalSubtitle}>Was du angeben sollst</Text>
                <Text style={styles.tipModalBody}>{FIELD_TIPS[activeTip].what}</Text>
                <Text style={styles.tipModalSubtitle}>Was es dir bringt</Text>
                <Text style={styles.tipModalBody}>{FIELD_TIPS[activeTip].why}</Text>
                <TouchableOpacity
                  onPress={() => setActiveTip(null)}
                  style={styles.tipClose}
                  accessibilityLabel="close-tip"
                >
                  <Text style={styles.tipCloseText}>Verstanden</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Vertrauens-Nudge nach Video-Auswahl */}
      <Modal
        visible={videoTipVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVideoTipVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.tipBackdrop}
          activeOpacity={1}
          onPress={() => setVideoTipVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.tipSheet}>
            <Text style={styles.tipModalTitle}>Dein Video verkauft 🎬</Text>
            <Text style={styles.tipModalBody}>
              Käufer entscheiden in den ersten Sekunden. Ein Video, das Vertrauen
              weckt, verkauft deutlich mehr als ein hektischer Screen-Mitschnitt.
            </Text>
            <Text style={styles.tipModalSubtitle}>So weckst du Vertrauen</Text>
            {[
              'Zeig dein Gesicht oder deine Stimme — echte Menschen wirken glaubwürdig',
              'Zeig das Ergebnis, nicht nur den Aufbau',
              'Erste 3 Sekunden: sag klar, was es bringt',
              'Ruhige Hand, gutes Licht, vertikal gefilmt',
              'Ehrlich statt übertrieben — überzeugt am Ende mehr',
            ].map((tip) => (
              <View key={tip} style={styles.videoTipRow}>
                <Text style={styles.videoTipBullet}>›</Text>
                <Text style={styles.videoTipText}>{tip}</Text>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => setVideoTipVisible(false)}
              style={styles.tipClose}
              accessibilityLabel="close-video-tip"
            >
              <Text style={styles.tipCloseText}>Verstanden</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function Section({
  label,
  children,
  onTipPress,
}: {
  label: string;
  children: React.ReactNode;
  onTipPress?: () => void;
}) {
  const { palette } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionLabelRow}>
        <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>{label}</Text>
        {onTipPress && (
          <TouchableOpacity
            onPress={onTipPress}
            style={styles.tipBtn}
            accessibilityLabel={`tip-${label}`}
            hitSlop={14}
          >
            <Text style={styles.tipBtnText}>?</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, gap: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#111', marginBottom: 12 },
  section: { marginBottom: 18 },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tipBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#181B22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBtnText: {
    color: '#5EEAD4',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 13,
  },
  videoHint: { fontSize: 12, color: '#888', marginTop: 6, fontStyle: 'italic' },
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
  switchTextActive: { color: '#04201c' },
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
  cpItemBox: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    gap: 4,
  },
  cpItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cpItemLabel: { fontSize: 11, fontWeight: '800', color: '#666', textTransform: 'uppercase' },
  cpRemoveText: { fontSize: 11, color: '#cc3344', fontWeight: '700' },
  cpAddBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: 6,
  },
  cpAddText: { color: '#666', fontWeight: '700', fontSize: 13 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 22, fontWeight: '500', lineHeight: 26 },
  helpBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#181B22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBtnText: { color: BRAND.tealLight, fontSize: 16, fontWeight: '900' },
  tipBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tipSheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#181B22',
    borderRadius: 18,
    padding: 22,
  },
  tipModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  tipModalSubtitle: {
    color: BRAND.tealLight,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 6,
  },
  tipModalBody: {
    color: '#ddd',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  tipClose: {
    marginTop: 16,
    backgroundColor: BRAND.teal,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tipCloseText: { color: '#0b3b35', fontWeight: '800', fontSize: 14 },
  videoTipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 7 },
  videoTipBullet: { color: BRAND.teal, fontSize: 13, fontWeight: '900', lineHeight: 18 },
  videoTipText: { color: '#9aa3ad', fontSize: 12.5, lineHeight: 18, flex: 1 },
  negotiableToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  negotiableCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  negotiableCheckMark: { color: '#04201c', fontSize: 13, fontWeight: '900' },
  negotiableTitle: { fontSize: 14, fontWeight: '800' },
  negotiableSub: { fontSize: 12, lineHeight: 16, marginTop: 2 },
});
