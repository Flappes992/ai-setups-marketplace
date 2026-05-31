import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { Setup } from '@/types/setup';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const { width } = Dimensions.get('window');
const GAP = 2;
const COLS = 3;
const ITEM = (width - GAP * (COLS - 1)) / COLS;

interface Props {
  setups: Setup[];
  emptyText: string;
}

export function SetupGrid({ setups, emptyText }: Props) {
  const navigation = useNavigation<Nav>();

  if (setups.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={setups}
      keyExtractor={(item) => item.id}
      numColumns={COLS}
      scrollEnabled={false}
      contentContainerStyle={styles.list}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('SetupDetail', { setup: item })}
          style={styles.cell}
        >
          <Image source={{ uri: item.videoThumbnail }} style={styles.thumb} />
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{Math.round(item.priceCents / 100)}€</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 32 },
  row: { gap: GAP, marginBottom: GAP },
  cell: {
    width: ITEM,
    height: ITEM * 1.5,
    backgroundColor: '#111',
    overflow: 'hidden',
  },
  thumb: { width: '100%', height: '100%' },
  priceBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priceText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: { color: '#888', fontSize: 14 },
});
