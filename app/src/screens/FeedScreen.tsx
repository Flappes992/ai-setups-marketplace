import {
  View,
  FlatList,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SetupCard } from '@/components/SetupCard';
import { SetupCardSkeleton } from '@/components/SetupCardSkeleton';
import { Setup } from '@/types/setup';
import { MainStackParamList } from '@/navigation/RootNavigator';
import { useSetups } from '@/hooks/useSetups';

const { height } = Dimensions.get('window');

type FeedNav = NativeStackNavigationProp<MainStackParamList, 'Tabs'>;

export function FeedScreen() {
  const navigation = useNavigation<FeedNav>();
  const { setups, loading, error, refetch } = useSetups();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" />

      <View style={styles.topBar} pointerEvents="box-none">
        <Text style={styles.brandText}>setiq</Text>
      </View>

      {loading ? (
        <SetupCardSkeleton />
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Konnte Setups nicht laden</Text>
          <Text style={styles.stateSubtext}>{error.message}</Text>
        </View>
      ) : setups.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Noch keine Setups</Text>
          <Text style={styles.stateSubtext}>Sei der erste Creator und lade dein Setup hoch.</Text>
        </View>
      ) : (
        <FlatList<Setup>
          data={setups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('SetupDetail', { setup: item })}
              accessibilityRole="button"
              accessibilityLabel={`Setup öffnen: ${item.title}`}
            >
              <SetupCard setup={item} />
            </TouchableOpacity>
          )}
          pagingEnabled
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#fff" />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  brandText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  stateText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  stateSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
});
