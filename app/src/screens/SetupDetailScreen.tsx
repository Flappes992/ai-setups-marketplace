import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Setup } from '@/types/setup';

interface SetupDetailScreenProps {
  setup: Setup;
}

function formatPriceEur(cents: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export function SetupDetailScreen({ setup }: SetupDetailScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: setup.videoThumbnail }} style={styles.hero} resizeMode="cover" />

        <View style={styles.body}>
          <Text style={styles.title}>{setup.title}</Text>

          <View style={styles.creatorRow}>
            <Image source={{ uri: setup.creator.avatarUrl }} style={styles.avatar} />
            <View>
              <Text style={styles.creatorName}>{setup.creator.displayName}</Text>
              <Text style={styles.creatorMeta}>
                ★ {setup.creator.ratingAverage.toFixed(1)} · {setup.creator.setupsCount} Setups
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Über das Setup</Text>
          <Text style={styles.description}>{setup.description}</Text>

          <Text style={styles.sectionTitle}>Über {setup.creator.displayName}</Text>
          <Text style={styles.description}>{setup.creator.bio}</Text>

          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagRow}>
            {setup.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Asset-Typ</Text>
          <Text style={styles.description}>
            {setup.assetType === 'clonable'
              ? 'Klonbares Template — sofort verfügbar nach Kauf'
              : 'PDF + Video-Tutorial Bundle'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.purchaseBar}>
        <TouchableOpacity style={styles.purchaseButton} activeOpacity={0.85}>
          <Text style={styles.purchaseButtonText}>
            Setup holen · {formatPriceEur(setup.priceCents)}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingBottom: 120,
  },
  hero: {
    width: '100%',
    height: 300,
    backgroundColor: '#222',
  },
  body: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#ccc',
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  creatorMeta: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 13,
    color: '#444',
  },
  purchaseBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  purchaseButton: {
    backgroundColor: '#111',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
