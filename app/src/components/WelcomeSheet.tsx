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

const KEY = 'setiq.onboarded.v1';
const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: '🎯',
    title: 'Willkommen bei Setiq',
    body: 'Entdecke AI-Setups die andere bereits gebaut haben — Custom GPTs, Prompt-Stacks, Workflows, Tutorials. Alles sofort einsetzbar.',
  },
  {
    icon: '⚡',
    title: 'Swipe wie auf TikTok',
    body: 'Wisch hoch und runter durch den Feed. Doppel-tap zum Liken, Stern zum Speichern, das Plus oben zum Hochladen eigener Setups.',
  },
  {
    icon: '💸',
    title: 'Verkauf oder Kauf',
    body: 'Käufer zahlen einmalig, du behältst 85 %. Plattform-Provision: 15 %. Auszahlung via Stripe, sicher und automatisch.',
  },
] as const;

export function WelcomeSheet() {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (!v) setVisible(true);
      })
      .catch(() => {});
  }, []);

  function close() {
    AsyncStorage.setItem(KEY, '1').catch(() => {});
    setVisible(false);
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
            data={SLIDES as unknown as (typeof SLIDES)[number][]}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / (width - 48));
              setIndex(i);
            }}
            renderItem={({ item }) => (
              <View style={styles.slide}>
                <Text style={styles.icon}>{item.icon}</Text>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
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
              <Text style={styles.skipText}>Überspringen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={next}
              style={styles.ctaBtn}
              accessibilityLabel="welcome-next"
            >
              <Text style={styles.ctaText}>
                {index >= SLIDES.length - 1 ? "Los geht's" : 'Weiter'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const SHEET_WIDTH = width - 48;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    width: SHEET_WIDTH,
    backgroundColor: '#181B22',
    borderRadius: 22,
    paddingTop: 36,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  slide: {
    width: SHEET_WIDTH,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  icon: { fontSize: 60, marginBottom: 18 },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 18,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    width: 18,
    backgroundColor: BRAND.teal,
  },
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
  },
  ctaText: { color: '#0b3b35', fontWeight: '800', fontSize: 14 },
});
