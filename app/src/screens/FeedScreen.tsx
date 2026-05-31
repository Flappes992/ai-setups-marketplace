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

type FeedNav = NativeStackNavigationProp<MainStackParamList, 'Feed'>;

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
      <TouchableOpacity
        style={styles.profileBadge}
        onPress={() => navigation.navigate('Profile')}
        accessibilityLabel="open-profile"
      >
        <Text style={styles.profileBadgeText}>Profil</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.uploadFab}
        onPress={() => navigation.navigate('SetupUpload')}
        accessibilityLabel="open-upload"
      >
        <Text style={styles.uploadFabText}>+</Text>
      </TouchableOpacity>

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
  profileBadge: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  profileBadgeText: {
    color: '#111',
    fontSize: 13,
    fontWeight: '700',
  },
  uploadFab: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    zIndex: 10,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  uploadFabText: {
    color: '#111',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
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
