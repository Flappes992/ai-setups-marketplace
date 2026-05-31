import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { useMySetups } from '@/hooks/useMySetups';
import { Setup } from '@/types/setup';
import { supabase } from '@/services/supabase';
import { useToast } from '@/components/Toast';

type MySetupsNav = NativeStackNavigationProp<MainStackParamList, 'MySetups'>;

type RowSetup = Setup & { status: string };

function formatPriceEur(cents: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export function MySetupsScreen() {
  const navigation = useNavigation<MySetupsNav>();
  const { setups, loading, error, refetch } = useMySetups();
  const toast = useToast();
  const [sheetSetup, setSheetSetup] = useState<RowSetup | null>(null);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  async function handleStatusToggle(setup: RowSetup) {
    const nextStatus = setup.status === 'live' ? 'draft' : 'live';
    const { error: e } = await supabase
      .from('setups')
      .update({ status: nextStatus })
      .eq('id', setup.id);
    if (e) {
      toast.show(`Fehler: ${e.message}`, 'error');
    } else {
      toast.show(`Setup ist jetzt ${nextStatus}`, 'success');
      setSheetSetup(null);
      refetch();
    }
  }

  function handleDelete(setup: RowSetup) {
    setSheetSetup(null);
    Alert.alert('Setup löschen', `„${setup.title}" wird unwiderruflich gelöscht.`, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          const { error: e } = await supabase.from('setups').delete().eq('id', setup.id);
          if (e) toast.show(`Fehler: ${e.message}`, 'error');
          else {
            toast.show('Setup gelöscht', 'success');
            refetch();
          }
        },
      },
    ]);
  }

  function openSheet(setup: RowSetup) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSheetSetup(setup);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="back">
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Meine Setups</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      ) : setups.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.bigEmoji}>📤</Text>
          <Text style={styles.emptyText}>Du hast noch keine Setups hochgeladen.</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => navigation.navigate('SetupUpload')}
          >
            <Text style={styles.uploadButtonText}>Erstes Setup hochladen</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={setups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <SetupRow
              setup={item}
              onTap={() => navigation.navigate('SetupDetail', { setup: item })}
              onLongPress={() => openSheet(item)}
            />
          )}
        />
      )}

      <Modal
        visible={!!sheetSetup}
        transparent
        animationType="fade"
        onRequestClose={() => setSheetSetup(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSheetSetup(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{sheetSetup?.title}</Text>
          <SheetItem
            label={sheetSetup?.status === 'live' ? 'Pausieren (Draft)' : 'Veröffentlichen (Live)'}
            onPress={() => sheetSetup && handleStatusToggle(sheetSetup)}
          />
          <SheetItem
            label="Bearbeiten"
            onPress={() => {
              setSheetSetup(null);
              Alert.alert('Bearbeiten', 'Folgt in Phase 5');
            }}
          />
          <SheetItem label="Statistiken anzeigen" onPress={() => Alert.alert('Stats', 'Folgt')} />
          <SheetItem
            label="Löschen"
            destructive
            onPress={() => sheetSetup && handleDelete(sheetSetup)}
          />
          <SheetItem label="Abbrechen" onPress={() => setSheetSetup(null)} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SetupRow({
  setup,
  onTap,
  onLongPress,
}: {
  setup: RowSetup;
  onTap: () => void;
  onLongPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onTap}
      onLongPress={onLongPress}
      delayLongPress={400}
    >
      <Image source={{ uri: setup.videoThumbnail }} style={styles.thumb} />
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {setup.title}
        </Text>
        <Text style={styles.rowMeta}>
          {formatPriceEur(setup.priceCents)} ·{' '}
          <Text style={setup.status === 'live' ? styles.statusLive : styles.statusOther}>
            {setup.status}
          </Text>
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function SheetItem({
  label,
  onPress,
  destructive,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.sheetItem} onPress={onPress}>
      <Text style={[styles.sheetItemText, destructive && { color: '#cc0000' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backIcon: { fontSize: 30, color: '#111', width: 28, lineHeight: 32 },
  title: { fontSize: 18, fontWeight: '800', color: '#111' },
  list: { paddingHorizontal: 16, gap: 10, paddingBottom: 32 },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  bigEmoji: { fontSize: 48, marginBottom: 14 },
  emptyText: { color: '#666', textAlign: 'center', marginBottom: 16 },
  errorText: { color: '#cc0000', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 10,
    gap: 12,
    alignItems: 'center',
  },
  thumb: { width: 56, height: 80, borderRadius: 8, backgroundColor: '#ccc' },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  rowMeta: { fontSize: 13, color: '#666', marginTop: 4 },
  statusLive: { color: '#16a34a', fontWeight: '700' },
  statusOther: { color: '#888', fontWeight: '700' },
  chevron: { fontSize: 22, color: '#bbb' },
  uploadButton: {
    backgroundColor: '#111',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  uploadButtonText: { color: '#fff', fontWeight: '700' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  sheetItem: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  sheetItemText: { fontSize: 16, color: '#111', fontWeight: '600' },
});
