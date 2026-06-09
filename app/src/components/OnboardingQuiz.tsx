import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';
import { BRAND } from '@/theme/ThemeProvider';

const KEY = 'setiq.quiz.v1.done';
const WELCOME_KEY = 'setiq.onboarded.v1';

const { height: SCREEN_H } = Dimensions.get('window');

type SingleChoice = { kind: 'single'; key: string; question: string; options: { value: string; label: string }[] };
type MultiChoice = { kind: 'multi'; key: string; question: string; options: { value: string; label: string }[] };
type Slide = { kind: 'intro' } | SingleChoice | MultiChoice;

const SLIDES: Slide[] = [
  { kind: 'intro' },
  {
    kind: 'single',
    key: 'ai_frequency',
    question: 'Wie oft nutzt du AI im Alltag?',
    options: [
      { value: 'daily', label: 'Täglich (Pro)' },
      { value: 'weekly', label: 'Mehrmals die Woche' },
      { value: 'monthly', label: 'Paar Mal im Monat' },
      { value: 'starting', label: 'Bin grad am Einsteigen' },
    ],
  },
  {
    kind: 'multi',
    key: 'ai_tools',
    question: 'Welche AI-Tools nutzt du?',
    options: [
      { value: 'chatgpt', label: 'ChatGPT' },
      { value: 'claude', label: 'Claude (Anthropic)' },
      { value: 'gemini', label: 'Gemini / Google AI' },
      { value: 'perplexity', label: 'Perplexity' },
      { value: 'midjourney', label: 'Midjourney' },
      { value: 'dalle', label: 'DALL-E / Sora' },
      { value: 'cursor', label: 'Cursor / Copilot' },
      { value: 'notion_ai', label: 'Notion AI' },
      { value: 'app_builders', label: 'Lovable / v0 / Bolt' },
      { value: 'automation', label: 'n8n / Zapier / Make' },
      { value: 'voice', label: 'ElevenLabs / Suno' },
      { value: 'local', label: 'Lokale LLMs (Ollama, LM Studio)' },
      { value: 'none', label: 'Noch keine — bin neu' },
    ],
  },
  {
    kind: 'multi',
    key: 'interests',
    question: 'Wofür interessierst du dich auf setiq?',
    options: [
      { value: 'custom_gpts', label: 'Custom GPTs / Claudes' },
      { value: 'prompt_stacks', label: 'Prompt-Stacks' },
      { value: 'workflows', label: 'n8n / Zapier-Workflows' },
      { value: 'coding', label: 'Coding & Dev' },
      { value: 'marketing', label: 'Marketing & Sales' },
      { value: 'content', label: 'Content-Creation' },
      { value: 'visual', label: 'Bild & Video' },
      { value: 'voice', label: 'Voice & Audio' },
      { value: 'tutorials', label: 'Tutorials zum Lernen' },
      { value: 'business', label: 'Business-Automatisierung' },
    ],
  },
  {
    kind: 'single',
    key: 'goal',
    question: 'Was möchtest du mit AI erreichen?',
    options: [
      { value: 'time', label: 'Zeit sparen / Effizienz' },
      { value: 'money', label: 'Geld verdienen (eigene Projekte)' },
      { value: 'quality', label: 'Bessere Outputs (Content, Code)' },
      { value: 'learn', label: 'Neue Skills lernen' },
    ],
  },
  {
    kind: 'single',
    key: 'discovery',
    question: 'Wo hast du setiq entdeckt?',
    options: [
      { value: 'tiktok', label: 'TikTok' },
      { value: 'instagram', label: 'Instagram' },
      { value: 'twitter', label: 'X (Twitter)' },
      { value: 'youtube', label: 'YouTube' },
      { value: 'referral', label: 'Empfehlung von Bekannten' },
      { value: 'reddit', label: 'Reddit' },
      { value: 'other', label: 'Sonst woher' },
    ],
  },
];

