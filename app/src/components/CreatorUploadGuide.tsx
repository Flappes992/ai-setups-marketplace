import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BRAND } from '@/theme/ThemeProvider';

const KEY = 'setiq.creator.upload-guide.seen.v1';
const { width } = Dimensions.get('window');

interface Slide {
  icon: string;
  title: string;
  body: string;
  bullets?: { label: string; text: string }[];
}

const SLIDES: Slide[] = [
  {
    icon: '🚀',
    title: 'Dein erster Upload',
    body: 'Du bist jetzt Creator und kannst Setups verkaufen. Du behältst 85 % von jedem Kauf, die Plattform 15 % für Zahlung & Hosting.',
    bullets: [
      { label: '📹', text: 'Setup-Video (vertikal, max 60 Sek)' },
      { label: '✏️', text: 'Titel, Beschreibung, Tags' },
      { label: '🎁', text: 'Den eigentlichen „Asset" — je nach Art' },
      { label: '💶', text: 'Preis ab 5,00 €' },
    ],
  },
  {
    icon: '🎚',
    title: 'Wähle die richtige Setup-Art',
    body: 'Ganz oben im Formular wählst du eine von drei Arten — sie bestimmt was du hochlädst.',
    bullets: [
      {
        label: 'Standard',
        text: 'Custom GPT, Prompt-Stack, n8n-Workflow oder PDF/Video-Tutorial-Bundle',
      },
      {
        label: '🧠 BrainPack',
        text: 'Dein Vault (Obsidian/Logseq) als .zip — wird zur AI-Knowledge-Base',
      },
      {
        label: '🪐 ClaudePack',
        text: 'Persona + Slash-Commands + Subagents direkt im Formular bauen',
      },
    ],
  },
  {
    icon: '🎬',
    title: 'Das Video ist dein Verkäufer',
    body: 'Käufer entscheiden in den ersten 3 Sekunden ob sie weiterswipen. Zeige Ergebnis, nicht Erklärung.',
    bullets: [
      { label: '✓', text: '9:16 vertikal, in Gallery vorher aufnehmen' },
      { label: '✓', text: 'Max. 60 Sekunden — kürzer ist oft besser' },
      { label: '✓', text: 'Erste 3 Sekunden: zeig das beeindruckendste Output' },
      { label: '✓', text: 'Letzten 5 Sek: klare Empfehlung („Hol dir das Setup")' },
    ],
  },
  {
    icon: '✏️',
    title: 'Titel, Beschreibung, Tags',
    body: 'Beschreibe was der Käufer NACH dem Kauf besitzt — nicht was das Setup tut.',
    bullets: [
      { label: 'Titel', text: 'Max 80 Zeichen, konkret + Nutzen („Cold-Email Closer GPT" statt „AI-Tool")' },
      { label: 'Beschreibung', text: 'Min 20 Zeichen, max 500. Antwort auf „was kriege ich?"' },
      { label: 'Tags', text: 'Mind. 1. Nutze die Vorschläge unter dem Tag-Feld' },
      { label: 'ROI', text: 'Felder ausfüllen — „spart 15 min/Tag" ist ein starker Conversion-Trigger' },
    ],
  },
  {
    icon: '💸',
    title: 'Preis & Auszahlung',
    body: 'Verkauf läuft über Stripe, Auszahlung automatisch alle 14 Tage auf dein Bankkonto.',
    bullets: [
      { label: 'Mindestpreis', text: '5,00 € (Creator+ darf auch 0 € — Community-Setups)' },
      { label: 'Sweet-Spot', text: 'Erste 5 Verkäufe bei 9–19 € — danach hoch testen' },
      { label: 'Du bekommst', text: '85 % netto — Beispiel: 29 € Preis = 24,65 € für dich' },
      { label: 'Status', text: 'Setup geht sofort „live" nach Upload (kein Review-Delay in Phase 1)' },
    ],
  },
];

interface Props {
  /** When set, opens the guide ignoring the AsyncStorage flag */
  forceVisible?: boolean;
  onClose?: () => void;
}

export function CreatorUploadGuide({ forceVisible, onClose }: Props) {
  const [autoVisible, setAutoVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const visible = !!forceVisible || autoVisible;

  useEffect(() => {
    if (forceVisible) return;
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (!v) setAutoVisible(true);
      })
      .catch(() => {});
  }, [forceVisible]);

  function close() {
    AsyncStorage.setItem(KEY, '1').catch(() => {});
    setAutoVisible(false);
    setIndex(0);
    onClose?.();
  }

  function next() {
    if (index >= SLIDES.length - 1) {
      close();
      return;
    }
    const ni = index + 1;
    setIndex(ni);
    listRef.current?.scrollToIndex({ index: ni, animated: true });
  }

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <FlatList
            ref={listRef}
            data={SLIDES}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / SHEET_WIDTH);
              setIndex(i);
            }}
            renderItem={({ item }) => (
              <View style={styles.slide}>
                <Text style={styles.icon}>{item.icon}</Text>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                {item.bullets && (
                  <View style={styles.bulletList}>
                    {item.bullets.map((b: { label: string; text: string }, i: number) => (
                      <View key={i} style={styles.bulletRow}>
                        <View style={styles.bulletBadge}>
                          <Text style={styles.bulletLabel}>{b.label}</Text>
                        </View>
                        <Text style={styles.bulletText}>{b.text}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          />

          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={close} style={styles.skipBtn}>
              <Text style={styles.skipText}>
                {index >= SLIDES.length - 1 ? 'Schließen' : 'Überspringen'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={next}
              style={styles.ctaBtn}
              accessibilityLabel="guide-next"
            >
              <Text style={styles.ctaText}>
                {index >= SLIDES.length - 1 ? 'Los, hochladen' : 'Weiter'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const SHEET_WIDTH = width - 32;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    width: SHEET_WIDTH,
    maxHeight: '85%',
    backgroundColor: '#181B22',
    borderRadius: 22,
    paddingTop: 30,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  slide: { width: SHEET_WIDTH, paddingHorizontal: 24, alignItems: 'center' },
  icon: { fontSize: 52, marginBottom: 14 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  body: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  bulletList: { width: '100%', gap: 10 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletBadge: {
    backgroundColor: 'rgba(45,212,191,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  bulletLabel: { color: BRAND.tealLight, fontSize: 11, fontWeight: '900' },
  bulletText: { flex: 1, color: '#ddd', fontSize: 13, lineHeight: 18 },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    marginBottom: 14,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { width: 18, backgroundColor: BRAND.teal },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  skipBtn: { paddingVertical: 10 },
  skipText: { color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: '600' },
  ctaBtn: {
    backgroundColor: BRAND.teal,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
  },
  ctaText: { color: '#0b3b35', fontWeight: '800', fontSize: 14 },
});
