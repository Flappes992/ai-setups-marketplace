import {
  View,
  FlatList,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SetupCard } from '@/components/SetupCard';
import { mockSetups } from '@/mocks/setups';
import { Setup } from '@/types/setup';
import { MainStackParamList } from '@/navigation/RootNavigator';

const { height } = Dimensions.get('window');

type FeedNav = NativeStackNavigationProp<MainStackParamList, 'Feed'>;

export function FeedScreen() {
  const navigation = useNavigation<FeedNav>();

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
      <FlatList<Setup>
        data={mockSetups}
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
});