export function OnboardingQuiz() {
  const { session } = useAuth();
  const [visible, setVisible] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    (async () => {
      const [doneFlag, welcomeFlag] = await Promise.all([
        AsyncStorage.getItem(KEY),
        AsyncStorage.getItem(WELCOME_KEY),
      ]);
      // Quiz wird gezeigt nachdem WelcomeSheet einmal weg ist
      if (!doneFlag && welcomeFlag) setVisible(true);
    })();
  }, [session?.user?.id]);

  function close() {
    AsyncStorage.setItem(KEY, '1').catch(() => {});
    setVisible(false);
    setIdx(0);
  }

  function skipAll() {
    Haptics.selectionAsync();
    close();
  }

  async function finish() {
    if (!session?.user?.id) {
      close();
      return;
    }
    setSubmitting(true);
    await supabase
      .from('profiles')
      .update({ preferences: { ...answers, completed_at: new Date().toISOString() } })
      .eq('id', session.user.id);
    setSubmitting(false);
    close();
  }

  async function nextSlide() {
    Haptics.selectionAsync();
    if (idx >= SLIDES.length - 1) {
      await finish();
      return;
    }
    setIdx((i) => i + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function setSingle(key: string, value: string) {
    Haptics.selectionAsync();
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  function toggleMulti(key: string, value: string) {
    Haptics.selectionAsync();
    setAnswers((a) => {
      const cur = (a[key] as string[] | undefined) ?? [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { ...a, [key]: next };
    });
  }

  const slide = SLIDES[idx];
  const progress = idx === 0 ? 0 : (idx / (SLIDES.length - 1)) * 100;
  const isFirst = idx === 0;
  const isLast = idx === SLIDES.length - 1;

  function canProceed(): boolean {
    if (slide.kind === 'intro') return true;
    const val = answers[slide.key];
    if (slide.kind === 'single') return typeof val === 'string';
    return Array.isArray(val) && val.length > 0;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          {!isFirst && (
            <View style={styles.progressWrap}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          )}
          <Pressable onPress={skipAll} style={styles.skipBtn} accessibilityLabel="skip-quiz">
            <Text style={styles.skipText}>Überspringen</Text>
          </Pressable>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
          {slide.kind === 'intro' ? (
            <IntroSlide />
          ) : slide.kind === 'single' ? (
            <SingleSlide
              question={slide.question}
              options={slide.options}
              selected={answers[slide.key] as string | undefined}
              onSelect={(v) => setSingle(slide.key, v)}
            />
          ) : (
            <MultiSlide
              question={slide.question}
              options={slide.options}
              selected={(answers[slide.key] as string[] | undefined) ?? []}
              onToggle={(v) => toggleMulti(slide.key, v)}
            />
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={nextSlide}
            disabled={!canProceed() || submitting}
            style={[styles.cta, (!canProceed() || submitting) && styles.ctaDisabled]}
            accessibilityLabel="quiz-next"
          >
            {submitting ? (
              <ActivityIndicator color="#0b3b35" />
            ) : (
              <Text style={styles.ctaText}>
                {isFirst ? "Los geht's" : isLast ? 'Fertig' : 'Weiter →'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function IntroSlide() {
  return (
    <View style={styles.introWrap}>
      <Text style={styles.introEmoji}>🎯</Text>
      <Text style={styles.introTitle}>Bevor du loslegst…</Text>
      <Text style={styles.introBody}>
        Wir zeigen dir gleich {SLIDES.length - 1} kurze Fragen. Beantworte sie ehrlich — das ist{' '}
        <Text style={styles.bold}>extrem wichtig</Text>, damit dein Feed dir Setups vorschlägt, die
        wirklich zu dir passen und nicht random rauschen.
      </Text>
      <Text style={styles.introBody}>
        Dauert {SLIDES.length - 1 * 10}-30 Sekunden. Du kannst jederzeit abbrechen.
      </Text>
    </View>
  );
}

function SingleSlide({
  question,
  options,
  selected,
  onSelect,
}: {
  question: string;
  options: { value: string; label: string }[];
  selected: string | undefined;
  onSelect: (v: string) => void;
}) {
  return (
    <View>
      <Text style={styles.question}>{question}</Text>
      <View style={{ gap: 10 }}>
        {options.map((o) => (
          <TouchableOpacity
            key={o.value}
            onPress={() => onSelect(o.value)}
            style={[styles.optionRow, selected === o.value && styles.optionRowActive]}
            accessibilityLabel={`opt-${o.value}`}
          >
            <Text style={[styles.optionText, selected === o.value && styles.optionTextActive]}>
              {o.label}
            </Text>
            <View style={[styles.radio, selected === o.value && styles.radioActive]}>
              {selected === o.value && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function MultiSlide({
  question,
  options,
  selected,
  onToggle,
}: {
  question: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <View>
      <Text style={styles.question}>{question}</Text>
      <Text style={styles.multiHint}>Mehrere Antworten möglich</Text>
      <View style={styles.chipWrap}>
        {options.map((o) => {
          const active = selected.includes(o.value);
          return (
            <TouchableOpacity
              key={o.value}
              onPress={() => onToggle(o.value)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityLabel={`chip-${o.value}`}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {active ? '✓ ' : ''}
                {o.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    gap: 12,
  },
  progressWrap: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#eee', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: BRAND.teal },
  skipBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  skipText: { color: '#888', fontSize: 14, fontWeight: '700' },
  scroll: { paddingHorizontal: 22, paddingBottom: 32, minHeight: SCREEN_H * 0.6 },

  introWrap: { alignItems: 'center', paddingTop: 60, gap: 16 },
  introEmoji: { fontSize: 64 },
  introTitle: { fontSize: 24, fontWeight: '900', color: '#111', textAlign: 'center' },
  introBody: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  bold: { fontWeight: '800', color: '#111' },

  question: { fontSize: 22, fontWeight: '800', color: '#111', marginTop: 20, marginBottom: 18 },
  multiHint: { fontSize: 12, color: '#888', marginTop: -8, marginBottom: 14 },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionRowActive: { backgroundColor: 'rgba(45,212,191,0.1)', borderColor: BRAND.teal },
  optionText: { flex: 1, fontSize: 15, color: '#333', fontWeight: '500' },
  optionTextActive: { color: '#111', fontWeight: '700' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#bbb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: BRAND.tealDark },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: BRAND.teal },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#fafafa',
    borderWidth: 1.5,
    borderColor: '#eee',
  },
  chipActive: { backgroundColor: BRAND.teal, borderColor: BRAND.teal },
  chipText: { fontSize: 14, color: '#444', fontWeight: '600' },
  chipTextActive: { color: '#0b3b35', fontWeight: '800' },

  footer: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cta: {
    backgroundColor: BRAND.teal,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaDisabled: { backgroundColor: '#e5e5e5' },
  ctaText: { color: '#0b3b35', fontWeight: '900', fontSize: 15 },
});
