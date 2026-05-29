import {
  View,
  FlatList,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SetupCard } from '@/components/SetupCard';
import { Setup } from '@/types/setup';
import { MainStackParamList } from '@/navigation/RootNavigator';
import { useSetups } from '@/hooks/useSetups';

const { height } = Dimensions.get('window');

type FeedNav = NativeStackNavigationProp<MainStackParamList, 'Feed'>;

export function FeedScreen() {
  const navigation = useNavigation<FeedNav>();
  const { setups, loading, error } = useSetups();

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

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
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
